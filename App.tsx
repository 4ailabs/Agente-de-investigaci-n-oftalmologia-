import React, { useState, useEffect, useMemo, Suspense, lazy, useRef } from 'react';
import { InvestigationState, ResearchStep, Source } from './types';
import { createResearchPlanPrompt, createExecuteStepPrompt, createFinalReportPrompt } from './constants';
import { generateContent } from './services/geminiService';
import { MedicalContextEngine, MedicalContext } from './contextEngineering';
import { MedicalValidationService, DisclaimerGenerator } from './medicalValidation';
import { EnhancedMedicalReasoning, ClinicalReasoning, ReasoningIntegration } from './enhancedReasoning';
import { OphthalmologyKnowledgeGraph } from './ophthalmologyKnowledge';
import { QualityAssuranceEngine, QualityCheck } from './qualityAssurance';
import { localStorageService, StoredInvestigation } from './services/localStorageService';
import Header from './components/Header';
import Footer from './components/Footer';
import Spinner, { MobileLoadingCard } from './components/Spinner';
import useSwipeGesture from './hooks/useSwipeGesture';
import { AudioRecorder } from './components/AudioRecorder';
import { EnhancedDataForm } from './components/EnhancedDataForm';
import DocumentCapture from './components/DocumentCapture';
import { EnhancedPatientData } from './types/enhancedDataTypes';
import { MedicalDataExtractionService } from './services/medicalDataExtraction';
import SplashScreen from './components/SplashScreen';

