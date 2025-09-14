import React from 'react';

const Header: React.FC<{ 
  onShowExplanation: () => void;
  onShowHistory: () => void;
  onShowImageUploader: () => void;
  investigationCount: number;
}> = ({ onShowExplanation, onShowHistory, onShowImageUploader, investigationCount }) => {
  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 lg:py-6">
        <div className="flex items-center justify-between h-14 lg:h-auto">
            {/* Logo and Title - Responsive */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                    {/* Mobile logo */}
                    <div className="lg:hidden w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                    </div>
                    
                    {/* Desktop logo */}
                    <div className="hidden lg:block relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                </div>
                
                {/* Title */}
                <h1 className="text-sm lg:text-xl font-bold text-slate-900 lg:text-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:to-slate-700 lg:bg-clip-text leading-tight truncate">
                  Agente de Investigación Clínica de Oftalmología
                </h1>
            </div>
            
            {/* Action buttons - Responsive */}
            <div className="flex items-center space-x-2 flex-shrink-0">
                {/* History button - Mobile */}
                <button 
                    onClick={onShowHistory} 
                    className="lg:hidden flex items-center justify-center w-12 h-12 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px] relative"
                    aria-label="Historial de investigaciones"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {investigationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {investigationCount}
                        </span>
                    )}
                </button>

                {/* Image Analysis button - Mobile */}
                <button 
                    onClick={onShowImageUploader} 
                    className="lg:hidden flex items-center justify-center w-12 h-12 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]"
                    aria-label="Analizar imágenes médicas"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>

                {/* Guide button - Mobile */}
                <button 
                    onClick={onShowExplanation} 
                    className="lg:hidden flex items-center justify-center w-12 h-12 text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 min-h-[44px] min-w-[44px]"
                    aria-label="Guía de uso"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Desktop buttons */}
                <button 
                    onClick={onShowHistory} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm min-h-[44px] relative"
                    aria-label="Historial de investigaciones"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Historial</span>
                    {investigationCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {investigationCount}
                        </span>
                    )}
                </button>

                <button 
                    onClick={onShowImageUploader} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm min-h-[44px]"
                    aria-label="Analizar imágenes médicas"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Analizar Imágenes</span>
                </button>

                <button 
                    onClick={onShowExplanation} 
                    className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm min-h-[44px]"
                    aria-label="Cómo funciona"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Guía de uso</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;