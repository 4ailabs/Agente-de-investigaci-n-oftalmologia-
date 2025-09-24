import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

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
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-[9999] transition-opacity duration-500">
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl mb-6">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">Agente de Investigación Clínica</h1>
          <p className="text-blue-200 text-sm">Oftalmología Especializada</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-400 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-slate-300 text-xs">{progress}%</p>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-slate-300 text-xs">{steps[currentStep]}</p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-700/50">
          <p className="text-slate-400 text-xs">Desarrollado por 4ailabs</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
