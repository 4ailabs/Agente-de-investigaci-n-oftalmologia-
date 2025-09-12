import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    "Inicializando sistema médico...",
    "Cargando base de conocimientos oftalmológicos...",
    "Preparando agente de IA especializado...",
    "Verificando conectividad...",
    "Listo para investigaciones clínicas"
  ];

  useEffect(() => {
    console.log('🎬 Splash screen iniciado');
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          console.log('🎬 Splash screen completado');
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500); // Delay para transición suave
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [onComplete, steps.length]);

  if (!isVisible) {
    console.log('🎬 Splash screen no visible');
    return null;
  }

  console.log('🎬 Splash screen renderizando');

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center z-[9999] transition-opacity duration-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-300 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-red-500 text-white text-xs">
          DEBUG: Progress: {progress}%, Step: {currentStep}, Visible: {isVisible.toString()}
        </div>
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Agente de Investigación Clínica</h1>
          <p className="text-blue-200 text-lg">Oftalmología Especializada</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-blue-800/30 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-blue-100 text-sm">{progress}%</p>
        </div>

        {/* Current Step */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-white text-sm font-medium">{steps[currentStep]}</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="w-8 h-8 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white text-xs font-medium">IA Médica</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-white text-xs font-medium">Investigación</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="w-8 h-8 mx-auto mb-2 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white text-xs font-medium">Reportes</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="w-8 h-8 mx-auto mb-2 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-white text-xs font-medium">Rápido</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/20">
          <p className="text-blue-200 text-xs">Desarrollado por 4ailabs</p>
          <p className="text-blue-300/70 text-xs mt-1">Powered by Google Gemini AI</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
