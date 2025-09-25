import React from 'react';
import { Eye, History, Camera, X, Menu, ChevronDown, HelpCircle, Image } from 'lucide-react';

const Header: React.FC<{ 
  onShowExplanation: () => void;
  onShowHistory: () => void;
  onShowImageUploader: () => void;
  investigationCount: number;
}> = ({ onShowExplanation, onShowHistory, onShowImageUploader, investigationCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center h-12 lg:h-14">
            {/* Logo and Title - Medical Professional Style */}
            <div className="flex items-center space-x-4">
                <div className="relative flex-shrink-0">
                    {/* Mobile logo - Medical Cross */}
                    <div className="lg:hidden w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center shadow-md">
                        <Eye className="h-4 w-4 text-white" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full border border-white"></div>
                    </div>
                    
                    {/* Desktop logo - Professional Medical */}
                    <div className="hidden lg:block relative">
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg">
                            <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                    </div>
                </div>
                
                {/* Title - Medical Professional Style */}
                <div className="flex flex-col">
                    <h1 className="text-xs lg:text-lg font-bold text-slate-900 leading-tight">
                        Agente Oftalmología
                    </h1>
                    <p className="text-xs text-slate-600 font-medium">
                        Investigación Clínica
                    </p>
                </div>
            </div>
            
            {/* Action buttons - Responsive */}
            <div className="flex items-center space-x-2 ml-6">
                {/* History button - Mobile */}
                <button 
                    onClick={onShowHistory} 
                    className="lg:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-lg transition-all duration-200 relative"
                    aria-label="Historial de investigaciones"
                >
                    <History className="h-4 w-4" />
                    {investigationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-slate-800 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                            {investigationCount}
                        </span>
                    )}
                </button>

                {/* Image Analysis button - Mobile */}
                <button 
                    onClick={onShowImageUploader} 
                    className="lg:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-lg transition-all duration-200"
                    aria-label="Analizar imágenes médicas"
                >
                    <Camera className="h-4 w-4" />
                </button>

                {/* Guide button - Mobile */}
                <button 
                    onClick={onShowExplanation} 
                    className="lg:hidden flex items-center justify-center w-10 h-10 text-slate-700 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-lg transition-all duration-200"
                    aria-label="Guía de uso"
                >
                    <HelpCircle className="h-4 w-4" />
                </button>

                {/* Desktop buttons - Medical Professional Style */}
                <button 
                    onClick={onShowHistory} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm relative"
                    aria-label="Historial de investigaciones"
                >
                    <History className="h-3 w-3" />
                    <span>Historial Clínico</span>
                    {investigationCount > 0 && (
                        <span className="bg-slate-800 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                            {investigationCount}
                        </span>
                    )}
                </button>

                <button 
                    onClick={onShowImageUploader} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm"
                    aria-label="Analizar imágenes médicas"
                >
                    <Image className="h-3 w-3" />
                    <span>Análisis de Imágenes</span>
                </button>

                <button 
                    onClick={onShowExplanation} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 shadow-sm"
                    aria-label="Cómo funciona"
                >
                    <HelpCircle className="h-3 w-3" />
                    <span>Documentación</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;