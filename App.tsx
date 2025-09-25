import React, { useState, useEffect, useMemo, Suspense, lazy, useRef } from 'react';
import { InvestigationState, ResearchStep, Source, StepFeedback } from './types';
import { createResearchPlanPrompt, createExecuteStepPrompt, createFinalReportPrompt } from './constants';
import { generateContent, generateContentWithEnhancedSources } from './services/geminiService';
import { MedicalContextEngine, MedicalContext } from './contextEngineering';
import { MedicalValidationService, DisclaimerGenerator } from './medicalValidation';
import { EnhancedMedicalReasoning, ClinicalReasoning, ReasoningIntegration } from './enhancedReasoning';
import { OphthalmologyKnowledgeGraph } from './ophthalmologyKnowledge';
import { QualityAssuranceEngine, QualityCheck } from './qualityAssurance';
import { localStorageService, StoredInvestigation } from './services/localStorageService';
import { PDFService } from './services/pdfService';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorDisplay from './components/ErrorDisplay';
import Spinner, { MobileLoadingCard } from './components/Spinner';
import useSwipeGesture from './hooks/useSwipeGesture';
import { AudioRecorder } from './components/AudioRecorder';
import { EnhancedDataForm } from './components/EnhancedDataForm';
import DocumentCapture from './components/DocumentCapture';
import { EnhancedPatientData } from './types/enhancedDataTypes';
import { MedicalDataExtractionService } from './services/medicalDataExtraction';
import StepFeedbackModal from './components/StepFeedbackModal';
import SplashScreen from './components/SplashScreen';
import MedicalImageUploader from './components/MedicalImageUploader';
import ImageAnalysisResults from './components/ImageAnalysisResults';
import ImageAnalysisAnnouncement from './components/ImageAnalysisAnnouncement';
import ErrorBoundary from './components/ErrorBoundary';
import { MedicalImageAnalysis } from './types/medicalImageTypes';
import {
  Mic,
  Camera,
  Zap,
  CheckCircle,
  Loader2,
  XCircle,
  Circle,
  X,
  ClipboardCheck,
  Plus,
  Info,
  Check,
  Clock,
  Copy,
  Edit,
  FileText,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

// Lazy load heavy components
const ExplanationModal = lazy(() => import('./components/ExplanationModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const EnhancedReportDisplay = lazy(() => import('./components/EnhancedReportDisplay'));
// Import ReactMarkdown normally since it's needed for step rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ResearchModeSelector, { ResearchMode } from './components/ResearchModeSelector';
import { ResearchOrchestrator, ResearchRequest } from './services/researchOrchestrator';

const InitialQueryInput: React.FC<{
  onSubmit: (query: string, mode?: ResearchMode) => void;
  onSubmitEnhanced: (data: EnhancedPatientData) => void;
  isLoading: boolean;
}> = ({ onSubmit, onSubmitEnhanced, isLoading }) => {
  const [inputMode, setInputMode] = useState<'quick' | 'structured'>('quick');
  const [age, setAge] = useState<number>(0);
  const [sex, setSex] = useState<'M' | 'F' | ''>('');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showDocumentCapture, setShowDocumentCapture] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<EnhancedPatientData> | null>(null);
  const [selectedResearchMode, setSelectedResearchMode] = useState<ResearchMode>('auto');
  const [showModeSelector, setShowModeSelector] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicalInfo.trim() && age > 0 && sex) {
      const sexLabel = sex === 'M' ? 'Masculino' : sex === 'F' ? 'Femenino' : 'No especificado';
      const fullQuery = `Paciente de ${age} años, sexo ${sexLabel}.
---
Síntomas y Antecedentes Clínicos:
${clinicalInfo.trim()}`;
      onSubmit(fullQuery, selectedResearchMode);
    }
  };

  const handleModeSelection = (mode: ResearchMode) => {
    setSelectedResearchMode(mode);
    setShowModeSelector(false);
  };

  const handleAudioTranscription = async (transcription: string, medicalInfo?: any) => {
    // Si hay información médica estructurada, usarla para pre-llenar campos
    if (medicalInfo) {
      if (medicalInfo.age) setAge(medicalInfo.age);
      if (medicalInfo.sex) setSex(medicalInfo.sex);
    }
    
    // Usar la transcripción como información clínica
    setClinicalInfo(transcription);
    setShowAudioRecorder(false);

    // Extraer datos estructurados de la transcripción
    try {
      const { structuredData } = await MedicalDataExtractionService.extractFromAudioTranscription(transcription);
      setExtractedData(structuredData);
      
      // Pre-llenar campos básicos si están disponibles
      if (structuredData.age) setAge(structuredData.age);
      if (structuredData.sex && (structuredData.sex === 'M' || structuredData.sex === 'F')) {
        setSex(structuredData.sex);
      }
    } catch (error) {
      console.error('Error extrayendo datos estructurados:', error);
    }
  };

  const handleAudioError = (error: string) => {
    console.error('Error en grabación de audio:', error);
    // Aquí podrías mostrar un toast o mensaje de error
  };

  const handleDocumentDataExtracted = (data: any) => {
    console.log('Datos extraídos del documento:', data);
    setExtractedData(data);
    
    // Pre-llenar campos básicos si están disponibles
    if (data.age) setAge(data.age);
    if (data.sex && (data.sex === 'M' || data.sex === 'F')) {
      setSex(data.sex);
    }
    if (data.clinicalInfo?.chiefComplaint) {
      setClinicalInfo(data.clinicalInfo.chiefComplaint);
    }
    
    setShowDocumentCapture(false);
  };

  const handleDocumentError = (error: string) => {
    console.error('Error en captura de documento:', error);
  };


  const isFormInvalid = isLoading || !clinicalInfo.trim() || age <= 0 || !sex;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-center py-4 lg:py-8 px-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Header Section - Enhanced Medical Professional Style */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-8 py-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <ClipboardCheck className="h-7 w-7 text-slate-800" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Sistema de Investigación Clínica</h1>
                <p className="text-slate-200 text-sm lg:text-base font-medium">Especializada en Oftalmología</p>
              </div>
            </div>
            <p className="text-slate-200 max-w-4xl mx-auto leading-relaxed text-base">
              Plataforma avanzada para análisis clínico basado en evidencia médica, protocolos de investigación sistemática y fuentes académicas verificadas.
            </p>
          </div>

          <div className="p-8 lg:p-10">
          
          {/* Mode Selector - Enhanced */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Selecciona el Tipo de Evaluación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setInputMode('quick')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  inputMode === 'quick'
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Consulta Rápida</h4>
                </div>
                <p className="text-slate-600 text-sm">
                  Ingreso rápido de datos básicos del paciente. Ideal para consultas iniciales y casos urgentes.
                </p>
                <div className="mt-3 text-xs text-slate-500 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>~2 minutos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClipboardCheck className="h-3 w-3" />
                    <span>Datos básicos</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('structured')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  inputMode === 'structured'
                    ? 'border-slate-800 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <ClipboardCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Evaluación Completa</h4>
                </div>
                <p className="text-slate-600 text-sm">
                  Formulario estructurado completo con todos los campos médicos detallados para evaluación exhaustiva.
                </p>
                <div className="mt-3 text-xs text-slate-500 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>~5-7 minutos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClipboardCheck className="h-3 w-3" />
                    <span>Evaluación detallada</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Research Mode Selector */}
          {showModeSelector && (
            <ResearchModeSelector
              onModeSelect={handleModeSelection}
              patientData={{
                age: age || undefined,
                sex: sex || undefined,
                clinicalInfo: clinicalInfo || undefined
              }}
              isLoading={isLoading}
            />
          )}

          {/* Content based on selected mode */}
          {!showModeSelector && inputMode === 'quick' ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Quick Entry Form - Enhanced */}
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-slate-800 mb-2">Datos del Paciente</h4>
                  <p className="text-slate-600 text-sm">Complete la información básica para iniciar la investigación clínica.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label htmlFor="age" className="block text-base font-bold text-slate-800">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                          <Clock className="h-3 w-3 text-blue-600" />
                        </div>
                        Edad del Paciente <span className="text-red-600">*</span>
                      </div>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="age"
                            value={age || ''}
                            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-base font-medium shadow-sm hover:border-slate-400"
                            placeholder="Ej: 65"
                            min="1"
                            max="120"
                            required
                        />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 text-base font-semibold">años</span>
                     </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="sex" className="block text-base font-bold text-slate-800">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mr-2">
                          <Circle className="h-3 w-3 text-green-600" />
                        </div>
                        Sexo <span className="text-red-600">*</span>
                      </div>
                    </label>
                         <select
                            id="sex"
                            value={sex}
                        onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}
                        className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-base font-medium shadow-sm hover:border-slate-400"
                            required
                        >
                        <option value="" disabled>Seleccionar sexo...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        </select>
                     </div>
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="clinical-info" className="block text-base font-bold text-slate-800">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center mr-2">
                        <ClipboardCheck className="h-3 w-3 text-purple-600" />
            </div>
                      Motivo de Consulta y Antecedentes <span className="text-red-600">*</span>
                    </div>
                  </label>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-semibold text-blue-800">Información Requerida</h5>
                        <p className="text-xs text-blue-700 mt-1">
                          Sea específico y detallado. Incluya: síntomas actuales, tiempo de evolución, antecedentes, medicamentos, alergias conocidas.
                        </p>
                      </div>
                    </div>
                  </div>

                 <textarea
                    id="clinical-info"
                    value={clinicalInfo}
                    onChange={(e) => setClinicalInfo(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-base resize-none font-medium shadow-sm hover:border-slate-400"
                    placeholder="Ejemplo detallado:&#10;&#10;Paciente presenta disminución de agudeza visual bilateral de 3 semanas de evolución, más pronunciada en ojo derecho. Refiere dolor ocular moderado, especialmente nocturno, acompañado de halos alrededor de las luces.&#10;&#10;Antecedentes: Diabetes mellitus tipo 2 de 10 años de evolución, hipertensión arterial controlada.&#10;&#10;Medicamentos: Metformina 850mg BID, Enalapril 10mg QD&#10;&#10;Sin alergias conocidas a medicamentos."
                    required
                />
                  
                  {/* Herramientas de Captura - Enhanced */}
                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3">Herramientas de Captura (Opcional)</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                        className={`flex items-center justify-center space-x-3 px-4 py-3 font-medium rounded-xl transition-all duration-200 border-2 ${
                          showAudioRecorder
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Mic className="h-5 w-5" />
                        <span>{showAudioRecorder ? 'Ocultar Grabación' : 'Grabar Audio'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDocumentCapture(!showDocumentCapture)}
                        className={`flex items-center justify-center space-x-3 px-4 py-3 font-medium rounded-xl transition-all duration-200 border-2 ${
                          showDocumentCapture
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Camera className="h-5 w-5" />
                        <span>{showDocumentCapture ? 'Ocultar Cámara' : 'Capturar Expediente'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Transcripción de Voz */}
                  {showAudioRecorder && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <AudioRecorder
                        onTranscriptionComplete={handleAudioTranscription}
                        onError={handleAudioError}
                      />
                    </div>
                  )}

                  {/* Captura de Documentos */}
                  {showDocumentCapture && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <DocumentCapture
                        onDataExtracted={handleDocumentDataExtracted}
                        onError={handleDocumentError}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit Button - Enhanced */}
              <div className="pt-8 border-t border-slate-200">
                <div className="space-y-4">
                  <div className="text-center">
                    <h5 className="text-lg font-bold text-slate-800 mb-2">¿Listo para Iniciar?</h5>
                    <p className="text-sm text-slate-600">
                      Su investigación clínica se basará en protocolos médicos sistemáticos y fuentes académicas verificadas.
                    </p>
            </div>
           
            <button
              type="submit"
              disabled={isFormInvalid}
                    className="w-full flex justify-center items-center py-5 px-8 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Spinner />
                          <span className="ml-3">Iniciando Protocolo de Investigación...</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowModeSelector(true)}
                          className="ml-4 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        >
                          Cancelar
            </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                          <Zap className="h-5 w-5" />
                        </div>
                        Iniciar Protocolo de Investigación
                      </>
                    )}
                  </button>
                </div>
              </div>
          </form>
          ) : (
            /* Structured Form Mode */
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-slate-800 mb-2">Evaluación Completa del Paciente</h4>
                <p className="text-slate-600 text-sm">Formulario estructurado para evaluación médica detallada y sistemática.</p>
              </div>
              <EnhancedDataForm
                onSubmit={onSubmitEnhanced}
                onCancel={() => setInputMode('quick')}
                initialData={extractedData || undefined}
                isLoading={isLoading}
              />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Optimized without nested cards */}
      <div className="lg:hidden">
        {/* Mobile Header - Compact */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-4 py-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <ClipboardCheck className="h-6 w-6 text-slate-800" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Investigación Clínica</h1>
              <p className="text-slate-200 text-sm font-medium">Oftalmología</p>
            </div>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            Análisis basado en evidencia médica
          </p>
        </div>

        {/* Mobile Content - Direct, no nested cards */}
        <div className="px-4 py-6 space-y-6">
          {/* Mode Selector - Mobile */}
          <div className="">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Selecciona el Tipo de Evaluación</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setInputMode('quick')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${inputMode === 'quick' ? 'border-slate-800 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Consulta Rápida</h4>
                </div>
                <p className="text-slate-600 text-sm">
                  Ingreso rápido para casos urgentes (~2 min)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInputMode('structured')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${inputMode === 'structured' ? 'border-slate-800 bg-white shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Evaluación Completa</h4>
                </div>
                <p className="text-slate-600 text-sm">
                  Formulario completo y detallado (~5-7 min)
                </p>
              </button>
            </div>
          </div>

          {/* Research Mode Selector - Mobile */}
          {showModeSelector && (
            <ResearchModeSelector
              onModeSelect={handleModeSelection}
              patientData={{
                age: age || undefined,
                sex: sex || undefined,
                clinicalInfo: clinicalInfo || undefined
              }}
              isLoading={isLoading}
            />
          )}

          {/* Quick Form - Mobile (Direct, no container card) */}
          {!showModeSelector && inputMode === 'quick' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Data Header */}
              <div className="mb-4">
                <h4 className="text-lg font-bold text-slate-800 mb-1">Datos del Paciente</h4>
                <p className="text-slate-600 text-sm">Complete la información para iniciar la investigación.</p>
              </div>

              {/* Age and Sex - Mobile */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="age-mobile" className="block text-sm font-bold text-slate-800">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-blue-100 rounded-md flex items-center justify-center mr-2">
                        <Clock className="h-3 w-3 text-blue-600" />
                      </div>
                      Edad <span className="text-red-600">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="age-mobile"
                      value={age || ''}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm font-medium shadow-sm hover:border-slate-400 bg-white"
                      placeholder="65"
                      min="1"
                      max="120"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">años</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="sex-mobile" className="block text-sm font-bold text-slate-800">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-green-100 rounded-md flex items-center justify-center mr-2">
                        <Circle className="h-3 w-3 text-green-600" />
                      </div>
                      Sexo <span className="text-red-600">*</span>
                    </div>
                  </label>
                  <select
                    id="sex-mobile"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}
                    className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm font-medium shadow-sm hover:border-slate-400 bg-white"
                    required
                  >
                    <option value="" disabled>Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              {/* Clinical Info - Mobile */}
              <div className="space-y-3">
                <label htmlFor="clinical-info-mobile" className="block text-sm font-bold text-slate-800">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-purple-100 rounded-md flex items-center justify-center mr-2">
                      <ClipboardCheck className="h-3 w-3 text-purple-600" />
                    </div>
                    Motivo de Consulta y Antecedentes <span className="text-red-600">*</span>
                  </div>
                </label>

                {/* Info Box - Mobile */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-semibold text-blue-800">Información Requerida</h5>
                      <p className="text-xs text-blue-700 mt-1">
                        Incluya síntomas, tiempo de evolución, antecedentes, medicamentos y alergias.
                      </p>
                    </div>
                  </div>
                </div>

                <textarea
                  id="clinical-info-mobile"
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-sm resize-none font-medium shadow-sm hover:border-slate-400 bg-white"
                  placeholder="Ejemplo: Paciente presenta disminución de agudeza visual bilateral de 3 semanas de evolución...&#10;&#10;Antecedentes: Diabetes mellitus tipo 2, hipertensión arterial.&#10;&#10;Medicamentos: Metformina 850mg BID, Enalapril 10mg QD"
                  required
                />

                {/* Capture Tools - Mobile */}
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Herramientas Adicionales</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-2 ${showAudioRecorder ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <Mic className="h-4 w-4" />
                      <span>Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDocumentCapture(!showDocumentCapture)}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-2 ${showDocumentCapture ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <Camera className="h-4 w-4" />
                      <span>Cámara</span>
                    </button>
                  </div>
                </div>

                {/* Audio Recorder - Mobile */}
                {showAudioRecorder && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <AudioRecorder
                      onTranscriptionComplete={handleAudioTranscription}
                      onError={handleAudioError}
                    />
                  </div>
                )}

                {/* Document Capture - Mobile */}
                {showDocumentCapture && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <DocumentCapture
                      onDataExtracted={handleDocumentDataExtracted}
                      onError={handleDocumentError}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Submit Section - Mobile */}
              <div className="pt-6 border-t border-slate-200">
                <div className="text-center mb-4">
                  <h5 className="text-base font-bold text-slate-800 mb-1">¿Listo para Iniciar?</h5>
                  <p className="text-sm text-slate-600">
                    Se creará un protocolo de investigación personalizado
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isFormInvalid}
                  className="w-full flex justify-center items-center py-4 px-6 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-3" />
                      Creando Protocolo...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-3" />
                      Iniciar Investigación Clínica
                    </>
                  )}
                </button>

                {isFormInvalid && (
                  <div className="mt-3 flex items-center justify-center text-sm text-slate-500">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Complete todos los campos requeridos
                  </div>
                )}
              </div>
            </form>
          )}

          {/* Enhanced Form - Mobile */}
          {!showModeSelector && inputMode === 'structured' && (
            <div className="">
              <EnhancedDataForm
                onSubmit={onSubmitEnhanced}
                onCancel={() => setInputMode('quick')}
                initialData={extractedData || undefined}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusIcon: React.FC<{ status: ResearchStep['status'] }> = ({ status }) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'in-progress':
            return <Loader2 className="animate-spin h-5 w-5 text-blue-500" />;
        case 'error':
             return <XCircle className="h-5 w-5 text-red-500" />;
        default:
            return <Circle className="h-5 w-5 text-slate-400" />;
    }
};

const App: React.FC = () => {
  const [investigation, setInvestigation] = useState<InvestigationState | null>(null);
  const [activeView, setActiveView] = useState<{ type: 'step' | 'report'; id: number | null }>({ type: 'step', id: 1 });
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const [isCopied, setIsCopied] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<number | null>(null);
  const [isMobileSidebarCollapsed, setIsMobileSidebarCollapsed] = useState(false);
  
  // Medical Context Engine State
  const [medicalContext, setMedicalContext] = useState<MedicalContext | null>(null);
  
  // Enhanced Medical Reasoning State
  const [clinicalReasoning, setClinicalReasoning] = useState<ClinicalReasoning | null>(null);
  
  // Quality Assurance State
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  
  // Local Storage State
  const [investigationHistory, setInvestigationHistory] = useState<StoredInvestigation[]>([]);
  const [currentInvestigationId, setCurrentInvestigationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStepFeedback, setShowStepFeedback] = useState(false);
  const [currentStepForFeedback, setCurrentStepForFeedback] = useState<{id: number, title: string} | null>(null);
  
  // Medical Image Analysis State
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [imageAnalyses, setImageAnalyses] = useState<MedicalImageAnalysis[]>([]);
  const [showImageResults, setShowImageResults] = useState(false);
  const [showImageAnnouncement, setShowImageAnnouncement] = useState(false);
  
  // Refs for swipe gesture
  const contentRef = useRef<HTMLDivElement>(null);

  // Load investigation history and recover active investigation on mount
  React.useEffect(() => {
    const loadInvestigationData = () => {
      try {
        // Load investigation history
        const history = localStorageService.getInvestigationHistory();
        setInvestigationHistory(history.investigations);

        // Try to recover active investigation
        const activeInvestigation = localStorageService.getActiveInvestigation();
        if (activeInvestigation) {
          setInvestigation(activeInvestigation.investigation);
          setCurrentInvestigationId(activeInvestigation.id);
          
          // Extract patient info for context
          const patientInfo = activeInvestigation.patientInfo;
          console.log('Recovered active investigation:', activeInvestigation.id);
        }
      } catch (error) {
        console.error('Error loading investigation data:', error);
      }
    };

    loadInvestigationData();
  }, []);

  const handleEnhancedFormSubmit = (data: EnhancedPatientData) => {
    // Convertir datos estructurados a query de texto para compatibilidad
    const sexLabel = data.sex === 'M' ? 'Masculino' : data.sex === 'F' ? 'Femenino' : 'No especificado';
    const query = `Paciente de ${data.age} años, sexo ${sexLabel}.
---
Motivo de Consulta:
${data.clinicalInfo?.chiefComplaint || ''}

Historia de la Enfermedad Actual:
${data.clinicalInfo?.historyOfPresentIllness || ''}

Antecedentes Médicos:
${data.systemicDiseases?.join(', ') || 'No especificados'}

Medicamentos Actuales:
${data.currentMedications?.map(med => `${med.name} ${med.dosage} ${med.frequency}`).join(', ') || 'Ninguno'}

Alergias:
${data.allergies?.map(allergy => `${allergy.substance} (${allergy.reaction})`).join(', ') || 'Ninguna conocida'}`;

    handleStartInvestigation(query);
  };

  const handleStartInvestigation = async (query: string, mode: ResearchMode = 'auto') => {
    try {
      console.log(`Starting investigation with mode: ${mode}`);
      
      // Initialize medical context from query (preserve existing logic)
      const initialContext = MedicalContextEngine.parseInitialContext(query);
      setMedicalContext(initialContext);

      // Extract patient information for enhanced reasoning
      const patientInfo = {
        age: initialContext.patientProfile.age || 65,
        sex: initialContext.patientProfile.sex || 'no especificado',
        history: initialContext.patientProfile.medicalHistory
      };
      
      // Generate initial clinical reasoning
      const symptoms = initialContext.patientProfile.currentSymptoms.length > 0 
        ? initialContext.patientProfile.currentSymptoms.map(s => s.description)
        : ['síntomas no específicos'];
      const findings = Object.values(initialContext.clinicalFindings).filter(f => f !== null) as string[];
      
      const initialReasoning = EnhancedMedicalReasoning.synthesizeReasoning(
        symptoms,
        patientInfo,
        findings,
        ['initial_query']
      );
      
      setClinicalReasoning(initialReasoning);

      // Set initial loading state
      const loadingInvestigation: InvestigationState = {
        originalQuery: query,
        plan: [],
        currentStep: 0,
        isGenerating: true,
        error: null,
        finalReport: null,
        finalReportSources: null,
        isGeneratingReport: false,
      };
      
      setInvestigation(loadingInvestigation);
    setActiveView({ type: 'step', id: 1 });

      // Create research request for orchestrator
      const researchRequest: ResearchRequest = {
        query,
        mode: mode === 'auto' ? 'auto' : mode,
        patientContext: {
          age: initialContext.patientProfile.age,
          sex: initialContext.patientProfile.sex as 'M' | 'F' | undefined,
          symptoms,
          complexity: symptoms.length > 3 ? 'complex' : symptoms.length > 1 ? 'moderate' : 'simple',
          urgency: 'routine'
        },
        preferences: {
          preferredSources: ['pubmed', 'cochrane', 'aao'],
          maxTimeMinutes: 10,
          detailLevel: 'detailed'
        }
      };

      // Use Research Orchestrator
      const orchestrator = ResearchOrchestrator.getInstance();
      const completedInvestigation = await orchestrator.conductResearch(researchRequest);
      
      console.log('Investigation completed:', completedInvestigation);
      
      setInvestigation(completedInvestigation);
      
      // Always show step navigation first, regardless of mode
      // This allows users to see the process and add feedback
      setActiveView({ type: 'step', id: 1 });

      // Extract patient info for storage
      const patientInfoForStorage = {
        age: initialContext.patientProfile.age?.toString() || 'No especificado',
        sex: initialContext.patientProfile.sex || 'No especificado',
        symptoms: symptoms.join(', ') || 'No especificados'
      };

      // Save investigation to localStorage
      const investigationId = localStorageService.saveInvestigation(completedInvestigation, patientInfoForStorage);
      setCurrentInvestigationId(investigationId);
      
      // Update history
      const history = localStorageService.getInvestigationHistory();
      setInvestigationHistory(history.investigations);
      
    } catch (error) {
      console.error('Investigation failed:', error);
    setInvestigation(prev => prev ? {
        ...prev,
        error: `Investigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        isGenerating: false
    } : null);
    }
  };

  const handleExecuteNextStep = async () => {
    if (!investigation || investigation.currentStep >= investigation.plan.length) return;

    const currentStepIndex = investigation.currentStep;
    setActiveView({ type: 'step', id: currentStepIndex + 1 });

    setInvestigation(prev => {
        if (!prev) return null;
        const newPlan = [...prev.plan];
        newPlan[currentStepIndex].status = 'in-progress';
        return {...prev, plan: newPlan, isGenerating: true, error: null };
    });

    const currentStepInfo = investigation.plan[currentStepIndex];
    
    // Enhanced prompt with preserved medical context
    let enhancedOriginalQuery = investigation.originalQuery;
    if (medicalContext) {
      const contextSummary = MedicalContextEngine.generateContextSummary(medicalContext);
      enhancedOriginalQuery = `${investigation.originalQuery}\n\n### CONTEXTO MÉDICO ACTUALIZADO ###\n${contextSummary}`;
    }
    
    const prompt = createExecuteStepPrompt(enhancedOriginalQuery, investigation.plan, currentStepInfo);
    
    const { text: resultText, sources: resultSources } = await generateContent(prompt, true, enhancedOriginalQuery);
    
    // Debug sources
    console.log('Generated sources:', resultSources);
    console.log('Sources count:', resultSources?.length || 0);
    
    // Validate and enhance sources with medical validation
    const { validatedSources, quality, contradictions } = await MedicalValidationService.validateAndEnhanceSources(resultSources);
    
    // Debug validated sources
    console.log('Validated sources:', validatedSources);
    console.log('Validated sources count:', validatedSources?.length || 0);

    // Perform quality assurance check
    const qualityCheck = QualityAssuranceEngine.performQualityCheck(
      currentStepIndex + 1,
      currentStepInfo.title,
      resultText,
      validatedSources
    );

    // Store quality check results
    setQualityChecks(prev => [...prev, qualityCheck]);

    setInvestigation(prev => {
        if (!prev) return null;
        const newPlan = [...prev.plan];
        
        if (resultText.startsWith('Ocurrió un error:')) {
            newPlan[currentStepIndex].status = 'error';
            newPlan[currentStepIndex].result = resultText;
            return {...prev, plan: newPlan, isGenerating: false, error: resultText };
        }

        // Update medical context with new findings
        if (medicalContext) {
          const updatedContext = MedicalContextEngine.updateContext(medicalContext, resultText, validatedSources, quality);
          setMedicalContext(updatedContext);
        }

        // Use the result text directly without quality notes
        const finalResult = resultText;

        newPlan[currentStepIndex].status = 'completed';
        newPlan[currentStepIndex].result = finalResult;
        newPlan[currentStepIndex].sources = validatedSources;
        
        const updatedInvestigation = {
            ...prev,
            plan: newPlan,
            currentStep: prev.currentStep + 1,
            isGenerating: false,
        };

        // Auto-save after step completion
        if (currentInvestigationId) {
          const patientInfo = {
            age: medicalContext?.patientProfile.age || 'No especificado',
            sex: medicalContext?.patientProfile.sex || 'No especificado',
            symptoms: medicalContext?.patientProfile.currentSymptoms.map(s => s.description).join(', ') || 'No especificados'
          };
          
          localStorageService.updateInvestigation(currentInvestigationId, updatedInvestigation);
          console.log('Investigation auto-saved after step completion');
        }

        return updatedInvestigation;
    });

    // Don't auto-navigate - let user manually navigate to next step
    // This allows users to read the result at their own pace
  };
  
  const handleGenerateReport = async () => {
    if (!investigation) {
      console.log('No investigation available');
      return;
    }
    
    const completedSteps = investigation.plan.filter(step => step.status === 'completed');
    console.log('Total steps:', investigation.plan.length);
    console.log('Completed steps:', completedSteps.length);
    console.log('Step statuses:', investigation.plan.map(s => ({ id: s.id, status: s.status })));
    
    if (completedSteps.length === 0) {
      console.log('No completed steps to generate report');
      return;
    }
    
    setInvestigation(prev => prev ? {...prev, isGeneratingReport: true, error: null } : null);
    // Navigate to report view when generation starts
    setActiveView({ type: 'report', id: null });
    
    // Enhanced prompt with final medical context
    let enhancedQuery = investigation.originalQuery;
    if (medicalContext) {
      const finalContextSummary = MedicalContextEngine.generateContextSummary(medicalContext);
      enhancedQuery = `${investigation.originalQuery}\n\n### CONTEXTO MÉDICO FINAL ###\n${finalContextSummary}`;
    }
    
    const prompt = createFinalReportPrompt(enhancedQuery, completedSteps);
    
    const { text: reportText, sources: reportSources, error: generationError, enhancedSources, qualityMetrics, sourcesBreakdown } = await generateContentWithEnhancedSources(prompt, enhancedQuery);

    // Verificar si hubo error en la generación
    if (generationError) {
      console.error('Error en generación de reporte:', generationError);
      setInvestigation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          error: generationError.message,
          isGeneratingReport: false,
          generationError: generationError
        };
      });
      return;
    }

    // Validate and enhance report sources
    const { validatedSources, disclaimers } = await MedicalValidationService.validateAndEnhanceSources(reportSources);

    setInvestigation(prev => {
        if (!prev) return null;
        if (reportText.startsWith('Ocurrió un error:')) {
            return {...prev, error: reportText, isGeneratingReport: false };
        }
        
        // Store the report without adding disclaimers (they are shown in the UI component)
        const finalInvestigation = {
          ...prev, 
          finalReport: reportText, 
          finalReportSources: validatedSources, 
          isGeneratingReport: false,
          enhancedSources: enhancedSources || [],
          qualityMetrics: qualityMetrics || {
            averageQuality: 0,
            highQualityCount: 0,
            openAccessCount: 0,
            recentPublications: 0
          },
          sourcesBreakdown: sourcesBreakdown || {
            pubmed: 0,
            google: 0,
            cochrane: 0,
            clinical_trials: 0,
            other: 0
          }
        };

        // Auto-save final report
        if (currentInvestigationId) {
          const patientInfo = {
            age: medicalContext?.patientProfile.age || 'No especificado',
            sex: medicalContext?.patientProfile.sex || 'No especificado',
            symptoms: medicalContext?.patientProfile.currentSymptoms.map(s => s.description).join(', ') || 'No especificados'
          };
          
          localStorageService.updateInvestigation(currentInvestigationId, finalInvestigation);
          console.log('Final report auto-saved');
        }

        // Clear active investigation after report completion
        localStorageService.clearActiveInvestigation();
        setCurrentInvestigationId(null);
        console.log('Active investigation cleared after report completion');

        return finalInvestigation;
    });
  };
  
  const handleCopyReport = () => {
    if (investigation?.finalReport) {
      navigator.clipboard.writeText(investigation.finalReport).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleCopyStep = (stepId: number) => {
    if (!investigation) return;
    
    const step = investigation.plan.find(s => s.id === stepId);
    if (!step || !step.result) return;

    // Crear contenido formateado para copiar
    let contentToCopy = `Paso ${step.id}: ${step.title}\n\n`;
    contentToCopy += step.result;
    
    if (step.sources && step.sources.length > 0) {
      contentToCopy += `\n\nFuentes consultadas:\n`;
      step.sources.forEach((source, index) => {
        contentToCopy += `${index + 1}. ${source.web.title || source.web.uri}\n`;
        contentToCopy += `   ${source.web.uri}\n\n`;
      });
    }

    navigator.clipboard.writeText(contentToCopy).then(() => {
      setCopiedStepId(stepId);
      setTimeout(() => setCopiedStepId(null), 2000);
    });
  };


  const handleReset = () => {
      setInvestigation(null);
      setCurrentInvestigationId(null);
      setMedicalContext(null);
      setClinicalReasoning(null);
      setQualityChecks([]);
  }

  const handleNewInvestigation = () => {
    // Limpiar localStorage completamente
    localStorageService.clearAllData();
    setInvestigation(null);
    setCurrentInvestigationId(null);
    setMedicalContext(null);
    setClinicalReasoning(null);
    setQualityChecks([]);
    setInvestigationHistory([]);
    console.log('🆕 Nueva investigación iniciada - localStorage limpiado');
  };

  const handleCancelInvestigation = () => {
    if (investigation) {
      // Marcar investigación como cancelada
      const cancelledInvestigation = {
        ...investigation,
        isGenerating: false,
        isGeneratingReport: false,
        status: 'cancelled' as const,
        cancelledAt: new Date().toISOString()
      };
      
      // Actualizar en localStorage
      if (currentInvestigationId) {
        localStorageService.updateInvestigation(currentInvestigationId, cancelledInvestigation);
      }
      
      // Resetear estados
      setInvestigation(null);
      setCurrentInvestigationId(null);
      setMedicalContext(null);
      setClinicalReasoning(null);
      setQualityChecks([]);
      
      console.log('Investigación cancelada');
    }
  };

  // Load investigation from history
  const handleLoadInvestigation = (investigationId: string) => {
    try {
      const storedInvestigation = localStorageService.getInvestigation(investigationId);
      if (storedInvestigation) {
        setInvestigation(storedInvestigation.investigation);
        setCurrentInvestigationId(investigationId);
        setActiveView({ type: 'step', id: 1 });
        setShowHistory(false);
        console.log('Investigation loaded:', investigationId);
      }
    } catch (error) {
      console.error('Error loading investigation:', error);
    }
  };

  // Delete investigation from history
  const handleDeleteInvestigation = (investigationId: string) => {
    try {
      const success = localStorageService.deleteInvestigation(investigationId);
      if (success) {
        // Update local state
        const history = localStorageService.getInvestigationHistory();
        setInvestigationHistory(history.investigations);
        
        // If deleted investigation was active, reset
        if (currentInvestigationId === investigationId) {
          handleReset();
        }
        console.log('Investigation deleted:', investigationId);
      }
    } catch (error) {
      console.error('Error deleting investigation:', error);
    }
  };

  // Export investigation
  const handleExportInvestigation = (investigationId: string) => {
    try {
      const jsonData = localStorageService.exportInvestigation(investigationId);
      if (jsonData) {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investigacion-${investigationId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Investigation exported:', investigationId);
      }
    } catch (error) {
      console.error('Error exporting investigation:', error);
    }
  };

  // Handle step feedback from specialist
  const handleStepFeedback = (feedback: StepFeedback) => {
    if (!investigation) return;

    setInvestigation(prev => {
      if (!prev) return null;
      const newPlan = [...prev.plan];
      const stepIndex = newPlan.findIndex(step => step.id === feedback.stepId);
      if (stepIndex !== -1) {
        newPlan[stepIndex].feedback = feedback;
      }
      return { ...prev, plan: newPlan };
    });

    // Auto-save with feedback
    if (currentInvestigationId) {
      const patientInfo = {
        age: medicalContext?.patientProfile.age?.toString() || 'No especificado',
        sex: medicalContext?.patientProfile.sex === 'male' ? 'M' : medicalContext?.patientProfile.sex === 'female' ? 'F' : 'No especificado',
        symptoms: medicalContext?.patientProfile.currentSymptoms?.map(s => s.description).join(', ') || 'No especificado'
      };
      localStorageService.updateInvestigation(currentInvestigationId, investigation);
    }

    console.log('Step feedback saved:', feedback);
  };

  // Open feedback modal for completed step
  const handleOpenStepFeedback = (stepId: number, stepTitle: string) => {
    setCurrentStepForFeedback({ id: stepId, title: stepTitle });
    setShowStepFeedback(true);
  };

  // Handle medical image analysis
  const handleImageAnalysisComplete = (analysis: MedicalImageAnalysis) => {
    setImageAnalyses(prev => [...prev, analysis]);
    setShowImageResults(true);
  };

  const handleImageAnalysisError = (error: string) => {
    console.error('Error en análisis de imagen:', error);
    
    // Mostrar error más amigable para cuota excedida
    if (error.includes('Cuota de API excedida')) {
      alert(`ADVERTENCIA: ${error}\n\nPara continuar usando el análisis de imágenes:\n• Espera hasta mañana para que se reinicie la cuota\n• O actualiza tu plan de Gemini API para obtener más requests`);
    } else {
      alert(`Error en análisis de imagen: ${error}`);
    }
  };

  const handleCloseImageResults = () => {
    setShowImageResults(false);
  };

  const handleOpenImageUploader = () => {
    setShowImageUploader(true);
  };

  const handleCloseImageUploader = () => {
    setShowImageUploader(false);
  };

  const handleCloseImageAnnouncement = () => {
    setShowImageAnnouncement(false);
  };

  // Copy investigation summary to clipboard
  const handleCopyInvestigation = (investigationId: string) => {
    try {
      const storedInvestigation = localStorageService.getInvestigation(investigationId);
      if (storedInvestigation) {
        const { investigation, patientInfo } = storedInvestigation;
        
        let summary = `INVESTIGACIÓN OFTALMOLÓGICA\n`;
        summary += `Fecha: ${new Date(storedInvestigation.createdAt).toLocaleDateString('es-ES')}\n`;
        summary += `Paciente: ${patientInfo.age} años, ${patientInfo.sex}\n`;
        summary += `Síntomas: ${patientInfo.symptoms}\n\n`;
        
        if (investigation.plan && investigation.plan.length > 0) {
          summary += `PLAN DE INVESTIGACIÓN:\n`;
          investigation.plan.forEach((step: any, index: number) => {
            const status = step.status === 'completed' ? '[COMPLETADO]' : step.status === 'in-progress' ? '[EN PROGRESO]' : '[PENDIENTE]';
            summary += `${index + 1}. ${status} ${step.title}\n`;
          });
          summary += `\n`;
        }
        
        if (investigation.finalReport) {
          summary += `REPORTE FINAL:\n`;
          // Extraer solo las primeras líneas del reporte para el resumen
          const reportLines = investigation.finalReport.split('\n').slice(0, 10);
          summary += reportLines.join('\n');
          if (investigation.finalReport.split('\n').length > 10) {
            summary += `\n... (reporte completo disponible en la aplicación)`;
          }
        }
        
        summary += `\n\nGenerado por Agente de Investigación Clínica de Oftalmología - 4ailabs`;
        
        navigator.clipboard.writeText(summary).then(() => {
          console.log('Investigation summary copied to clipboard');
          // Mostrar notificación visual (opcional)
          alert('Resumen copiado al portapapeles');
        }).catch((error) => {
          console.error('Error copying to clipboard:', error);
          alert('Error al copiar al portapapeles');
        });
      }
    } catch (error) {
      console.error('Error copying investigation:', error);
    }
  };

  // Export investigation as PDF
  const handleExportPDF = async (investigationId: string) => {
    try {
      const storedInvestigation = localStorageService.getInvestigation(investigationId);
      if (storedInvestigation) {
        await PDFService.generateInvestigationPDF(storedInvestigation);
        console.log('PDF generated successfully:', investigationId);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  // Export investigation summary as PDF
  const handleExportSummaryPDF = async (investigationId: string) => {
    try {
      const storedInvestigation = localStorageService.getInvestigation(investigationId);
      if (storedInvestigation) {
        await PDFService.generateSummaryPDF(storedInvestigation);
        console.log('Summary PDF generated successfully:', investigationId);
      }
    } catch (error) {
      console.error('Error generating summary PDF:', error);
      alert('Error al generar el PDF de resumen');
    }
  };

  // Navigation functions for swipe gestures
  const navigateToNextStep = () => {
    if (!investigation) return;
    
    if (activeView.type === 'step') {
      const currentStepId = activeView.id;
      const maxStepId = investigation.plan.length;
      
      if (currentStepId && currentStepId < maxStepId) {
        // Go to next step
        const nextStep = investigation.plan.find(step => step.id === currentStepId + 1);
        if (nextStep && nextStep.status !== 'pending') {
          setActiveView({ type: 'step', id: currentStepId + 1 });
        }
      } // Removed automatic navigation to final report - let user choose when to view it
    }
  };

  const navigateToPreviousStep = () => {
    if (!investigation) return;
    
    if (activeView.type === 'report') {
      // Go back to last step
      const lastStep = investigation.plan[investigation.plan.length - 1];
      if (lastStep && lastStep.status === 'completed') {
        setActiveView({ type: 'step', id: lastStep.id });
      }
    } else if (activeView.type === 'step') {
      const currentStepId = activeView.id;
      if (currentStepId && currentStepId > 1) {
        // Go to previous step
        const prevStep = investigation.plan.find(step => step.id === currentStepId - 1);
        if (prevStep && prevStep.status === 'completed') {
          setActiveView({ type: 'step', id: currentStepId - 1 });
        }
      }
    }
  };

  // Setup swipe gestures for mobile navigation
  useSwipeGesture(contentRef, {
    threshold: 100,
    onSwipeLeft: navigateToNextStep,
    onSwipeRight: navigateToPreviousStep,
    preventScroll: false
  });

  const activeContent = useMemo(() => {
    if (!investigation) return null;
    if (activeView.type === 'report') {
        return {
            title: "Reporte Clínico Final",
            content: investigation.finalReport,
            sources: investigation.finalReportSources,
            status: investigation.isGeneratingReport ? 'in-progress' : 'completed',
        };
    }
    const step = investigation.plan.find(s => s.id === activeView.id);
    if (!step) return null;
    return {
        title: `Paso ${step.id}: ${step.title}`,
        content: step.result,
        sources: step.sources,
        status: step.status
    };
  }, [investigation, activeView]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/30 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
      <Header 
        onShowExplanation={() => setShowExplanation(true)} 
        onShowHistory={() => setShowHistory(true)}
        onShowImageUploader={handleOpenImageUploader}
        investigationCount={investigationHistory.length}
      />
      {showExplanation && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
              <Spinner />
              <p className="mt-4 text-slate-600">Cargando guía...</p>
            </div>
          </div>
        }>
          <ExplanationModal onClose={() => setShowExplanation(false)} />
        </Suspense>
      )}
      
      {showHistory && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
              <Spinner />
              <p className="mt-4 text-slate-600">Cargando historial...</p>
            </div>
          </div>
        }>
          <HistoryModal
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            investigations={investigationHistory}
            onLoadInvestigation={handleLoadInvestigation}
            onDeleteInvestigation={handleDeleteInvestigation}
            onExportInvestigation={handleExportInvestigation}
            onCopyInvestigation={handleCopyInvestigation}
            onExportPDF={handleExportPDF}
            onExportSummaryPDF={handleExportSummaryPDF}
            currentInvestigationId={currentInvestigationId}
          />
        </Suspense>
      )}
      <div className="flex-1 flex flex-col">
      {!investigation ? (
        <InitialQueryInput 
          onSubmit={handleStartInvestigation} 
          onSubmitEnhanced={handleEnhancedFormSubmit} 
          isLoading={investigation?.isGenerating ?? false}
        />
      ) : investigation.isGenerating && investigation.plan.length === 0 ? (
         <div className="relative">
           <MobileLoadingCard 
             title="Creando Plan de Investigación"
             description="Nuestro agente de IA está analizando el caso y diseñando un plan de investigación personalizado basado en evidencia médica."
           />
           <div className="mt-4 flex justify-center">
             <button
               onClick={handleCancelInvestigation}
               className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors duration-200"
             >
               <X className="h-4 w-4 mr-2" />
               Cancelar Investigación
             </button>
           </div>
         </div>
      ) : (
          <main className="bg-slate-50">
            {/* Mobile Layout */}
            <div className="lg:hidden">
              <div className="max-w-7xl mx-auto py-2 sm:py-4 px-2 sm:px-4">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {/* Mobile Control Panel */}
                  <div className="bg-white rounded-lg shadow-lg border-2 border-slate-200">
                    {/* Mobile Sidebar Header - Always Visible */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center mr-3">
                          <ClipboardCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">Caso Clínico Activo</h2>
                          <p className="text-xs text-slate-600 font-medium">Protocolo de Investigación</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsMobileSidebarCollapsed(!isMobileSidebarCollapsed)}
                          className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                          title={isMobileSidebarCollapsed ? "Mostrar panel de control" : "Ocultar panel de control"}
                        >
                          {isMobileSidebarCollapsed ? (
                            <ArrowDown className="h-5 w-5 text-slate-700" />
                          ) : (
                            <ArrowUp className="h-5 w-5 text-slate-700" />
                          )}
                        </button>
                        <button
                          onClick={handleNewInvestigation}
                          className="flex items-center px-3 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          <span>Nuevo</span>
                        </button>
                        {investigation?.isGenerating && (
                          <button
                            onClick={handleCancelInvestigation}
                            className="flex items-center px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200"
                          >
                            <X className="h-4 w-4 mr-1" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`transition-all duration-300 overflow-hidden ${
                      isMobileSidebarCollapsed ? 'max-h-0' : 'max-h-none'
                    }`}>
                      <div className="p-4 sm:p-5">
                        {/* Patient Info - Mobile */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5">
                          <div className="text-sm text-slate-800 space-y-2">
                            {investigation.originalQuery ? investigation.originalQuery.split('\n---\n').map((section, index) => {
                              if (index === 0) {
                                return (
                                  <div key={index} className="font-bold text-slate-900 text-sm border-b border-slate-300 pb-2">
                                    {section.trim()}
                                  </div>
                                );
                              } else {
                                const symptoms = section.replace('Síntomas y Antecedentes Clínicos:', '').trim();
                                const truncated = symptoms.length > 120 ? symptoms.substring(0, 120) + '...' : symptoms;
                                return (
                                  <div key={index} className="text-slate-700">
                                    <div className="text-sm font-semibold text-slate-600 mb-2">Motivo de Consulta:</div>
                                    <div className="text-sm leading-relaxed" title={symptoms}>
                                      {truncated}
                                    </div>
                                  </div>
                                );
                              }
                            }) : (
                              <div className="text-sm text-slate-500 font-medium">Cargando información del caso...</div>
                            )}
                          </div>
                        </div>

                    {/* Progress Indicator - Mobile */}
                    <div className="my-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-800">Estado del Protocolo</span>
                        <span className="text-sm text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                          {investigation.plan.filter(step => step.status === 'completed').length}/{investigation.plan.length} Completados
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 border border-slate-300">
                        <div
                          className="bg-gradient-to-r from-slate-700 to-slate-800 h-2 rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${(investigation.plan.filter(step => step.status === 'completed').length / investigation.plan.length) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Navigation - Mobile */}
                    <nav className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-slate-900">Protocolo de Investigación</h3>
                      </div>
                      <ul className="space-y-2">
                                {investigation.plan.map(step => (
                                    <li key={step.id}>
                            <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => setActiveView({ type: 'step', id: step.id })}
                                disabled={step.status === 'pending'}
                                className={`flex-1 text-left flex items-start p-3 rounded-xl text-sm transition-all duration-200 min-w-0 w-full min-h-[56px] ${
                                                activeView.type === 'step' && activeView.id === step.id 
                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border border-blue-200 shadow-sm'
                                    : step.status === 'completed'
                                    ? 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                                    : step.status === 'in-progress'
                                    ? 'text-slate-500 hover:bg-slate-50 cursor-wait'
                                    : 'text-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                           <StatusIcon status={step.status} />
                                </div>
                                <div className="flex-1 min-w-0 ml-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-left break-words leading-tight pr-2">
                                      <span className="text-sm font-medium">
                                        {step.title || "Paso sin título"}
                                      </span>
                                    </span>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      {step.status === 'completed' && (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      )}
                                      {step.status === 'in-progress' && (
                                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                      )}
                                      {step.status === 'pending' && (
                                        <Clock className="h-4 w-4 text-slate-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                        </button>
                              {step.status === 'completed' && (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleCopyStep(step.id)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title="Copiar este paso"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenStepFeedback(step.id, step.title)}
                                    className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center border ${
                                      step.feedback
                                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 bg-green-50'
                                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200'
                                    }`}
                                    title={step.feedback ? "Ver/Editar feedback del especialista" : "Agregar feedback del especialista"}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                                    </li>
                                ))}
                                {investigation.finalReport && (
                                     <li>
                                        <button 
                              onClick={() => setActiveView({ type: "report", id: null })}
                              className={`w-full text-left flex items-center p-3 rounded-xl text-sm transition-all duration-200 min-h-[56px] ${
                                activeView.type === "report"
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold border border-green-200 shadow-sm"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="h-3 w-3 text-white" />
                              </div>
                              <span className="ml-3 flex-1">Reporte Final</span>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </nav>

                    {/* Action Buttons - Mobile */}
                    <div className="pt-4 border-t-2 border-slate-300 space-y-3">
                            {investigation.currentStep < investigation.plan.length && (
                                <button
                                    onClick={handleExecuteNextStep}
                                    disabled={investigation.isGenerating}
                          className="w-full flex justify-center items-center py-4 px-6 bg-slate-800 text-white font-bold rounded-xl shadow-xl hover:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-base"
                        >
                          {investigation.isGenerating ? (
                            <>
                              <Spinner />
                              <span className="ml-3">Ejecutando Protocolo...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-5 w-5 mr-3" />
                              Ejecutar Paso {investigation.currentStep + 1}
                            </>
                          )}
                                </button>
                            )}
                      {investigation.plan.some(step => step.status === 'completed') && !investigation.finalReport && (
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={investigation.isGeneratingReport}
                          className="w-full flex justify-center items-center py-4 px-6 bg-emerald-700 text-white font-bold rounded-xl shadow-xl hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-base"
                        >
                          {investigation.isGeneratingReport ? (
                            <>
                              <Spinner />
                              <span className="ml-3">Generando Reporte...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-5 w-5 mr-3" />
                              Generar Reporte Clínico
                            </>
                          )}
                                </button>
                            )}
                      {!investigation.plan.some(step => step.status === 'completed') && !investigation.finalReport && (
                        <div className="w-full flex justify-center items-center py-4 px-6 bg-slate-100 text-slate-600 font-semibold rounded-xl text-base border-2 border-slate-200">
                          <AlertTriangle className="h-5 w-5 mr-3" />
                          Complete al menos un paso del protocolo para generar el reporte
                        </div>
                      )}
                    </div>

                    {investigation.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-red-700 text-xs">{investigation.error}</p>
                        </div>
                      </div>
                    )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Content Area */}
                  <div className="bg-gradient-to-br from-white to-slate-50/30 p-6 rounded-xl shadow-lg border border-slate-200 min-h-[50vh] relative">
                        {activeContent ? (
                            <div>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {activeView.type === 'step' ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                  <ClipboardCheck className="h-6 w-6 text-blue-600" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                  <FileText className="h-6 w-6 text-green-600" />
                                </div>
                              )}
                              <div>
                                <h2 className="text-lg font-bold text-slate-900">{activeContent.title}</h2>
                                <div className="flex items-center mt-1">
                                  <StatusIcon status={activeContent.status as ResearchStep['status']} />
                                  <span className="ml-2 text-sm text-slate-600">
                                    {activeContent.status === 'completed' ? 'Completado' :
                                     activeContent.status === 'in-progress' ? 'En progreso' :
                                     activeContent.status === 'error' ? 'Error' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {activeView.type === 'step' && activeContent.status === 'completed' && (
                                        <button
                                onClick={() => handleCopyStep(activeView.id!)}
                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                              >
                                <Copy className="h-4 w-4" />
                                <span>{copiedStepId === activeView.id ? '¡Copiado!' : 'Copiar Paso'}</span>
                                        </button>
                                    )}
                                </div>
                        </div>

                        {/* Content */}
                                {activeContent.status === 'in-progress' ? (
                          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Spinner/>
                                    </div>
                            <p className="text-lg font-medium">Procesando información...</p>
                            <p className="text-sm mt-1">Por favor espera mientras analizamos los datos</p>
                                    </div>
                        ) : activeContent.content && activeContent.content.trim() ? (
                          activeView.type === 'report' ? (
                            investigation?.generationError ? (
                              <ErrorDisplay
                                error={investigation.generationError}
                                onRetry={handleGenerateReport}
                                showDetails={true}
                              />
                            ) : (
                              <Suspense fallback={<div className="flex items-center justify-center h-32"><Spinner /></div>}>
                                <EnhancedReportDisplay
                                  content={activeContent.content}
                                  sources={activeContent.sources}
                                  onCopy={handleCopyReport}
                                  isCopied={isCopied}
                                  investigationSteps={investigation?.plan || []}
                                  enhancedSources={investigation?.enhancedSources}
                                  qualityMetrics={investigation?.qualityMetrics}
                                  sourcesBreakdown={investigation?.sourcesBreakdown}
                                />
                              </Suspense>
                            )
                          ) : (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                              <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({children}) => <h1 className="text-lg mb-4">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-base mb-3">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-sm mb-2">{children}</h3>,
                                    p: ({children}) => <p className="text-sm mb-3 leading-6">{children}</p>,
                                    ul: ({children}) => <ul className="text-sm mb-3 pl-4 space-y-1">{children}</ul>,
                                    ol: ({children}) => <ol className="text-sm mb-3 pl-4 space-y-1">{children}</ol>,
                                    a: ({href, children}) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                                        title={`Abrir enlace: ${href}`}
                                      >
                                        {children}
                                      </a>
                                    )
                                  }}
                                >
                                  {activeContent.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-center text-slate-500 py-16">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                              <FileText className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-lg font-medium">Este paso aún no se ha ejecutado</p>
                            <p className="text-sm mt-1">Ejecuta el paso desde el panel de control</p>
                                    </div>
                                )}

                        {/* Medical Sources for mobile steps */}
                        {activeView.type !== 'report' && activeContent.sources && activeContent.sources.length > 0 && (
                          <div className="mt-8">
                            <div className="flex items-center mb-4">
                              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                <FileText className="h-5 w-5 text-indigo-600" />
                              </div>
                              <h4 className="text-base font-semibold text-slate-800">Fuentes Consultadas</h4>
                              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                                {activeContent.sources.length} fuente{activeContent.sources.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                              <ul className="space-y-4">
                                {activeContent.sources.map((source, index) => {
                                  const isOpenAccess = source.web.uri.includes('pubmed.ncbi.nlm.nih.gov') ||
                                                     source.web.uri.includes('cochrane.org') ||
                                                     source.web.uri.includes('clinicaltrials.gov') ||
                                                     source.web.uri.includes('aao.org');

                                  const isSubscription = source.web.uri.includes('uptodate.com') ||
                                                        source.web.uri.includes('medscape.com') ||
                                                        source.web.uri.includes('thelancet.com') ||
                                                        source.web.uri.includes('jama.ama-assn.org') ||
                                                        source.web.uri.includes('nejm.org');

                                  const accessIndicator = isOpenAccess ? '✓' : isSubscription ? '🔒' : '!';
                                  const accessMessage = isOpenAccess ? 'Acceso abierto' :
                                                      isSubscription ? 'Requiere suscripción' : 'Acceso limitado';

                                  return (
                                    <li key={index} className="flex items-start group">
                                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
                                        {index + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <a
                                            href={source.web.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-sm transition-all duration-200 group-hover:bg-blue-50 p-3 rounded-lg -m-3 border border-transparent hover:border-blue-200"
                                            title={`Abrir: ${source.web.uri}`}
                                          >
                                                        {source.web.title || source.web.uri}
                                                    </a>
                                          <span className="text-lg" title={accessMessage}>
                                            {accessIndicator}
                                          </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                          <div className="flex items-center">
                                            <ArrowUp className="h-3 w-3 mr-2 flex-shrink-0" />
                                            <span className="truncate font-mono">{source.web.uri}</span>
                                          </div>
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            isOpenAccess ? 'bg-green-100 text-green-800' :
                                            isSubscription ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {accessMessage}
                                          </span>
                                        </div>
                                      </div>
                                                </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Navigation Buttons for Mobile Steps */}
                        {activeView.type === 'step' && investigation && (
                          <div className="mt-8 flex flex-col gap-3">
                            {/* Previous Step Button */}
                            {activeView.id && activeView.id > 1 && (
                              <button
                                onClick={() => {
                                  const prevStep = investigation.plan.find(step => step.id === activeView.id! - 1);
                                  if (prevStep && prevStep.status === 'completed') {
                                    setActiveView({ type: 'step', id: activeView.id! - 1 });
                                  }
                                }}
                                className="flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <ArrowDown className="h-4 w-4 mr-2" />
                                Paso Anterior
                              </button>
                            )}

                            {/* Next Step Button */}
                            {activeView.id && activeView.id < investigation.plan.length && (
                              <button
                                onClick={() => {
                                  const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                  if (nextStep) {
                                    if (nextStep.status === 'completed') {
                                      setActiveView({ type: 'step', id: activeView.id! + 1 });
                                    } else if (nextStep.status === 'pending') {
                                      handleExecuteNextStep();
                                    }
                                  }
                                }}
                                className={`flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                                  (() => {
                                    const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                    if (nextStep && nextStep.status === 'completed') {
                                      return 'bg-blue-600 hover:bg-blue-700 text-white';
                                    } else if (nextStep && nextStep.status === 'pending') {
                                      return 'bg-green-600 hover:bg-green-700 text-white';
                                    }
                                    return 'bg-blue-600 hover:bg-blue-700 text-white';
                                  })()
                                }`}
                              >
                                {(() => {
                                  const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                  if (nextStep && nextStep.status === 'completed') {
                                    return 'Siguiente Paso';
                                  } else if (nextStep && nextStep.status === 'pending') {
                                    return 'Ejecutar Siguiente';
                                  }
                                  return 'Siguiente Paso';
                                })()}
                                {(() => {
                                  const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                  if (nextStep && nextStep.status === 'completed') {
                                    return <ChevronRight className="h-4 w-4 ml-2" />;
                                  } else if (nextStep && nextStep.status === 'pending') {
                                    return <Zap className="h-4 w-4 ml-2" />;
                                  }
                                  return <ChevronRight className="h-4 w-4 ml-2" />;
                                })()}
                              </button>
                            )}

                            {/* Final Report Button */}
                            {activeView.id && activeView.id === investigation.plan.length && investigation.finalReport && (
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={() => setActiveView({ type: 'report', id: null })}
                                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  Ver Reporte Final
                                  <FileText className="h-4 w-4 ml-2" />
                                </button>

                                <button
                                  onClick={handleGenerateReport}
                                  disabled={investigation?.isGeneratingReport}
                                  className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  {investigation?.isGeneratingReport ? 'Regenerando...' : 'Regenerar Reporte'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-lg font-medium">Selecciona un paso para ver los detalles</p>
                        <p className="text-sm mt-1">Usa el panel de control para explorar la investigación</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-1 h-full">
                {/* Sidebar: Steps Navigation */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm h-full min-w-0">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50">
                        {/* Header - Medical Professional Style */}
                        <div className="pb-3 border-b-2 border-slate-300">
                             <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center mr-3">
                                        <ClipboardCheck className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Caso Clínico</h2>
                                        <p className="text-sm text-slate-600 font-medium">Protocolo de Investigación</p>
                                    </div>
                                </div>
                                <div className="flex space-x-1 flex-shrink-0">
                                    <button 
                                        onClick={handleNewInvestigation} 
                                        className="flex items-center px-2 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-all duration-200 shadow-sm"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span>Nuevo</span>
                                </button>
                                    {investigation?.isGenerating && (
                                        <button 
                                            onClick={handleCancelInvestigation} 
                                            className="flex items-center px-2 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 shadow-sm"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            <span>Cancelar</span>
                                        </button>
                                    )}
                             </div>
                        </div>

                             {/* Patient Info - Compact */}
                             <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                 <div className="text-sm text-slate-800 space-y-2">
                                     {investigation.originalQuery ? investigation.originalQuery.split('\n---\n').map((section, index) => {
                                         if (index === 0) {
                                             // Patient demographics (first line)
                                             return (
                                                 <div key={index} className="font-bold text-slate-900 text-sm border-b border-slate-300 pb-2">
                                                     {section.trim()}
                                                 </div>
                                             );
                                         } else {
                                             // Clinical symptoms (truncated for sidebar)
                                             const symptoms = section.replace('Síntomas y Antecedentes Clínicos:', '').trim();
                                             const truncated = symptoms.length > 80 ? symptoms.substring(0, 80) + '...' : symptoms;
                                             return (
                                                 <div key={index} className="text-slate-700">
                                                     <div className="text-xs font-semibold text-slate-600 mb-1">Motivo:</div>
                                                     <div className="text-xs leading-relaxed" title={symptoms}>
                                                         {truncated}
                                                     </div>
                                                 </div>
                                             );
                                         }
                                     }) : (
                                         <div className="text-xs text-slate-500 font-medium">Cargando información del caso...</div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        {/* Progress Indicator - Compact */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-800">Progreso</span>
                                <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-full">
                                    {investigation.plan.filter(step => step.status === 'completed').length}/{investigation.plan.length}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 border border-slate-300 shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-slate-700 to-slate-800 h-2 rounded-full transition-all duration-500 shadow-sm"
                                    style={{
                                        width: `${(investigation.plan.filter(step => step.status === 'completed').length / investigation.plan.length) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>


                        {/* Steps Navigation - Optimized Layout */}
                        <div className="relative flex-1 min-h-0">
                            {/* Scroll Indicator - Top Gradient */}
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
                            
                            <nav className="mt-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400 px-2">
                            {/* Header Card - Compact */}
                            <div className="bg-white p-2 rounded-lg border border-slate-200 mb-3 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-sm font-bold text-slate-900">Plan de Investigación</h3>
                                    <div className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full flex-shrink-0">
                                        <ClipboardCheck className="h-3 w-3" />
                                        <span className="font-medium">Activo</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600">
                                    Metodología sistemática
                                </p>
                            </div>
                            
                            {/* Steps Container - Contained */}
                            <div className="space-y-2 w-full">
                                {investigation.plan.map((step, index) => (
                                    <div key={step.id} className="relative">
                                        {/* Step Card - Contained Width */}
                                        <button
                                            onClick={() => setActiveView({ type: 'step', id: step.id })}
                                            disabled={step.status === 'pending'}
                                            className={`w-full text-left p-2 pl-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow border relative max-w-full overflow-hidden ${
                                                activeView.type === 'step' && activeView.id === step.id
                                                    ? 'bg-blue-50 text-blue-800 border-blue-200 shadow'
                                                    : step.status === 'completed'
                                                    ? 'text-slate-700 hover:bg-slate-50 bg-white border-slate-200 hover:border-slate-300'
                                                    : step.status === 'in-progress'
                                                    ? 'text-slate-700 bg-yellow-50 border-yellow-200 cursor-wait'
                                                    : 'text-slate-500 bg-slate-50 border-slate-200 disabled:cursor-not-allowed opacity-75'
                                            }`}
                                        >
                                           {/* Step Number Badge - Inside Button */}
                                           <div className="absolute -left-1 top-2 z-10">
                                               <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border ${
                                                   step.status === 'completed' ? 'bg-green-500 border-green-600 text-white' :
                                                   step.status === 'in-progress' ? 'bg-blue-500 border-blue-600 text-white animate-pulse' :
                                                   'bg-slate-200 border-slate-300 text-slate-600'
                                               }`}>
                                                   {step.status === 'completed' ? <Check className="h-2 w-2" /> : index + 1}
                                               </div>
                                           </div>
                                           
                                           <div className="flex flex-col space-y-1">
                                               {/* Header Row */}
                                               <div className="flex items-start justify-between">
                                                   <h4 className="text-xs font-medium pr-2 leading-tight flex-1 min-w-0">
                                                       <span className="block">
                                                           {step.title || `Paso ${step.id}`}
                                                       </span>
                                                   </h4>
                                                   <div className="flex items-center ml-1 flex-shrink-0">
                                                       {step.status === 'completed' && (
                                                           <span className="text-xs font-medium text-green-600">✓</span>
                                                       )}
                                                       {step.status === 'in-progress' && (
                                                           <Loader2 className="h-2.5 w-2.5 text-blue-600 animate-spin" />
                                                       )}
                                                       {step.status === 'pending' && (
                                                           <Clock className="h-2.5 w-2.5 text-slate-500" />
                                                       )}
                                                   </div>
                                               </div>

                                               {/* Step Description/Summary - Auto-fit */}
                                               {step.result && step.status === 'completed' && (
                                                   <div className="text-xs text-slate-500 leading-relaxed">
                                                       <div className="overflow-hidden" style={{
                                                           display: '-webkit-box',
                                                           WebkitLineClamp: 3,
                                                           WebkitBoxOrient: 'vertical',
                                                           wordBreak: 'break-word'
                                                       }}>
                                                           {step.result}
                                                       </div>
                                                   </div>
                                               )}

                                               {/* Progress Indicator for Active Step */}
                                               {step.status === 'in-progress' && (
                                                   <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                                                       <div className="bg-blue-600 h-1 rounded-full animate-pulse w-1/3"></div>
                                                   </div>
                                               )}
                                           </div>
                                        </button>
                                        {/* Action Buttons for Completed Steps - Contained */}
                                        {step.status === 'completed' && (
                                            <div className="ml-6 mt-2 flex space-x-1 max-w-full">
                                                <button
                                                    onClick={() => handleCopyStep(step.id)}
                                                    className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                                                    title="Copiar este paso"
                                                >
                                                    <Copy className="h-2.5 w-2.5" />
                                                    <span>Copiar</span>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenStepFeedback(step.id, step.title)}
                                                    className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                                                        step.feedback
                                                            ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                                            : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                                    }`}
                                                    title={step.feedback ? "Ver/Editar feedback del especialista" : "Agregar feedback del especialista"}
                                                >
                                                    <Edit className="h-2 w-2" />
                                                    <span>Feed</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Final Report Card - Contained */}
                                {investigation.finalReport && (
                                    <div className="relative mt-2">
                                        <button
                                            onClick={() => setActiveView({ type: "report", id: null })}
                                            className={`w-full text-left p-2 pl-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow border relative max-w-full overflow-hidden ${
                                                activeView.type === "report"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow"
                                                : "text-slate-700 hover:bg-slate-50 bg-white border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            {/* Final Report Badge - Inside Button */}
                                            <div className="absolute -left-1 top-2 z-10">
                                                <div className="w-5 h-5 bg-emerald-500 border border-emerald-600 rounded-full flex items-center justify-center">
                                                    <FileText className="h-2 w-2 text-white" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-semibold flex-1 min-w-0">
                                                        <span className="block">Reporte Final</span>
                                                    </h4>
                                                    <span className="text-xs font-medium text-emerald-600 flex-shrink-0">✓</span>
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    Análisis completo
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Legend - Compact */}
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-700 mb-2 font-semibold">Estados:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                        <span className="font-medium text-slate-700">Completo</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                                        <span className="font-medium text-slate-700">Activo</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                                        <span className="font-medium text-slate-700">Pendiente</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                        <span className="font-medium text-slate-700">Error</span>
                                    </div>
                                </div>
                            </div>
                            </nav>
                        </div>

                        {/* Action Buttons - Compact */}
                        <div className="pt-3 border-t border-slate-300 space-y-2 flex-shrink-0">
                            {investigation.currentStep < investigation.plan.length && (
                                <button
                                    onClick={handleExecuteNextStep}
                                    disabled={investigation.isGenerating}
                                    className="w-full flex justify-center items-center py-3 px-4 bg-slate-800 text-white font-bold rounded-lg shadow-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                                >
                                    {investigation.isGenerating ? (
                                        <>
                                            <Spinner />
                                            <span className="ml-3">Ejecutando Protocolo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="h-5 w-5 mr-3" />
                                            Ejecutar Paso {investigation.currentStep + 1}
                                        </>
                                    )}
                                </button>
                            )}
                            {investigation.plan.some(step => step.status === 'completed') && !investigation.finalReport && (
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={investigation.isGeneratingReport}
                                    className="w-full flex justify-center items-center py-3 px-4 bg-emerald-700 text-white font-bold rounded-lg shadow-lg hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                                >
                                    {investigation.isGeneratingReport ? (
                                        <>
                                            <Spinner />
                                            <span className="ml-3">Generando Reporte...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="h-5 w-5 mr-3" />
                                            Generar Reporte Clínico
                                        </>
                                    )}
                                </button>
                            )}
                            {!investigation.plan.some(step => step.status === 'completed') && !investigation.finalReport && (
                                <div className="w-full flex justify-center items-center py-3 px-4 bg-slate-100 text-slate-600 font-semibold rounded-lg text-sm border border-slate-200">
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    <span className="text-xs">Complete un paso para generar reporte</span>
                        </div>
                            )}
                        </div>
                         
                         {investigation.error && (
                             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                 <div className="flex items-start">
                                     <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                     <p className="text-red-700 text-xs">{investigation.error}</p>
                                 </div>
                             </div>
                         )}
                        
                        {/* Scroll Indicator - Bottom Gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>
                    </div>
                </div>

                {/* Main Content Area - Full Width */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Scroll Indicator - Top Gradient for Main Content */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none z-10"></div>
                    
                    <div
                      ref={contentRef}
                      className="flex-1 bg-slate-50 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400"
                    >
                        {activeContent ? (
                            <div>
                                {/* Header - Desktop Enhanced */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-4">
                                            {activeView.type === 'step' ? (
                                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                                                    <ClipboardCheck className="h-7 w-7 text-blue-600" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                                                    <FileText className="h-7 w-7 text-green-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">{activeContent.title}</h2>
                                                <div className="flex items-center mt-2">
                                                    <StatusIcon status={activeContent.status as ResearchStep['status']} />
                                                    <span className="ml-3 text-base text-slate-600 font-medium">
                                                        {activeContent.status === 'completed' ? 'Completado' :
                                                         activeContent.status === 'in-progress' ? 'En progreso' :
                                                         activeContent.status === 'error' ? 'Error' : 'Pendiente'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {activeView.type === 'step' && activeContent.status === 'completed' && (
                                        <button
                                                onClick={() => handleCopyStep(activeView.id!)}
                                                className="flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Copy className="h-4 w-4" />
                                                <span>{copiedStepId === activeView.id ? '¡Copiado!' : 'Copiar Paso'}</span>
                                        </button>
                                    )}
                                </div>
                                </div>

                                {/* Content */}
                                {activeContent.status === 'in-progress' ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                        <Spinner/>
                                    </div>
                                        <p className="text-lg font-medium">Procesando información...</p>
                                        <p className="text-sm mt-1">Por favor espera mientras analizamos los datos</p>
                                    </div>
                                ) : activeContent.content && activeContent.content.trim() ? (
                                    activeView.type === 'report' ? (
                                        investigation?.generationError ? (
                                            <ErrorDisplay 
                                                error={investigation.generationError}
                                                onRetry={handleGenerateReport}
                                                showDetails={true}
                                            />
                                        ) : (
                                            <Suspense fallback={<div className="flex items-center justify-center h-32"><Spinner /></div>}>
                                                <EnhancedReportDisplay 
                                                    content={activeContent.content}
                                                    sources={activeContent.sources}
                                                    onCopy={handleCopyReport}
                                                    isCopied={isCopied}
                                                    investigationSteps={investigation?.plan || []}
                                                    enhancedSources={investigation?.enhancedSources}
                                                    qualityMetrics={investigation?.qualityMetrics}
                                                    sourcesBreakdown={investigation?.sourcesBreakdown}
                                                />
                                            </Suspense>
                                        )
                                    ) : (
                                        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold">
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                  h1: ({children}) => <h1 className="text-xl mb-4 font-bold">{children}</h1>,
                                                  h2: ({children}) => <h2 className="text-lg mb-3 font-semibold">{children}</h2>,
                                                  h3: ({children}) => <h3 className="text-base mb-3 font-medium">{children}</h3>,
                                                  p: ({children}) => <p className="text-base mb-4 leading-7">{children}</p>,
                                                  ul: ({children}) => <ul className="text-base mb-4 pl-6 space-y-2">{children}</ul>,
                                                  ol: ({children}) => <ol className="text-base mb-4 pl-6 space-y-2">{children}</ol>,
                                                  // Make links clickable with proper styling
                                                  a: ({href, children}) => (
                                                    <a 
                                                      href={href} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                                                      title={`Abrir enlace: ${href}`}
                                                    >
                                                      {children}
                                                    </a>
                                                  )
                                                }}
                                              >
                                                {activeContent.content}
                                              </ReactMarkdown>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center text-slate-500 py-16">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <FileText className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-lg font-medium">Este paso aún no se ha ejecutado</p>
                                        <p className="text-sm mt-1">Ejecuta el paso desde el panel de control</p>
                                    </div>
                                )}

                                {/* Medical Disclaimers and Sources for steps (not report) */}
                                {activeView.type !== 'report' && activeContent.sources && activeContent.sources.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center mb-6">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                                <FileText className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-slate-800">Fuentes Consultadas</h4>
                                            <span className="ml-3 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                                                {activeContent.sources.length} fuente{activeContent.sources.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <ul className="space-y-3">
                                            {activeContent.sources.map((source, index) => {
                                                // Determine access type for display
                                                const isOpenAccess = source.web.uri.includes('pubmed.ncbi.nlm.nih.gov') || 
                                                                   source.web.uri.includes('cochrane.org') ||
                                                                   source.web.uri.includes('clinicaltrials.gov') ||
                                                                   source.web.uri.includes('aao.org') ||
                                                                   source.web.uri.includes('esrs.org') ||
                                                                   source.web.uri.includes('arvo.org');
                                                
                                                const isSubscription = source.web.uri.includes('uptodate.com') ||
                                                                      source.web.uri.includes('medscape.com') ||
                                                                      source.web.uri.includes('thelancet.com') ||
                                                                      source.web.uri.includes('jama.ama-assn.org') ||
                                                                      source.web.uri.includes('nejm.org');
                                                
                                                const accessIndicator = isOpenAccess ? '✓' : isSubscription ? '🔒' : '!';
                                                const accessMessage = isOpenAccess ? 'Acceso abierto' : 
                                                                    isSubscription ? 'Requiere suscripción' : 'Acceso limitado';
                                                
                                                return (
                                                    <li key={index} className="flex items-start group">
                                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <a 
                                                                    href={source.web.uri} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-sm transition-all duration-200 group-hover:bg-blue-50 p-3 rounded-lg -m-3 border border-transparent hover:border-blue-200"
                                                                    title={`Abrir: ${source.web.uri}`}
                                                                >
                                                        {source.web.title || source.web.uri}
                                                    </a>
                                                                <span className="text-lg" title={accessMessage}>
                                                                    {accessIndicator}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                                <div className="flex items-center">
                                                                    <ArrowUp className="h-3 w-3 mr-2 flex-shrink-0" />
                                                                    <span className="truncate font-mono">{source.web.uri}</span>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                    isOpenAccess ? 'bg-green-100 text-green-800' :
                                                                    isSubscription ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {accessMessage}
                                                                </span>
                                                            </div>
                                                        </div>
                                                </li>
                                                );
                                            })}
                                        </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons for Steps - Desktop Enhanced */}
                                {activeView.type === 'step' && investigation && (
                                    <div className="mt-10 flex flex-row gap-4 justify-center">
                                        {/* Previous Step Button */}
                                        {activeView.id && activeView.id > 1 && (
                                            <button
                                                onClick={() => {
                                                    const prevStep = investigation.plan.find(step => step.id === activeView.id! - 1);
                                                    if (prevStep && prevStep.status === 'completed') {
                                                        setActiveView({ type: 'step', id: activeView.id! - 1 });
                                                    }
                                                }}
                                                className="flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-base font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <ArrowDown className="h-4 w-4 mr-2" />
                                                Paso Anterior
                                            </button>
                                        )}

                                        {/* Next Step Button */}
                                        {activeView.id && activeView.id < investigation.plan.length && (
                                            <button
                                                onClick={() => {
                                                    const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                                    if (nextStep) {
                                                        if (nextStep.status === 'completed') {
                                                            // Navigate to completed step
                                                            setActiveView({ type: 'step', id: activeView.id! + 1 });
                                                        } else if (nextStep.status === 'pending') {
                                                            // Execute the next step
                                                            handleExecuteNextStep();
                                                        }
                                                    }
                                                }}
                                                className={`flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                                                    (() => {
                                                        const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                                        if (nextStep && nextStep.status === 'completed') {
                                                            return 'bg-blue-600 hover:bg-blue-700 text-white';
                                                        } else if (nextStep && nextStep.status === 'pending') {
                                                            return 'bg-green-600 hover:bg-green-700 text-white';
                                                        }
                                                        return 'bg-blue-600 hover:bg-blue-700 text-white';
                                                    })()
                                                }`}
                                            >
                                                {(() => {
                                                    const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                                    if (nextStep && nextStep.status === 'completed') {
                                                        return 'Siguiente Paso';
                                                    } else if (nextStep && nextStep.status === 'pending') {
                                                        return 'Ejecutar Siguiente';
                                                    }
                                                    return 'Siguiente Paso';
                                                })()}
                                                {(() => {
                                                    const nextStep = investigation.plan.find(step => step.id === activeView.id! + 1);
                                                    if (nextStep && nextStep.status === 'completed') {
                                                        return (
                                                            <ChevronRight className="h-4 w-4 ml-2" />
                                                        );
                                                    } else if (nextStep && nextStep.status === 'pending') {
                                                        return (
                                                            <Zap className="h-4 w-4 ml-2" />
                                                        );
                                                    }
                                                    return (
                                                        <ChevronRight className="h-4 w-4 ml-2" />
                                                    );
                                                })()}
                                            </button>
                                        )}

                                        {/* Final Report Button - Desktop Enhanced */}
                                        {activeView.id && activeView.id === investigation.plan.length && investigation.finalReport && (
                                            <div className="flex flex-row gap-4 justify-center">
                                                <button
                                                    onClick={() => setActiveView({ type: 'report', id: null })}
                                                    className="flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    Ver Reporte Final
                                                    <FileText className="h-4 w-4 ml-2" />
                                                </button>

                                                <button
                                                    onClick={handleGenerateReport}
                                                    disabled={investigation?.isGeneratingReport}
                                                    className="flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                    {investigation?.isGeneratingReport ? 'Regenerando...' : 'Regenerar Reporte'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
                                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                    <FileText className="h-10 w-10 text-slate-400" />
                                </div>
                                <p className="text-xl font-medium text-slate-600 mb-2">Selecciona un paso para ver los detalles</p>
                                <p className="text-base text-slate-500">Usa el panel de navegación para explorar la investigación</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Scroll Indicator - Bottom Gradient for Main Content */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-10"></div>
                </div>
            </div>
        </main>
      )}
      </div>

      {/* Step Feedback Modal */}
      {currentStepForFeedback && (
        <StepFeedbackModal
          isOpen={showStepFeedback}
          onClose={() => {
            setShowStepFeedback(false);
            setCurrentStepForFeedback(null);
          }}
          onSave={handleStepFeedback}
          stepTitle={currentStepForFeedback.title}
          stepId={currentStepForFeedback.id}
        />
      )}

      {/* Medical Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                Análisis de Imágenes Médicas
              </h3>
              <button
                onClick={handleCloseImageUploader}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <ErrorBoundary>
                <MedicalImageUploader
                  onAnalysisComplete={handleImageAnalysisComplete}
                  onError={handleImageAnalysisError}
                  isLoading={false}
                  maxImages={5}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      {/* Image Analysis Results Modal */}
      {showImageResults && (
        <ErrorBoundary>
          <ImageAnalysisResults
            analyses={imageAnalyses}
            onClose={handleCloseImageResults}
          />
        </ErrorBoundary>
      )}

      {/* Image Analysis Announcement */}
      {showImageAnnouncement && (
        <ImageAnalysisAnnouncement
          onClose={handleCloseImageAnnouncement}
          onShowImageUploader={handleOpenImageUploader}
        />
      )}
      <Footer />
    </div>
  );
}

export default App;