import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 border-t border-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-3 lg:mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-slate-800">4 ailabs</h3>
                <p className="text-slate-500 text-xs lg:text-sm">Desarrollo de IA Médica</p>
              </div>
            </div>
            <p className="text-slate-600 text-xs lg:text-sm leading-relaxed">
              Especialistas en el desarrollo de herramientas de inteligencia artificial para el sector médico, 
              enfocadas en mejorar la precisión diagnóstica y la eficiencia clínica.
            </p>
          </div>

          {/* Technology Section */}
          <div className="md:col-span-1">
            <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-slate-800">Tecnología</h4>
            <ul className="space-y-1 lg:space-y-2 text-xs lg:text-sm text-slate-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Google Gemini AI
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                React & TypeScript
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Análisis Basado en Evidencia
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Búsqueda Web Inteligente
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-1">
            <h4 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-slate-800">Desarrollado por</h4>
            <div className="space-y-2 lg:space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">4A</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm lg:text-base">4 ailabs</p>
                  <p className="text-slate-500 text-xs lg:text-sm">Laboratorio de IA</p>
                </div>
              </div>
              <div className="pt-1 lg:pt-2">
                <p className="text-slate-600 text-xs lg:text-sm">
                  Especializados en soluciones de IA para el sector médico, 
                  desarrollamos herramientas que combinan la precisión tecnológica 
                  con la experiencia clínica.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-300 mt-4 lg:mt-8 pt-4 lg:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 md:mb-0">
              <p className="text-slate-500 text-xs lg:text-sm">
                © 2024 4 ailabs. Todos los derechos reservados.
              </p>
              <span className="hidden sm:inline text-slate-400">•</span>
              <p className="text-slate-500 text-xs lg:text-sm">
                Herramienta de investigación clínica oftalmológica
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-slate-500 text-xs lg:text-sm">
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Desarrollado con IA</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-500 text-xs lg:text-sm">
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                <span>Basado en evidencia médica</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