// Lazy load heavy components
const ExplanationModal = lazy(() => import('./components/ExplanationModal'));
const HistoryModal = lazy(() => import('./components/HistoryModal'));
const EnhancedReportDisplay = lazy(() => import('./components/EnhancedReportDisplay'));
// Import ReactMarkdown normally since it's needed for step rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const InitialQueryInput: React.FC<{
  onSubmit: (query: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicalInfo.trim() && age > 0 && sex) {
      const sexLabel = sex === 'M' ? 'Masculino' : sex === 'F' ? 'Femenino' : 'No especificado';
      const fullQuery = `Paciente de ${age} años, sexo ${sexLabel}.
---
Síntomas y Antecedentes Clínicos:
${clinicalInfo.trim()}`;
      onSubmit(fullQuery);
    }
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
     <main className="max-w-4xl mx-auto py-2 lg:py-8 px-2 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white to-blue-50/30 p-3 lg:p-8 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-blue-100">
          {/* Header Section */}
          <div className="text-center mb-4 lg:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl lg:rounded-2xl mb-2 lg:mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-3">Nueva Investigación Clínica</h2>
            <p className="text-sm lg:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Nuestro agente de IA especializado en oftalmología creará un plan de investigación personalizado basado en evidencia médica.
            </p>
          </div>
          
          {/* Mode Selector - Optimizado para móvil */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInputMode('quick')}
                className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-md text-base sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-[36px] ${
                  inputMode === 'quick'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span className="hidden sm:inline">Entrada Rápida</span>
                <span className="sm:hidden">Rápida</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('structured')}
                className={`flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-md text-base sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-[36px] ${
                  inputMode === 'structured'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span className="hidden sm:inline">Formulario Detallado</span>
                <span className="sm:hidden">Detallado</span>
              </button>
            </div>
          </div>

          {/* Content based on selected mode */}
          {inputMode === 'quick' ? (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Quick Entry Form */}
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
            <div>
                    <label htmlFor="age" className="block text-sm lg:text-base font-medium text-slate-700 mb-2">
                      Edad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            id="age"
                        value={age || ''}
                        onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm min-h-[48px] sm:min-h-[40px]"
                        placeholder="Ej: 65"
                        min="1"
                        max="120"
                            required
                        />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 text-sm lg:text-base">años</span>
                      </div>
                    </div>
                     </div>
                     <div>
                    <label htmlFor="sex" className="block text-sm lg:text-base font-medium text-slate-700 mb-2">
                      Sexo <span className="text-red-500">*</span>
                    </label>
                         <select
                            id="sex"
                            value={sex}
                      onChange={(e) => setSex(e.target.value as 'M' | 'F' | '')}
                      className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm min-h-[48px] sm:min-h-[40px]"
                            required
                        >
                            <option value="" disabled>Seleccionar...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                        </select>
                     </div>
                </div>
                
            <div>
                  <label htmlFor="clinical-info" className="block text-sm lg:text-base font-medium text-slate-700 mb-2">
                    Información Clínica <span className="text-red-500">*</span>
                  </label>
                 <textarea
                    id="clinical-info"
                    value={clinicalInfo}
                    onChange={(e) => setClinicalInfo(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base sm:text-sm resize-none"
                    placeholder="Síntomas actuales, antecedentes médicos, medicamentos, tiempo de evolución...&#10;&#10;Ejemplo: Paciente presenta disminución de agudeza visual bilateral de 3 semanas de evolución, acompañada de dolor ocular moderado. Antecedente de diabetes mellitus tipo 2."
                    required
                />
                  
                  {/* Audio y Documento Buttons - Móvil optimizado */}                                         
                  <div className="mt-3 space-y-2">                                     
                    <div className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm text-slate-500 flex items-center">                            
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">               
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />            
                        </svg>
                        Sea específico para mejores resultados                                               
                      </span>
            </div>
           
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAudioRecorder(!showAudioRecorder)}                             
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-base sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-200 min-h-[44px] sm:min-h-[36px]"                                                   
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>         
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />                               
                        </svg>
                        <span>{showAudioRecorder ? 'Ocultar Audio' : 'Dictar Texto'}</span>                  
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setShowDocumentCapture(!showDocumentCapture)}                             
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-base sm:text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors duration-200 min-h-[44px] sm:min-h-[36px]"                                                   
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>         
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
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
              
              {/* Submit Button */}
              <div className="pt-2">
            <button
              type="submit"
              disabled={isFormInvalid}
                  className="w-full flex justify-center items-center py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 min-h-[56px] text-base"
                >
                  {isLoading ? (
                    <>
                      <Spinner />
                      <span className="ml-3">Creando Plan de Investigación...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Iniciar Investigación Clínica
                    </>
                  )}
            </button>
              </div>
          </form>
          ) : (
            /* Structured Form Mode */
            <div>
              <EnhancedDataForm
                onSubmit={onSubmitEnhanced}
                onCancel={() => setInputMode('quick')}
                initialData={extractedData || undefined}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
    </main>
  );
};

const StatusIcon: React.FC<{ status: ResearchStep['status'] }> = ({ status }) => {
    switch (status) {
        case 'completed':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
        case 'in-progress':
            return <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
        case 'error':
             return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        default:
            return <div className="h-5 w-5 flex items-center justify-center"><div className="h-2.5 w-2.5 rounded-full border-2 border-slate-400"></div></div>;
    }
};

const App: React.FC = () => {
  const [investigation, setInvestigation] = useState<InvestigationState | null>(null);
  const [activeView, setActiveView] = useState<{ type: 'step' | 'report'; id: number | null }>({ type: 'step', id: 1 });
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Debug splash screen
  useEffect(() => {
    console.log('🎬 App: showSplash =', showSplash);
  }, [showSplash]);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<number | null>(null);
  
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

  const handleStartInvestigation = async (query: string) => {
    // Initialize medical context from query
    const initialContext = MedicalContextEngine.parseInitialContext(query);
    setMedicalContext(initialContext);

    // Extract patient information for enhanced reasoning
    const patientInfo = {
      age: initialContext.patientProfile.age || 65, // Fallback age
      sex: initialContext.patientProfile.sex || 'no especificado',
      history: initialContext.patientProfile.medicalHistory
    };
    
    // Generate initial clinical reasoning
    const symptoms = initialContext.patientProfile.currentSymptoms.length > 0 
      ? initialContext.patientProfile.currentSymptoms.map(s => s.description)
      : ['síntomas no específicos']; // Fallback para casos sin síntomas detectados
    const findings = Object.values(initialContext.clinicalFindings).filter(f => f !== null) as string[];
    
    const initialReasoning = EnhancedMedicalReasoning.synthesizeReasoning(
      symptoms,
      patientInfo,
      findings,
      ['initial_query'] // Initial evidence quality
    );
    
    setClinicalReasoning(initialReasoning);

    const newInvestigation: InvestigationState = {
        originalQuery: query,
        plan: [],
        currentStep: 0,
        isGenerating: true,
        error: null,
        finalReport: null,
        finalReportSources: null,
        isGeneratingReport: false,
    };
    
    setInvestigation(newInvestigation);
    setActiveView({ type: 'step', id: 1 });

    // Extract patient info for storage
    const patientInfoForStorage = {
      age: initialContext.patientProfile.age?.toString() || 'No especificado',
      sex: initialContext.patientProfile.sex || 'No especificado',
      symptoms: initialContext.patientProfile.currentSymptoms.map(s => s.description).join(', ') || 'No especificados'
    };

    // Save investigation to localStorage
    const investigationId = localStorageService.saveInvestigation(newInvestigation, patientInfoForStorage);
    setCurrentInvestigationId(investigationId);
    
    // Update history
    const history = localStorageService.getInvestigationHistory();
    setInvestigationHistory(history.investigations);

    // Enhanced prompt with medical context, clinical reasoning AND knowledge graph
    const contextSummary = MedicalContextEngine.generateContextSummary(initialContext);
    const reasoningSummary = ReasoningIntegration.formatReasoningForPrompt(initialReasoning);
    
    // Extract relevant ophthalmology knowledge
    const suspectedDiagnoses = initialReasoning.differentialDiagnoses.slice(0, 3).map(d => d.diagnosis);
    const knowledgeGraphData = OphthalmologyKnowledgeGraph.extractRelevantKnowledge(symptoms, suspectedDiagnoses);
    
    const enhancedQuery = `${query}\n\n### CONTEXTO MÉDICO INICIAL ###\n${contextSummary}\n\n${reasoningSummary}\n\n${knowledgeGraphData}`;
    
    const prompt = createResearchPlanPrompt(enhancedQuery);
    const { text: planResponse } = await generateContent(prompt, false, enhancedQuery);

    if (planResponse.startsWith('Ocurrió un error:')) {
      setInvestigation(prev => prev ? {...prev, error: planResponse, isGenerating: false} : null);
      return;
    }
    
    const planSteps: ResearchStep[] = planResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^\d+\./.test(line))
        .map((line, index) => ({
            id: index + 1,
            title: line.replace(/^\d+\.\s*/, ''),
            status: 'pending',
            result: null,
            prompt: '',
            sources: null,
        }));

    setInvestigation(prev => prev ? {
        ...prev,
        plan: planSteps,
        isGenerating: false
    } : null);
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
    if (!investigation || !investigation.plan.every(step => step.status === 'completed')) return;
    
    setInvestigation(prev => prev ? {...prev, isGeneratingReport: true, error: null } : null);
    // Navigate to report view when generation starts
    setActiveView({ type: 'report', id: null });
    
    const completedSteps = investigation.plan.filter(step => step.status === 'completed');
    
    // Enhanced prompt with final medical context
    let enhancedQuery = investigation.originalQuery;
    if (medicalContext) {
      const finalContextSummary = MedicalContextEngine.generateContextSummary(medicalContext);
      enhancedQuery = `${investigation.originalQuery}\n\n### CONTEXTO MÉDICO FINAL ###\n${finalContextSummary}`;
    }
    
    const prompt = createFinalReportPrompt(enhancedQuery, completedSteps);
    
    const { text: reportText, sources: reportSources } = await generateContent(prompt, true, enhancedQuery);

    // Validate and enhance report sources
    const { validatedSources, disclaimers } = await MedicalValidationService.validateAndEnhanceSources(reportSources);

    setInvestigation(prev => {
        if (!prev) return null;
        if (reportText.startsWith('Ocurrió un error:')) {
            return {...prev, error: reportText, isGeneratingReport: false };
        }
        
        // Add medical disclaimers to the final report
        const reportWithDisclaimers = `${reportText}\n\n---\n\n## Disclaimers Médicos\n\n${disclaimers}`;
        
        const finalInvestigation = {...prev, finalReport: reportWithDisclaimers, finalReportSources: validatedSources, isGeneratingReport: false };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      {showSplash && (
        <SplashScreen onComplete={() => {
          console.log('🎬 Splash screen onComplete llamado');
          setShowSplash(false);
        }} />
      )}
      <Header 
        onShowExplanation={() => setShowExplanation(true)} 
        onShowHistory={() => setShowHistory(true)}
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
            currentInvestigationId={currentInvestigationId}
          />
        </Suspense>
      )}
      <div className="flex-1">
      {!investigation ? (
        <InitialQueryInput 
          onSubmit={handleStartInvestigation} 
          onSubmitEnhanced={handleEnhancedFormSubmit} 
          isLoading={investigation?.isGenerating ?? false}
        />
      ) : investigation.isGenerating && investigation.plan.length === 0 ? (
         <MobileLoadingCard 
           title="Creando Plan de Investigación"
           description="Nuestro agente de IA está analizando el caso y diseñando un plan de investigación personalizado basado en evidencia médica."
         />
      ) : (
          <main className="max-w-7xl mx-auto py-2 lg:py-8 px-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-8 relative">
                {/* Left Column: Control Panel */}
                <div className="lg:col-span-4 order-2 lg:order-1">
                    <div className="bg-gradient-to-br from-white to-slate-50/50 p-2 lg:p-6 rounded-lg lg:rounded-2xl shadow-md lg:shadow-xl border border-slate-200 lg:sticky lg:top-28 z-20">
                        {/* Header */}
                        <div className="pb-2 lg:pb-6 border-b border-slate-200">
                             <div className="flex justify-between items-center mb-2 lg:mb-3">
                                <div className="flex items-center">
                                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 lg:mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-base lg:text-xl font-semibold text-slate-800">Investigación Actual</h2>
                                </div>
                                <button 
                                    onClick={handleReset} 
                                    className="flex items-center px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="hidden lg:inline">Nueva</span>
                                    <span className="lg:hidden">🔄</span>
                                </button>
                             </div>
                             <div className="bg-blue-50 p-2 lg:p-3 rounded-lg">
                                 <div className="text-sm lg:text-base text-slate-700 space-y-1">
                                     {investigation.originalQuery ? investigation.originalQuery.split('\n---\n').map((section, index) => {
                                         if (index === 0) {
                                             // Patient demographics (first line)
                                             return (
                                                 <div key={index} className="font-medium text-blue-800 text-sm lg:text-base">
                                                     {section.trim()}
                                                 </div>
                                             );
                                         } else {
                                             // Clinical symptoms (truncated)
                                             const symptoms = section.replace('Síntomas y Antecedentes Clínicos:', '').trim();
                                             const truncated = symptoms.length > 120 ? symptoms.substring(0, 120) + '...' : symptoms;
                                             return (
                                                 <div key={index} className="text-slate-600">
                                                     <div className="text-sm font-medium text-slate-500 mb-1">Síntomas:</div>
                                                     <div className="text-sm leading-tight" title={symptoms}>
                                                         {truncated}
                                                     </div>
                                                 </div>
                                             );
                                         }
                                     }) : (
                                         <div className="text-sm text-slate-500">Cargando información del caso...</div>
                                     )}
                                 </div>
                             </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="my-4 lg:my-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm lg:text-base font-medium text-slate-700">Progreso</span>
                                <span className="text-sm lg:text-base text-slate-500 font-mono">
                                    {investigation.plan.filter(step => step.status === 'completed').length}/{investigation.plan.length}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 lg:h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 lg:h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(investigation.plan.filter(step => step.status === 'completed').length / investigation.plan.length) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mb-4 lg:mb-6">
                            <div className="flex items-center justify-between mb-2 lg:mb-3">
                                <h3 className="text-sm lg:text-base font-semibold text-slate-700">Pasos de Investigación</h3>
                                <div className="hidden lg:flex items-center space-x-1 text-xs lg:text-sm text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Haz clic para ver</span>
                                </div>
                            </div>
                            <ul className="space-y-1 lg:space-y-2">
                                {investigation.plan.map(step => (
                                    <li key={step.id}>
                                        <div className="flex items-center space-x-1 lg:space-x-2">
                                        <button 
                                            onClick={() => setActiveView({ type: 'step', id: step.id })}
                                                disabled={step.status === 'pending'}
                                                className={`flex-1 text-left flex items-start p-2 lg:p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-w-0 w-full min-h-[48px] lg:min-h-[56px] ${
                                                activeView.type === 'step' && activeView.id === step.id 
                                                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border border-blue-200 shadow-sm' 
                                                    : step.status === 'completed'
                                                    ? 'text-slate-700 hover:bg-slate-100 hover:shadow-sm'
                                                    : step.status === 'in-progress'
                                                    ? 'text-slate-500 hover:bg-slate-50 cursor-wait'
                                                    : 'text-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                           <div className="flex-shrink-0 mt-0.5 lg:mt-0">
                                           <StatusIcon status={step.status} />
                                           </div>
                                           <div className="flex-1 min-w-0 ml-2 lg:ml-3">
                                               <div className="flex items-center justify-between">
                                                   <span className="text-left break-words leading-tight pr-2">
                                                       <span className="hidden lg:inline text-sm lg:text-base font-medium">{step.title || 'Paso sin título'}</span>
                                                        <span className="lg:hidden text-sm lg:text-base font-medium">
                                                            {step.title && step.title.length > 60 ? step.title.substring(0, 60) + "..." : (step.title || "Paso sin título")}
                                                        </span>
                                                   </span>
                                                   <div className="flex items-center space-x-1 flex-shrink-0">
                                                       {step.status === 'completed' && (
                                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                           </svg>
                                                       )}
                                                       {step.status === 'in-progress' && (
                                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                               <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                           </svg>
                                                       )}
                                                       {step.status === 'pending' && (
                                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                           </svg>
                                                       )}
                                                   </div>
                                               </div>
                                           </div>
                                        </button>
                                            {step.status === 'completed' && (
                                                <button
                                                    onClick={() => handleCopyStep(step.id)}
                                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                    title="Copiar este paso"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                        </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {investigation.finalReport && (
                                     <li>
                                        <button 
                                            onClick={() => setActiveView({ type: "report", id: null })}
                                            className={`w-full text-left flex items-center p-2 lg:p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-h-[48px] lg:min-h-[56px] ${
                                                activeView.type === "report"
                                                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold border border-green-200 shadow-sm" 
                                                : "text-slate-700 hover:bg-slate-100"
                                            }`}
                                        >
                                           <div className="w-4 h-4 lg:w-5 lg:h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                               <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                               </svg>
                                           </div>
                                           <span className="ml-2 lg:ml-3 flex-1">Reporte Final</span>
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                           </svg>
                                        </button>
                                    </li>
                                )}
                            </ul>
                            
                            {/* Legend - Mobile Compact */}
                            <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-600 mb-2 font-medium hidden lg:block">Estados:</div>
                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-1 lg:gap-2 text-xs">
                                    <div className="flex items-center space-x-1.5 lg:space-x-2">
                                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                        <span className="truncate">Completado</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 lg:space-x-2">
                                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                                        <span className="truncate">En progreso</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 lg:space-x-2">
                                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                                        <span className="truncate">Pendiente</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5 lg:space-x-2">
                                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                        <span className="truncate">Error</span>
                                    </div>
                                </div>
                            </div>
                        </nav>

                        {/* Action Buttons */}
                        <div className="pt-3 lg:pt-6 border-t border-slate-200 space-y-2 lg:space-y-3">
                            {investigation.currentStep < investigation.plan.length && (
                                <button
                                    onClick={handleExecuteNextStep}
                                    disabled={investigation.isGenerating}
                                    className="w-full flex justify-center items-center py-2.5 lg:py-3 px-3 lg:px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg lg:rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                                >
                                    {investigation.isGenerating ? (
                                        <>
                                            <Spinner />
                                            <span className="ml-2">Ejecutando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Ejecutar Paso {investigation.currentStep + 1}
                                        </>
                                    )}
                                </button>
                            )}
                            {investigation.currentStep >= investigation.plan.length && !investigation.finalReport && (
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={investigation.isGeneratingReport}
                                    className="w-full flex justify-center items-center py-2.5 lg:py-3 px-3 lg:px-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold rounded-lg lg:rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                                >
                                    {investigation.isGeneratingReport ? (
                                        <>
                                            <Spinner />
                                            <span className="ml-2">Generando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Generar Reporte Final
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                         
                         {investigation.error && (
                             <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                 <div className="flex items-start">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                     </svg>
                                     <p className="text-red-700 text-xs">{investigation.error}</p>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Right Column: Content Display */}
                <div className="lg:col-span-8 relative z-0 order-1 lg:order-2">
                    <div 
                      ref={contentRef}
                      className="bg-gradient-to-br from-white to-slate-50/30 p-3 lg:p-8 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-slate-200 min-h-[50vh] lg:min-h-[70vh] relative"
                    >
                        {/* Mobile Swipe Indicators - only show on mobile */}
                        <div className="block lg:hidden absolute top-1/2 left-2 transform -translate-y-1/2 text-slate-300 z-10">
                          {investigation && activeView.type === 'step' && activeView.id && activeView.id > 1 && (
                            <div className="flex items-center animate-pulse">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                              </svg>
                              <span className="text-xs lg:text-sm ml-1">Anterior</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="block lg:hidden absolute top-1/2 right-2 transform -translate-y-1/2 text-slate-300 z-10">
                          {investigation && (
                            (activeView.type === 'step' && activeView.id && activeView.id < investigation.plan.length && investigation.plan.find(s => s.id === activeView.id + 1)?.status !== 'pending') ||
                            (activeView.type === 'step' && activeView.id === investigation.plan.length && investigation.finalReport)
                          ) && (
                            <div className="flex items-center animate-pulse">
                              <span className="text-xs lg:text-sm mr-1">Siguiente</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {activeContent ? (
                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 lg:mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            {activeView.type === 'step' ? (
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="text-lg lg:text-xl font-bold text-slate-900">{activeContent.title}</h2>
                                                <div className="flex items-center mt-1">
                                                    <StatusIcon status={activeContent.status as ResearchStep['status']} />
                                                    <span className="ml-2 text-sm lg:text-base text-slate-600">
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
                                                className="flex items-center space-x-2 px-4 py-2 text-sm lg:text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
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
                                        <Suspense fallback={<div className="flex items-center justify-center h-32"><Spinner /></div>}>
                                            <EnhancedReportDisplay 
                                                content={activeContent.content}
                                                sources={activeContent.sources}
                                                onCopy={handleCopyReport}
                                                isCopied={isCopied}
                                            />
                                        </Suspense>
                                    ) : (
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold">
                                              <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                  // Optimize for mobile rendering
                                                  h1: ({children}) => <h1 className="text-lg lg:text-xl mb-4">{children}</h1>,
                                                  h2: ({children}) => <h2 className="text-base lg:text-lg mb-3">{children}</h2>,
                                                  h3: ({children}) => <h3 className="text-sm lg:text-base mb-2">{children}</h3>,
                                                  p: ({children}) => <p className="text-sm mb-3 leading-6">{children}</p>,
                                                  ul: ({children}) => <ul className="text-sm mb-3 pl-4 space-y-1">{children}</ul>,
                                                  ol: ({children}) => <ol className="text-sm mb-3 pl-4 space-y-1">{children}</ol>,
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
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium">Este paso aún no se ha ejecutado</p>
                                        <p className="text-sm mt-1">Ejecuta el paso desde el panel de control</p>
                                    </div>
                                )}

                                {/* Medical Disclaimers and Sources for steps (not report) */}
                                {activeView.type !== 'report' && activeContent.sources && activeContent.sources.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center mb-4">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-base font-semibold text-slate-800">Fuentes Consultadas</h4>
                                            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                                                {activeContent.sources.length} fuente{activeContent.sources.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <ul className="space-y-4">
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
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
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

                                {/* Navigation Buttons for Steps */}
                                {activeView.type === 'step' && investigation && (
                                    <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        {/* Previous Step Button */}
                                        {activeView.id && activeView.id > 1 && (
                                            <button
                                                onClick={() => {
                                                    const prevStep = investigation.plan.find(step => step.id === activeView.id! - 1);
                                                    if (prevStep && prevStep.status === 'completed') {
                                                        setActiveView({ type: 'step', id: activeView.id! - 1 });
                                                    }
                                                }}
                                                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm lg:text-base font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                                </svg>
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
                                                className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
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
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        );
                                                    } else if (nextStep && nextStep.status === 'pending') {
                                                        return (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        );
                                                    }
                                                    return (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    );
                                                })()}
                                            </button>
                                        )}

                                        {/* Final Report Button */}
                                        {activeView.id && activeView.id === investigation.plan.length && investigation.finalReport && (
                                            <button
                                                onClick={() => setActiveView({ type: 'report', id: null })}
                                                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                Ver Reporte Final
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium">Selecciona un paso para ver los detalles</p>
                                <p className="text-sm mt-1">Usa el panel de navegación para explorar la investigación</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
      )}
      </div>
      <Footer />
    </div>
  );
};

export default App;