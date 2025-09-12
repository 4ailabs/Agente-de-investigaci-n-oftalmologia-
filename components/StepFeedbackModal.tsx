import React, { useState } from 'react';

interface StepFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feedback: StepFeedback) => void;
  stepTitle: string;
  stepId: number;
}

export interface StepFeedback {
  stepId: number;
  observations: string;
  additionalData: string;
  clinicalFindings: string;
  recommendations: string;
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
}

const StepFeedbackModal: React.FC<StepFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSave,
  stepTitle,
  stepId
}) => {
  const [observations, setObservations] = useState('');
  const [additionalData, setAdditionalData] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSave = () => {
    const feedback: StepFeedback = {
      stepId,
      observations: observations.trim(),
      additionalData: additionalData.trim(),
      clinicalFindings: clinicalFindings.trim(),
      recommendations: recommendations.trim(),
      confidence,
      timestamp: new Date().toISOString()
    };

    onSave(feedback);
    onClose();
    
    // Reset form
    setObservations('');
    setAdditionalData('');
    setClinicalFindings('');
    setRecommendations('');
    setConfidence('medium');
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setObservations('');
    setAdditionalData('');
    setClinicalFindings('');
    setRecommendations('');
    setConfidence('medium');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Feedback del Especialista</h2>
                <p className="text-sm text-slate-600">Paso: {stepTitle}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Observaciones Generales */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Observaciones Generales
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Describe tus observaciones sobre este paso de la investigación..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Datos Adicionales */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Datos Adicionales del Examen
              </label>
              <textarea
                value={additionalData}
                onChange={(e) => setAdditionalData(e.target.value)}
                placeholder="Agrega cualquier dato adicional que hayas encontrado durante el examen..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Hallazgos Clínicos */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hallazgos Clínicos Específicos
              </label>
              <textarea
                value={clinicalFindings}
                onChange={(e) => setClinicalFindings(e.target.value)}
                placeholder="Detalla los hallazgos clínicos específicos observados..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Recomendaciones */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Recomendaciones Adicionales
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Incluye cualquier recomendación adicional basada en tus hallazgos..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Nivel de Confianza */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nivel de Confianza en los Hallazgos
              </label>
              <div className="flex space-x-4">
                {[
                  { value: 'low', label: 'Bajo', color: 'text-red-600 bg-red-50 border-red-200' },
                  { value: 'medium', label: 'Medio', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                  { value: 'high', label: 'Alto', color: 'text-green-600 bg-green-50 border-green-200' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="confidence"
                      value={option.value}
                      checked={confidence === option.value}
                      onChange={(e) => setConfidence(e.target.value as 'low' | 'medium' | 'high')}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                      confidence === option.value 
                        ? option.color + ' border-current' 
                        : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      {option.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Esta información será integrada al reporte final
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepFeedbackModal;
