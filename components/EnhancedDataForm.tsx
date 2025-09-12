import React, { useState, useEffect } from 'react';
import { EnhancedPatientData, RedFlags, DataQuality } from '../types/enhancedDataTypes';
import { MedicalDataExtractionService } from '../services/medicalDataExtraction';

// Función helper para valores por defecto inteligentes
const getSmartDefaults = (age: number) => {
  if (age >= 65) {
    // Pacientes mayores (≥65 años)
    return {
      visualAcuity: { withCorrection: true },  // Más probable que usen corrección
      intraocularPressure: { method: 'Goldmann' as const }, // Método estándar
      lens: { clarity: 'Catarata' as const },  // Alta probabilidad de cataratas
    };
  } else if (age >= 40) {
    // Pacientes de mediana edad (40-64 años)
    return {
      visualAcuity: { withCorrection: false },
      intraocularPressure: { method: 'Goldmann' as const },
      lens: { clarity: 'Clara' as const },
    };
  } else {
    // Pacientes jóvenes (<40 años)
    return {
      visualAcuity: { withCorrection: false },
      intraocularPressure: { method: 'iCare' as const }, // Más cómodo para jóvenes
      lens: { clarity: 'Clara' as const },
    };
  }
};

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
    // Información clínica consolidada (elimina duplicación)
    clinicalInfo: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      reviewOfSystems: []
    },
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

  const [activeSection, setActiveSection] = useState<'demographics' | 'clinical' | 'history' | 'symptoms' | 'exam'>('demographics');
  const [showRedFlags, setShowRedFlags] = useState(false);

  // Valores por defecto inteligentes basados en edad
  useEffect(() => {
    if (formData.age && formData.age > 0) {
      const smartDefaults = getSmartDefaults(formData.age);
      
      // Solo aplicar defaults si los campos están vacíos
      setFormData(prev => ({
        ...prev,
        exam: {
          ...prev.exam,
          visualAcuity: {
            OD: prev.exam?.visualAcuity?.OD || '',
            OI: prev.exam?.visualAcuity?.OI || '',
            withCorrection: prev.exam?.visualAcuity?.withCorrection ?? smartDefaults.visualAcuity.withCorrection,
            pinhole: prev.exam?.visualAcuity?.pinhole || ''
          },
          intraocularPressure: {
            OD: prev.exam?.intraocularPressure?.OD || 0,
            OI: prev.exam?.intraocularPressure?.OI || 0,
            method: prev.exam?.intraocularPressure?.method || smartDefaults.intraocularPressure.method
          },
          anteriorSegment: {
            ...prev.exam?.anteriorSegment,
            lens: {
              ...prev.exam?.anteriorSegment?.lens,
              clarity: prev.exam?.anteriorSegment?.lens?.clarity || smartDefaults.lens.clarity
            }
          }
        }
      }));
    }
  }, [formData.age]);

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
    if (formData.age && formData.sex && formData.clinicalInfo?.chiefComplaint) {
      onSubmit(formData as EnhancedPatientData);
    }
  };

  const isFormValid = formData.age && formData.sex && formData.clinicalInfo?.chiefComplaint;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4">
      {/* Header con indicadores de calidad */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Formulario Médico Estructurado</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
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

        {/* Navegación por secciones - Optimizada para móvil */}
        <div className="bg-slate-100 rounded-lg p-1 overflow-hidden">
          {/* Desktop tabs */}
          <div className="hidden md:flex space-x-1">
            {[
              { id: 'demographics', label: 'Demográficos' },
              { id: 'clinical', label: 'Motivo de Consulta' },
              { id: 'history', label: 'Antecedentes' },
              { id: 'symptoms', label: 'Síntomas' },
              { id: 'exam', label: 'Examen' }
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
                {section.label}
              </button>
            ))}
          </div>
          
          {/* Mobile dropdown */}
          <div className="md:hidden">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-base font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="demographics">1. Demográficos</option>
              <option value="clinical">2. Motivo de Consulta</option>
              <option value="history">3. Antecedentes</option>
              <option value="symptoms">4. Síntomas</option>
              <option value="exam">5. Examen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulario por secciones */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Sección Demográficos */}
        {activeSection === 'demographics' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos Demográficos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[40px]"
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
                  className="w-full px-4 py-3 sm:px-3 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm min-h-[48px] sm:min-h-[40px]"
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

        {/* Nueva sección: Motivo de Consulta Consolidado */}
        {activeSection === 'clinical' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Motivo de Consulta</h3>
            
            <div className="space-y-6">
              {/* Queja Principal */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Queja Principal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.clinicalInfo?.chiefComplaint || ''}
                  onChange={(e) => handleNestedInputChange(['clinicalInfo', 'chiefComplaint'], e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Resumen breve del motivo de consulta principal"
                  required
                />
              </div>

              {/* Historia de la Enfermedad Actual */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Historia de la Enfermedad Actual
                </label>
                <textarea
                  value={formData.clinicalInfo?.historyOfPresentIllness || ''}
                  onChange={(e) => handleNestedInputChange(['clinicalInfo', 'historyOfPresentIllness'], e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Descripción detallada de la evolución y características del cuadro clínico actual..."
                />
              </div>

              {/* Ayuda contextual */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Guía para completar:</p>
                    <ul className="text-xs space-y-1">
                      <li>• <strong>Queja Principal:</strong> Una frase concisa del problema principal</li>
                      <li>• <strong>Historia Actual:</strong> Cronología detallada, factores desencadenantes, síntomas asociados</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección Examen Oftalmológico - Estructura optimizada por ojo */}
        {activeSection === 'exam' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Examen Oftalmológico</h3>
            
            {/* Navegación por ojo */}
            <div className="flex space-x-2 mb-6">
              <div className="flex-1 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                <h4 className="text-center font-semibold text-red-800 mb-4">OJO DERECHO (OD)</h4>
                
                {/* Agudeza Visual OD */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Agudeza Visual</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.exam?.visualAcuity?.OD || ''}
                      onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'OD'], e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="20/20"
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.exam?.visualAcuity?.withCorrection || false}
                        onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'withCorrection'], e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-xs text-slate-700">c/c</label>
                    </div>
                  </div>
                </div>

                {/* PIO OD */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">PIO (mmHg)</label>
                  <input
                    type="number"
                    value={formData.exam?.intraocularPressure?.OD || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'OD'], parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="16"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>

                {/* Copa/Disco OD */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Copa/Disco</label>
                  <input
                    type="text"
                    value={formData.exam?.fundus?.opticNerve?.cupDiscRatio?.OD || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'opticNerve', 'cupDiscRatio', 'OD'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.3"
                  />
                </div>

                {/* Pupila OD */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pupila</label>
                  <select
                    value={formData.exam?.pupilResponse?.size?.OD || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'size', 'OD'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Miótica">Miótica</option>
                    <option value="Midriática">Midriática</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <h4 className="text-center font-semibold text-blue-800 mb-4">OJO IZQUIERDO (OI)</h4>
                
                {/* Agudeza Visual OI */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Agudeza Visual</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.exam?.visualAcuity?.OI || ''}
                      onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'OI'], e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="20/20"
                    />
                    <input
                      type="text"
                      value={formData.exam?.visualAcuity?.pinhole || ''}
                      onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'pinhole'], e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Pinhole"
                    />
                  </div>
                </div>

                {/* PIO OI */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">PIO (mmHg)</label>
                  <input
                    type="number"
                    value={formData.exam?.intraocularPressure?.OI || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'OI'], parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="16"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>

                {/* Copa/Disco OI */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Copa/Disco</label>
                  <input
                    type="text"
                    value={formData.exam?.fundus?.opticNerve?.cupDiscRatio?.OI || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'opticNerve', 'cupDiscRatio', 'OI'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0.3"
                  />
                </div>

                {/* Pupila OI */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Pupila</label>
                  <select
                    value={formData.exam?.pupilResponse?.size?.OI || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'size', 'OI'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Miótica">Miótica</option>
                    <option value="Midriática">Midriática</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campos compartidos */}
            <div className="border-t pt-6">
              <h5 className="text-md font-medium text-slate-700 mb-4">Hallazgos Generales</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Método PIO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Método PIO</label>
                  <select
                    value={formData.exam?.intraocularPressure?.method || 'Goldmann'}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'method'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Goldmann">Goldmann</option>
                    <option value="Tonopen">Tonopen</option>
                    <option value="iCare">iCare</option>
                    <option value="No medido">No medido</option>
                  </select>
                </div>

                {/* Reacción pupilar */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reacción a la luz</label>
                  <select
                    value={formData.exam?.pupilResponse?.reaction?.light || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'reaction', 'light'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Lenta">Lenta</option>
                    <option value="Ausente">Ausente</option>
                  </select>
                </div>

                {/* Anisocoria */}
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="anisocoria"
                    checked={formData.exam?.pupilResponse?.anisocoria || false}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'anisocoria'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="anisocoria" className="ml-2 text-sm text-slate-700">
                    Anisocoria
                  </label>
                </div>
              </div>
            </div>

            {/* Segmento Anterior y Fondo de Ojo (adicionales si es necesario) */}
            <div className="border-t pt-6 mt-6">
              <h5 className="text-md font-medium text-slate-700 mb-4">Hallazgos Adicionales (Opcional)</h5>

              {/* Hallazgos adicionales compactos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Conjuntiva</label>
                  <select
                    value={formData.exam?.anteriorSegment?.conjunctiva?.injection || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'conjunctiva', 'injection'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Inyectada">Inyectada</option>
                    <option value="Inflamada">Inflamada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Córnea</label>
                  <select
                    value={formData.exam?.anteriorSegment?.cornea?.clarity || 'Clara'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'cornea', 'clarity'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Clara">Clara</option>
                    <option value="Edema">Edema</option>
                    <option value="Opacidad">Opacidad</option>
                    <option value="Ulcera">Úlcera</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cristalino</label>
                  <select
                    value={formData.exam?.anteriorSegment?.lens?.clarity || 'Clara'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'lens', 'clarity'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Clara">Clara</option>
                    <option value="Catarata">Catarata</option>
                    <option value="Subluxación">Subluxación</option>
                    <option value="Afaquia">Afaquia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Estado Macular</label>
                  <select
                    value={formData.exam?.fundus?.macula?.center || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'macula', 'center'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Edema">Edema</option>
                    <option value="Atrofia">Atrofia</option>
                    <option value="Agujero">Agujero</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Campos de texto libre para observaciones adicionales */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observaciones Adicionales
              </label>
              <textarea
                value={formData.exam?.additionalNotes || ''}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Otras observaciones del examen oftalmológico..."
              />
            </div>
          </div>
        )}

        {/* Sección Antecedentes */}
        {activeSection === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Antecedentes Médicos</h3>
            
            {/* Antecedentes Sistémicos */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Enfermedades Sistémicas</h4>
              <div className="space-y-3">
                {formData.systemicDiseases?.map((disease, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={disease}
                      onChange={(e) => {
                        const newDiseases = [...(formData.systemicDiseases || [])];
                        newDiseases[index] = e.target.value;
                        handleInputChange('systemicDiseases', newDiseases);
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ej: Diabetes, Hipertensión, Artritis"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newDiseases = formData.systemicDiseases?.filter((_, i) => i !== index) || [];
                        handleInputChange('systemicDiseases', newDiseases);
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newDiseases = [...(formData.systemicDiseases || []), ''];
                    handleInputChange('systemicDiseases', newDiseases);
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  + Agregar Enfermedad
                </button>
              </div>
            </div>

            {/* Medicamentos Actuales */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Medicamentos Actuales</h4>
              <div className="space-y-3">
                {formData.currentMedications?.map((med, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => {
                        const newMeds = [...(formData.currentMedications || [])];
                        newMeds[index] = { ...med, name: e.target.value };
                        handleInputChange('currentMedications', newMeds);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del medicamento"
                    />
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...(formData.currentMedications || [])];
                        newMeds[index] = { ...med, dosage: e.target.value };
                        handleInputChange('currentMedications', newMeds);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dosis"
                    />
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => {
                        const newMeds = [...(formData.currentMedications || [])];
                        newMeds[index] = { ...med, frequency: e.target.value };
                        handleInputChange('currentMedications', newMeds);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Frecuencia"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newMeds = formData.currentMedications?.filter((_, i) => i !== index) || [];
                        handleInputChange('currentMedications', newMeds);
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newMeds = [...(formData.currentMedications || []), { name: '', dosage: '', frequency: '', indication: '' }];
                    handleInputChange('currentMedications', newMeds);
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  + Agregar Medicamento
                </button>
              </div>
            </div>

            {/* Alergias */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Alergias Medicamentosas</h4>
              <div className="space-y-3">
                {formData.allergies?.map((allergy, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={allergy.substance}
                      onChange={(e) => {
                        const newAllergies = [...(formData.allergies || [])];
                        newAllergies[index] = { ...allergy, substance: e.target.value };
                        handleInputChange('allergies', newAllergies);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Sustancia"
                    />
                    <input
                      type="text"
                      value={allergy.reaction}
                      onChange={(e) => {
                        const newAllergies = [...(formData.allergies || [])];
                        newAllergies[index] = { ...allergy, reaction: e.target.value };
                        handleInputChange('allergies', newAllergies);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tipo de reacción"
                    />
                    <div className="flex space-x-2">
                      <select
                        value={allergy.severity}
                        onChange={(e) => {
                          const newAllergies = [...(formData.allergies || [])];
                          newAllergies[index] = { ...allergy, severity: e.target.value as 'Leve' | 'Moderada' | 'Severa' };
                          handleInputChange('allergies', newAllergies);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Leve">Leve</option>
                        <option value="Moderada">Moderada</option>
                        <option value="Severa">Severa</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newAllergies = formData.allergies?.filter((_, i) => i !== index) || [];
                          handleInputChange('allergies', newAllergies);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newAllergies = [...(formData.allergies || []), { substance: '', reaction: '', severity: 'Leve' as const }];
                    handleInputChange('allergies', newAllergies);
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  + Agregar Alergia
                </button>
              </div>
            </div>

            {/* Cirugías Previas */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Cirugías Previas</h4>
              <div className="space-y-3">
                {formData.previousSurgeries?.map((surgery, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={surgery.type}
                      onChange={(e) => {
                        const newSurgeries = [...(formData.previousSurgeries || [])];
                        newSurgeries[index] = { ...surgery, type: e.target.value };
                        handleInputChange('previousSurgeries', newSurgeries);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tipo de cirugía"
                    />
                    <input
                      type="date"
                      value={surgery.date}
                      onChange={(e) => {
                        const newSurgeries = [...(formData.previousSurgeries || [])];
                        newSurgeries[index] = { ...surgery, date: e.target.value };
                        handleInputChange('previousSurgeries', newSurgeries);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={surgery.eye}
                      onChange={(e) => {
                        const newSurgeries = [...(formData.previousSurgeries || [])];
                        newSurgeries[index] = { ...surgery, eye: e.target.value as 'OD' | 'OI' | 'Ambos' | 'Sistémica' };
                        handleInputChange('previousSurgeries', newSurgeries);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="OD">Ojo Derecho</option>
                      <option value="OI">Ojo Izquierdo</option>
                      <option value="Ambos">Ambos Ojos</option>
                      <option value="Sistémica">Sistémica</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const newSurgeries = formData.previousSurgeries?.filter((_, i) => i !== index) || [];
                        handleInputChange('previousSurgeries', newSurgeries);
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newSurgeries = [...(formData.previousSurgeries || []), { type: '', date: '', eye: 'OD' as const, complications: '' }];
                    handleInputChange('previousSurgeries', newSurgeries);
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  + Agregar Cirugía
                </button>
              </div>
            </div>

            {/* Historia Familiar */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Historia Familiar</h4>
              <div className="space-y-3">
                {formData.familyHistory?.map((family, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={family.condition}
                      onChange={(e) => {
                        const newFamily = [...(formData.familyHistory || [])];
                        newFamily[index] = { ...family, condition: e.target.value };
                        handleInputChange('familyHistory', newFamily);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Condición familiar"
                    />
                    <input
                      type="text"
                      value={family.relation}
                      onChange={(e) => {
                        const newFamily = [...(formData.familyHistory || [])];
                        newFamily[index] = { ...family, relation: e.target.value };
                        handleInputChange('familyHistory', newFamily);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Parentesco"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={family.ageOfOnset || ''}
                        onChange={(e) => {
                          const newFamily = [...(formData.familyHistory || [])];
                          newFamily[index] = { ...family, ageOfOnset: parseInt(e.target.value) || undefined };
                          handleInputChange('familyHistory', newFamily);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Edad de inicio"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFamily = formData.familyHistory?.filter((_, i) => i !== index) || [];
                          handleInputChange('familyHistory', newFamily);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newFamily = [...(formData.familyHistory || []), { condition: '', relation: '', ageOfOnset: undefined }];
                    handleInputChange('familyHistory', newFamily);
                  }}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  + Agregar Antecedente Familiar
                </button>
              </div>
            </div>

            {/* Historia Social */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Historia Social</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tabaquismo
                  </label>
                  <select
                    value={formData.socialHistory?.smoking || 'Nunca'}
                    onChange={(e) => handleNestedInputChange(['socialHistory', 'smoking'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Nunca">Nunca</option>
                    <option value="Ex-fumador">Ex-fumador</option>
                    <option value="Fumador actual">Fumador actual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Consumo de alcohol
                  </label>
                  <select
                    value={formData.socialHistory?.alcohol || 'Nunca'}
                    onChange={(e) => handleNestedInputChange(['socialHistory', 'alcohol'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Nunca">Nunca</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Regular">Regular</option>
                    <option value="Excesivo">Excesivo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nota: Campos de queja principal movidos a sección "Motivo de Consulta" para evitar duplicación */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-amber-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Información clínica actual</p>
                  <p>La queja principal e historia de la enfermedad actual se capturan en la sección "Motivo de Consulta" para evitar duplicación de datos.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección Síntomas */}
        {activeSection === 'symptoms' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Síntomas Oftalmológicos</h3>
            
            {/* Características del síntoma principal */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Características del Síntoma Principal</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> La descripción del síntoma principal se captura en "Motivo de Consulta". 
                  Aquí especifica las características adicionales del síntoma.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Botones de acción - Optimizados para móvil */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          {/* Sugerencias - Solo desktop */}
          {dataQuality.suggestions.length > 0 && (
            <div className="hidden sm:block text-center text-sm text-slate-600 mb-4">
              <span className="font-medium">Sugerencias disponibles:</span> {dataQuality.suggestions.length}
            </div>
          )}
          
          {/* Mobile: Botones apilados */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-base sm:text-sm font-medium min-h-[48px] sm:min-h-[40px]"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors text-base sm:text-sm font-semibold min-h-[48px] sm:min-h-[40px]"
            >
              {isLoading ? 'Procesando...' : 'Iniciar Investigación'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
