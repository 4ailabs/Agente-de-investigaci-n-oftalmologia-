import React, { useState, useEffect } from 'react';
import { EnhancedPatientData, RedFlags, DataQuality } from '../types/enhancedDataTypes';
import { MedicalDataExtractionService } from '../services/medicalDataExtraction';

interface EnhancedDataFormProps {
  onSubmit: (data: EnhancedPatientData) => void;
  onCancel: () => void;
  initialData?: Partial<EnhancedPatientData>;
  isLoading?: boolean;
}

export const EnhancedDataForm: React.FC<EnhancedDataFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<EnhancedPatientData>>({
    age: 0,
    sex: 'M',
    systemicDiseases: [],
    currentMedications: [],
    allergies: [],
    previousSurgeries: [],
    familyHistory: [],
    symptoms: {
      mainSymptom: {
        description: '',
        duration: '',
        laterality: 'Ambos',
        severity: 5,
        pattern: 'Agudo'
      },
      associatedSymptoms: {
        pain: {
          present: false,
          location: 'Periorbitario',
          type: 'Punzante',
          intensity: 5
        },
        photophobia: false,
        tearing: 'Normal',
        discharge: {
          present: false,
          type: 'Acuosa',
          color: 'Clara',
          consistency: 'Líquida',
          amount: 'Leve'
        },
        visualDisturbance: {
          blur: {
            present: false,
            type: 'Gradual',
            laterality: 'Ambos',
            distance: 'Ambas'
          },
          distortion: false,
          colorVision: 'Normal',
          nightVision: 'Normal'
        },
        photopsias: false,
        scotomas: false,
        diplopia: 'Ninguna'
      }
    },
    chiefComplaint: '',
    historyOfPresentIllness: '',
    socialHistory: {
      smoking: 'Nunca',
      alcohol: 'Nunca',
      drugs: []
    },
    ...initialData
  });

  const [redFlags, setRedFlags] = useState<RedFlags>({
    acuteVisionLoss: false,
    severePain: false,
    trauma: false,
    flashes: false,
    floaters: false,
    diplopia: false,
    headache: false,
    nausea: false,
    vomiting: false,
    fever: false,
    rash: false,
    other: []
  });

  const [dataQuality, setDataQuality] = useState<DataQuality>({
    completeness: 0,
    consistency: 100,
    medicalValidity: 0,
    missingFields: [],
    inconsistencies: [],
    suggestions: []
  });

  const [activeSection, setActiveSection] = useState<'demographics' | 'symptoms' | 'exam' | 'history'>('demographics');
  const [showRedFlags, setShowRedFlags] = useState(false);

  // Actualizar calidad de datos cuando cambie el formulario
  useEffect(() => {
    const quality = MedicalDataExtractionService.validateDataQuality(formData);
    setDataQuality(quality);
  }, [formData]);

  // Detectar red flags cuando cambien los síntomas
  useEffect(() => {
    const detectRedFlags = async () => {
      const symptomsText = JSON.stringify(formData.symptoms);
      const detectedFlags = await MedicalDataExtractionService.detectRedFlags(symptomsText);
      setRedFlags(detectedFlags);
      
      // Mostrar alerta si hay red flags
      const hasUrgentFlags = Object.values(detectedFlags).some(flag => 
        Array.isArray(flag) ? flag.length > 0 : flag === true
      );
      setShowRedFlags(hasUrgentFlags);
    };

    detectRedFlags();
  }, [formData.symptoms]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (path: string[], value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.age && formData.sex && formData.symptoms?.mainSymptom?.description) {
      onSubmit(formData as EnhancedPatientData);
    }
  };

  const isFormValid = formData.age && formData.sex && formData.symptoms?.mainSymptom?.description;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header con indicadores de calidad */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Formulario Médico Estructurado</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600">
              Calidad: <span className="font-semibold text-green-600">{dataQuality.medicalValidity}%</span>
            </div>
            <div className="text-sm text-slate-600">
              Completitud: <span className="font-semibold text-blue-600">{dataQuality.completeness}%</span>
            </div>
          </div>
        </div>

        {/* Alertas de red flags */}
        {showRedFlags && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-800 font-medium">Signos de Alarma Detectados</span>
            </div>
            <div className="mt-2 text-sm text-red-700">
              {Object.entries(redFlags).map(([key, value]) => 
                (Array.isArray(value) ? value.length > 0 : value) && (
                  <span key={key} className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-2 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Navegación por secciones */}
        <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'demographics', label: 'Demográficos', icon: '👤' },
            { id: 'symptoms', label: 'Síntomas', icon: '🔍' },
            { id: 'exam', label: 'Examen', icon: '🔬' },
            { id: 'history', label: 'Antecedentes', icon: '📋' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario por secciones */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección Demográficos */}
        {activeSection === 'demographics' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos Demográficos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="120"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.sex || 'M'}
                  onChange={(e) => handleInputChange('sex', e.target.value as 'M' | 'F' | 'Otros')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ocupación
                </label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Obrero, Oficinista, Estudiante"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ciudad, País"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sección Síntomas */}
        {activeSection === 'symptoms' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Síntomas Oftalmológicos</h3>
            
            {/* Síntoma principal */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Síntoma Principal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.symptoms?.mainSymptom?.description || ''}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'mainSymptom', 'description'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe el síntoma principal del paciente"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={formData.symptoms?.mainSymptom?.duration || ''}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'mainSymptom', 'duration'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 2 días, 1 semana, 3 meses"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lateralidad
                  </label>
                  <select
                    value={formData.symptoms?.mainSymptom?.laterality || 'Ambos'}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'mainSymptom', 'laterality'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="OD">Ojo Derecho</option>
                    <option value="OI">Ojo Izquierdo</option>
                    <option value="Ambos">Ambos Ojos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Severidad (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.symptoms?.mainSymptom?.severity || 5}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'mainSymptom', 'severity'], parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1 (Leve)</span>
                    <span className="font-medium">{formData.symptoms?.mainSymptom?.severity || 5}</span>
                    <span>10 (Severo)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Patrón
                  </label>
                  <select
                    value={formData.symptoms?.mainSymptom?.pattern || 'Agudo'}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'mainSymptom', 'pattern'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Agudo">Agudo</option>
                    <option value="Subagudo">Subagudo</option>
                    <option value="Crónico">Crónico</option>
                    <option value="Recurrente">Recurrente</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Síntomas asociados */}
            <div>
              <h4 className="text-md font-medium text-slate-700 mb-3">Síntomas Asociados</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="photophobia"
                    checked={formData.symptoms?.associatedSymptoms?.photophobia || false}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'associatedSymptoms', 'photophobia'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="photophobia" className="ml-2 text-sm text-slate-700">
                    Fotofobia (sensibilidad a la luz)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="photopsias"
                    checked={formData.symptoms?.associatedSymptoms?.photopsias || false}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'associatedSymptoms', 'photopsias'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="photopsias" className="ml-2 text-sm text-slate-700">
                    Destellos de luz (fotopsias)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="scotomas"
                    checked={formData.symptoms?.associatedSymptoms?.scotomas || false}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'associatedSymptoms', 'scotomas'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="scotomas" className="ml-2 text-sm text-slate-700">
                    Escotomas (manchas en la visión)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="distortion"
                    checked={formData.symptoms?.associatedSymptoms?.visualDisturbance?.distortion || false}
                    onChange={(e) => handleNestedInputChange(['symptoms', 'associatedSymptoms', 'visualDisturbance', 'distortion'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="distortion" className="ml-2 text-sm text-slate-700">
                    Distorsión visual
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          
          <div className="flex items-center space-x-4">
            {dataQuality.suggestions.length > 0 && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Sugerencias:</span> {dataQuality.suggestions.length}
              </div>
            )}
            
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Procesando...' : 'Iniciar Investigación'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
