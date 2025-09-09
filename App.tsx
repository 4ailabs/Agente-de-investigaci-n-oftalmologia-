import React, { useState, useMemo, Suspense, lazy, useRef } from 'react';
import { InvestigationState, ResearchStep, Source } from './types';
import { createResearchPlanPrompt, createExecuteStepPrompt, createFinalReportPrompt } from './constants';
import { generateContent } from './services/geminiService';
import Header from './components/Header';
import Footer from './components/Footer';
import Spinner, { MobileLoadingCard } from './components/Spinner';
import useSwipeGesture from './hooks/useSwipeGesture';

// Lazy load heavy components
const ExplanationModal = lazy(() => import('./components/ExplanationModal'));
const ReactMarkdown = lazy(() => import('react-markdown'));
const remarkGfm = lazy(() => import('remark-gfm'));

const InitialQueryInput: React.FC<{
  onSubmit: (query: string) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [clinicalInfo, setClinicalInfo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicalInfo.trim() && age.trim() && sex.trim()) {
      const fullQuery = `Paciente de ${age} años, sexo ${sex}.
---
Síntomas y Antecedentes Clínicos:
${clinicalInfo.trim()}`;
      onSubmit(fullQuery);
    }
  };

  const isFormInvalid = isLoading || !clinicalInfo.trim() || !age.trim() || !sex.trim();

  return (
     <main className="max-w-4xl mx-auto py-2 lg:py-8 px-2 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white to-blue-50/30 p-3 lg:p-8 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-blue-100">
          {/* Header Section */}
          <div className="text-center mb-4 lg:mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl lg:rounded-2xl mb-2 lg:mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-base lg:text-2xl font-bold text-slate-900 mb-2">Iniciar Nueva Investigación Clínica</h2>
            <p className="text-xs lg:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Complete la información del paciente para que nuestro agente de IA especializado en oftalmología cree un plan de investigación personalizado basado en evidencia médica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-8">
            {/* Patient Demographics Section */}
            <div className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Datos Demográficos del Paciente</h3>
              </div>
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <div>
                  <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
                    Edad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                        <input
                            type="number"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 lg:py-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base min-h-[48px] lg:min-h-[56px]"
                            placeholder="Ej: 72"
                            required
                        />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">años</span>
                    </div>
                  </div>
                     </div>
                     <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-slate-700 mb-2">
                    Sexo <span className="text-red-500">*</span>
                  </label>
                         <select
                            id="sex"
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base min-h-[48px] lg:min-h-[56px]"
                            required
                        >
                    <option value="" disabled>Seleccionar sexo...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                     </div>
                </div>
            </div>

            {/* Clinical Information Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Información Clínica</h3>
            </div>
            <div>
                <label htmlFor="clinical-info" className="block text-sm font-medium text-slate-700 mb-2">
                  Síntomas y Antecedentes Clínicos <span className="text-red-500">*</span>
                </label>
                 <textarea
                    id="clinical-info"
                    value={clinicalInfo}
                    onChange={(e) => setClinicalInfo(e.target.value)}
                    rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm lg:text-base resize-none min-h-[120px]"
                  placeholder="Describa detalladamente los síntomas, antecedentes médicos relevantes, medicamentos actuales, y cualquier información clínica importante. Ej: Paciente de 65 años con diabetes tipo 2 presenta visión borrosa progresiva en ambos ojos durante las últimas 2 semanas, acompañada de dolor ocular intermitente..."
                    required
                />
                <div className="mt-2 text-xs text-slate-500">
                  <span className="inline-flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Sea lo más específico posible para obtener mejores resultados
                  </span>
                </div>
              </div>
            </div>
           
            {/* Submit Button */}
            <div className="pt-4">
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
  const [isCopied, setIsCopied] = useState(false);
  const [copiedStepId, setCopiedStepId] = useState<number | null>(null);
  
  // Refs for swipe gesture
  const contentRef = useRef<HTMLDivElement>(null);

  const handleStartInvestigation = async (query: string) => {
    setInvestigation({
        originalQuery: query,
        plan: [],
        currentStep: 0,
        isGenerating: true,
        error: null,
        finalReport: null,
        finalReportSources: null,
        isGeneratingReport: false,
    });
    setActiveView({ type: 'step', id: 1 });

    const prompt = createResearchPlanPrompt(query);
    const { text: planResponse } = await generateContent(prompt, false);

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
    const prompt = createExecuteStepPrompt(investigation.originalQuery, investigation.plan, currentStepInfo);
    
    const { text: resultText, sources: resultSources } = await generateContent(prompt, true);
    
    // Debug: Log sources to console
    console.log('Sources received:', resultSources);

    setInvestigation(prev => {
        if (!prev) return null;
        const newPlan = [...prev.plan];
        
        if (resultText.startsWith('Ocurrió un error:')) {
            newPlan[currentStepIndex].status = 'error';
            newPlan[currentStepIndex].result = resultText;
            return {...prev, plan: newPlan, isGenerating: false, error: resultText };
        }

        newPlan[currentStepIndex].status = 'completed';
        newPlan[currentStepIndex].result = resultText;
        newPlan[currentStepIndex].sources = resultSources;
        
        return {
            ...prev,
            plan: newPlan,
            currentStep: prev.currentStep + 1,
            isGenerating: false,
        };
    });
  };
  
  const handleGenerateReport = async () => {
    if (!investigation || !investigation.plan.every(step => step.status === 'completed')) return;
    
    setInvestigation(prev => prev ? {...prev, isGeneratingReport: true, error: null } : null);
    setActiveView({ type: 'report', id: null });
    
    const completedSteps = investigation.plan.filter(step => step.status === 'completed');
    const prompt = createFinalReportPrompt(investigation.originalQuery, completedSteps);
    
    const { text: reportText, sources: reportSources } = await generateContent(prompt, true);

    setInvestigation(prev => {
        if (!prev) return null;
        if (reportText.startsWith('Ocurrió un error:')) {
            return {...prev, error: reportText, isGeneratingReport: false };
        }
        return {...prev, finalReport: reportText, finalReportSources: reportSources, isGeneratingReport: false };
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
  }

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
      } else if (currentStepId === maxStepId && investigation.finalReport) {
        // Go to final report
        setActiveView({ type: 'report', id: null });
      }
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
      <Header onShowExplanation={() => setShowExplanation(true)} />
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
      <div className="flex-1">
      {!investigation ? (
        <InitialQueryInput 
          onSubmit={handleStartInvestigation} 
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
                    <div className="bg-gradient-to-br from-white to-slate-50/50 p-3 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-slate-200 lg:sticky lg:top-28 z-10">
                        {/* Header */}
                        <div className="pb-4 lg:pb-6 border-b border-slate-200">
                             <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-800">Investigación Actual</h2>
                                </div>
                                <button 
                                    onClick={handleReset} 
                                    className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Nueva
                                </button>
                             </div>
                             <div className="bg-blue-50 p-3 rounded-lg">
                                 <p className="text-sm text-slate-700 line-clamp-3" title={investigation.originalQuery}>
                                     {investigation.originalQuery}
                                 </p>
                             </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="my-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Progreso</span>
                                <span className="text-sm text-slate-500">
                                    {investigation.plan.filter(step => step.status === 'completed').length} / {investigation.plan.length}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: `${(investigation.plan.filter(step => step.status === 'completed').length / investigation.plan.length) * 100}%` 
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-700">Pasos de Investigación</h3>
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Haz clic para ver</span>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {investigation.plan.map(step => (
                                    <li key={step.id}>
                                        <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => setActiveView({ type: 'step', id: step.id })}
                                                disabled={step.status === 'pending'}
                                                className={`flex-1 text-left flex items-start p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-w-0 w-full min-h-[56px] ${
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
                                               <span className="block text-left break-words leading-tight">{step.title}</span>
                                           </div>
                                           <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                               {step.status === 'completed' && (
                                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                   </svg>
                                               )}
                                               {step.status === 'in-progress' && (
                                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                   </svg>
                                               )}
                                               {step.status === 'pending' && (
                                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                   </svg>
                                               )}
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
                                            onClick={() => setActiveView({ type: 'report', id: null })}
                                            className={`w-full text-left flex items-center p-3 rounded-lg lg:rounded-xl text-sm transition-all duration-200 min-h-[56px] ${
                                                activeView.type === 'report'
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-semibold border border-green-200 shadow-sm' 
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                           <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                               </svg>
                                           </div>
                                           <span className="ml-3">Reporte Final</span>
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                           </svg>
                                        </button>
                                    </li>
                                )}
                            </ul>
                            
                            {/* Legend */}
                            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                <div className="text-xs text-slate-600 mb-2 font-medium">Estados:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>Completado</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span>En progreso</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                                        <span>Pendiente</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span>Error</span>
                                    </div>
                                </div>
                            </div>
                        </nav>

                        {/* Action Buttons */}
                        <div className="pt-6 border-t border-slate-200 space-y-3">
                            {investigation.currentStep < investigation.plan.length && (
                                <button
                                    onClick={handleExecuteNextStep}
                                    disabled={investigation.isGenerating}
                                    className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200"
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
                                    className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200"
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
                              <span className="text-xs ml-1">Anterior</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="block lg:hidden absolute top-1/2 right-2 transform -translate-y-1/2 text-slate-300 z-10">
                          {investigation && (
                            (activeView.type === 'step' && activeView.id && activeView.id < investigation.plan.length && investigation.plan.find(s => s.id === activeView.id + 1)?.status !== 'pending') ||
                            (activeView.type === 'step' && activeView.id === investigation.plan.length && investigation.finalReport)
                          ) && (
                            <div className="flex items-center animate-pulse">
                              <span className="text-xs mr-1">Siguiente</span>
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
                                                <h2 className="text-2xl font-bold text-slate-900">{activeContent.title}</h2>
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
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span>{copiedStepId === activeView.id ? '¡Copiado!' : 'Copiar Paso'}</span>
                                            </button>
                                        )}
                                    {activeView.type === 'report' && investigation.finalReport && (
                                        <button
                                            onClick={handleCopyReport}
                                                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                                <span>{isCopied ? '¡Copiado!' : 'Copiar Reporte'}</span>
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
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="prose prose-slate prose-xl max-w-none text-slate-800 leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-base prose-p:leading-7 prose-strong:text-slate-900 prose-strong:font-semibold prose-ul:text-base prose-ol:text-base prose-li:text-base prose-li:leading-7">
                                        <Suspense fallback={
                                          <div className="flex justify-center items-center py-8">
                                            <Spinner />
                                            <span className="ml-3 text-slate-600">Procesando contenido...</span>
                                          </div>
                                        }>
                                          <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                              // Optimize for mobile rendering
                                              h1: ({children}) => <h1 className="text-xl lg:text-2xl mb-4">{children}</h1>,
                                              h2: ({children}) => <h2 className="text-lg lg:text-xl mb-3">{children}</h2>,
                                              h3: ({children}) => <h3 className="text-base lg:text-lg mb-2">{children}</h3>,
                                              p: ({children}) => <p className="text-sm lg:text-base mb-3 leading-6">{children}</p>,
                                              ul: ({children}) => <ul className="text-sm lg:text-base mb-3 pl-4 space-y-1">{children}</ul>,
                                              ol: ({children}) => <ol className="text-sm lg:text-base mb-3 pl-4 space-y-1">{children}</ol>
                                            }}
                                          >
                                            {activeContent.content}
                                          </ReactMarkdown>
                                        </Suspense>
                                        </div>
                                    </div>
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

                                {/* Medical Disclaimers */}
                                {activeView.type === 'report' && (
                                    <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-amber-800 mb-2">Avisos Médicos Importantes</h4>
                                                <div className="text-sm text-amber-700 space-y-1">
                                                    <p>⚠️ <strong>IMPORTANTE:</strong> Este análisis es generado por IA y no reemplaza el juicio clínico profesional.</p>
                                                    <p>👨‍⚕️ <strong>SUPERVISIÓN MÉDICA REQUERIDA:</strong> Todas las recomendaciones deben ser validadas por un médico calificado.</p>
                                                    <p>🚫 <strong>NO ES DIAGNÓSTICO:</strong> Este análisis no constituye un diagnóstico médico definitivo.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Sources */}
                                {activeContent.sources && activeContent.sources.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center mb-4">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-semibold text-slate-800">Fuentes Consultadas</h4>
                                            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-600 text-xs font-medium rounded-full">
                                                {activeContent.sources.length} fuente{activeContent.sources.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <ul className="space-y-4">
                                            {activeContent.sources.map((source, index) => (
                                                    <li key={index} className="flex items-start group">
                                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <a 
                                                                href={source.web.uri} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="block text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors group-hover:bg-blue-50 p-2 rounded-lg -m-2"
                                                                title={`Abrir: ${source.web.uri}`}
                                                            >
                                                        {source.web.title || source.web.uri}
                                                    </a>
                                                            <div className="mt-1 flex items-center text-xs text-slate-500">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                                <span className="truncate">{source.web.uri}</span>
                                                            </div>
                                                        </div>
                                                </li>
                                            ))}
                                        </ul>
                                        </div>
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