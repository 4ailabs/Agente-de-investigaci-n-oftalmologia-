import React, { useState, useMemo } from 'react';
import { InvestigationState, ResearchStep, Source } from './types';
import { createResearchPlanPrompt, createExecuteStepPrompt, createFinalReportPrompt } from './constants';
import { generateContent } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import ExplanationModal from './components/ExplanationModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
     <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Paso 1: Iniciar Nueva Investigación</h2>
          <p className="text-sm text-slate-500 mb-4">
            Introduce los datos del paciente y la consulta clínica. El agente usará esta información para crear un plan de investigación personalizado.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-md font-medium text-slate-700 mb-2">Datos Demográficos del Paciente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-700">Edad</label>
                        <input
                            type="number"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Ej: 72"
                            required
                        />
                     </div>
                     <div>
                        <label htmlFor="sex" className="block text-sm font-medium text-slate-700">Sexo</label>
                         <select
                            id="sex"
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        >
                            <option value="" disabled>Seleccionar...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                        </select>
                     </div>
                </div>
            </div>
            <div>
                <label htmlFor="clinical-info" className="block text-sm font-medium text-slate-700">Síntomas y Antecedentes Clínicos</label>
                 <textarea
                    id="clinical-info"
                    value={clinicalInfo}
                    onChange={(e) => setClinicalInfo(e.target.value)}
                    rows={6}
                    className="mt-1 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Ej: Paciente con historial de glaucoma presenta una disminución súbita de la visión en el ojo derecho..."
                    required
                />
            </div>
           
            <button
              type="submit"
              disabled={isFormInvalid}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Spinner /><span className="ml-2">Creando Plan...</span></> : 'Iniciar Investigación'}
            </button>
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

  const handleStartInvestigation = async (query: string) => {
    setInvestigation({
        originalQuery: query,
        plan: [],
        currentStep: 0,
        isGenerating: true,
        error: null,
        finalReport: null,
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
    
    const { text: reportText } = await generateContent(prompt, false);

    setInvestigation(prev => {
        if (!prev) return null;
        if (reportText.startsWith('Ocurrió un error:')) {
            return {...prev, error: reportText, isGeneratingReport: false };
        }
        return {...prev, finalReport: reportText, isGeneratingReport: false };
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


  const handleReset = () => {
      setInvestigation(null);
  }

  const activeContent = useMemo(() => {
    if (!investigation) return null;
    if (activeView.type === 'report') {
        return {
            title: "Reporte Clínico Final",
            content: investigation.finalReport,
            sources: null,
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
    <div className="min-h-screen bg-slate-100">
      <Header onShowExplanation={() => setShowExplanation(true)} />
      {showExplanation && <ExplanationModal onClose={() => setShowExplanation(false)} />}
      {!investigation ? (
        <InitialQueryInput 
          onSubmit={handleStartInvestigation} 
          isLoading={investigation?.isGenerating ?? false}
        />
      ) : investigation.isGenerating && investigation.plan.length === 0 ? (
         <div className="flex items-center justify-center h-64">
           <Spinner />
           <span className="ml-3 text-slate-500">Creando plan de investigación...</span>
         </div>
      ) : (
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column: Control Panel */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="bg-white p-4 rounded-lg shadow-md sticky top-24">
                        <div className="pb-4 border-b border-slate-200">
                             <div className="flex justify-between items-center">
                                <h2 className="text-sm font-semibold text-slate-800">Investigación Actual</h2>
                                <button onClick={handleReset} className="text-xs text-blue-600 hover:text-blue-800">
                                    Nuevo
                                </button>
                             </div>
                             <p className="mt-1 text-xs text-slate-500 line-clamp-2" title={investigation.originalQuery}>{investigation.originalQuery}</p>
                        </div>

                        <nav className="my-4">
                            <ul className="space-y-1">
                                {investigation.plan.map(step => (
                                    <li key={step.id}>
                                        <button 
                                            onClick={() => setActiveView({ type: 'step', id: step.id })}
                                            disabled={step.status === 'pending' || step.status === 'in-progress'}
                                            className={`w-full text-left flex items-center p-2 rounded-md text-sm transition-colors ${
                                                activeView.type === 'step' && activeView.id === step.id 
                                                ? 'bg-blue-50 text-blue-700 font-semibold' 
                                                : 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed'
                                            }`}
                                        >
                                           <StatusIcon status={step.status} />
                                           <span className="ml-3 truncate">{step.title}</span>
                                        </button>
                                    </li>
                                ))}
                                {investigation.finalReport && (
                                     <li>
                                        <button 
                                            onClick={() => setActiveView({ type: 'report', id: null })}
                                            className={`w-full text-left flex items-center p-2 rounded-md text-sm transition-colors ${
                                                activeView.type === 'report'
                                                ? 'bg-green-50 text-green-700 font-semibold' 
                                                : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                           <StatusIcon status={'completed'} />
                                           <span className="ml-3">Reporte Final</span>
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </nav>

                        <div className="pt-4 border-t border-slate-200">
                            {investigation.currentStep < investigation.plan.length && (
                                <button
                                    onClick={handleExecuteNextStep}
                                    disabled={investigation.isGenerating}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                                >
                                    {investigation.isGenerating ? <><Spinner /><span className="ml-2">Ejecutando...</span></> : `Ejecutar Paso ${investigation.currentStep + 1}`}
                                </button>
                            )}
                            {investigation.currentStep >= investigation.plan.length && !investigation.finalReport && (
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={investigation.isGeneratingReport}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed"
                                >
                                    {investigation.isGeneratingReport ? <><Spinner /><span className="ml-2">Generando...</span></> : 'Generar Reporte Final'}
                                </button>
                            )}
                        </div>
                         {investigation.error && <p className="text-red-500 text-xs mt-2 p-2 bg-red-50 rounded">{investigation.error}</p>}
                    </div>
                </div>

                {/* Right Column: Content Display */}
                <div className="md:col-span-8 lg:col-span-9">
                    <div className="bg-white p-6 rounded-lg shadow-md min-h-[60vh]">
                        {activeContent ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-slate-900">{activeContent.title}</h2>
                                    {activeView.type === 'report' && investigation.finalReport && (
                                        <button
                                            onClick={handleCopyReport}
                                            className="flex items-center space-x-2 text-sm px-3 py-1.5 rounded-md transition-colors bg-slate-200 hover:bg-slate-300 text-slate-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>{isCopied ? '¡Copiado!' : 'Copiar Reporte (Markdown)'}</span>
                                        </button>
                                    )}
                                </div>
                                {activeContent.status === 'in-progress' ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                        <Spinner/>
                                        <p className="mt-3">Procesando, por favor espera...</p>
                                    </div>
                                ) : activeContent.content ? (
                                     <div className="prose prose-slate prose-sm max-w-none text-slate-800">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeContent.content}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-500 py-12">
                                        <p>Este paso aún no se ha ejecutado.</p>
                                    </div>
                                )}
                                {activeContent.sources && activeContent.sources.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Fuentes Consultadas</h4>
                                        <ul className="mt-2 list-decimal list-inside space-y-2 bg-slate-50 p-4 rounded-md">
                                            {activeContent.sources.map((source, index) => (
                                                <li key={index} className="text-sm">
                                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={source.web.title || source.web.uri}>
                                                        {source.web.title || source.web.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                <p>Selecciona un paso para ver los detalles.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
      )}
    </div>
  );
};

export default App;