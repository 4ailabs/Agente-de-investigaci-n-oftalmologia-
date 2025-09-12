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
            { id: 'demographics', label: 'Demográficos', icon: '' },
            { id: 'symptoms', label: 'Síntomas', icon: '' },
            { id: 'exam', label: 'Examen', icon: '' },
            { id: 'history', label: 'Antecedentes', icon: '' }
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

        {/* Sección Examen Oftalmológico */}
        {activeSection === 'exam' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Examen Oftalmológico</h3>
            
            {/* Agudeza Visual */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Agudeza Visual</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ojo Derecho (OD)
                  </label>
                  <input
                    type="text"
                    value={formData.exam?.visualAcuity?.OD || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'OD'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 20/20, 20/40, CF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ojo Izquierdo (OI)
                  </label>
                  <input
                    type="text"
                    value={formData.exam?.visualAcuity?.OI || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'OI'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 20/20, 20/40, CF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pinhole
                  </label>
                  <input
                    type="text"
                    value={formData.exam?.visualAcuity?.pinhole || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'pinhole'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mejora con pinhole"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="withCorrection"
                    checked={formData.exam?.visualAcuity?.withCorrection || false}
                    onChange={(e) => handleNestedInputChange(['exam', 'visualAcuity', 'withCorrection'], e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="withCorrection" className="ml-2 text-sm text-slate-700">
                    Con corrección
                  </label>
                </div>
              </div>
            </div>

            {/* Presión Intraocular */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Presión Intraocular</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    OD (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.exam?.intraocularPressure?.OD || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'OD'], parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    OI (mmHg)
                  </label>
                  <input
                    type="number"
                    value={formData.exam?.intraocularPressure?.OI || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'OI'], parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Método
                  </label>
                  <select
                    value={formData.exam?.intraocularPressure?.method || 'No medido'}
                    onChange={(e) => handleNestedInputChange(['exam', 'intraocularPressure', 'method'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="No medido">No medido</option>
                    <option value="Goldmann">Goldmann</option>
                    <option value="Tonopen">Tonopen</option>
                    <option value="iCare">iCare</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Examen de Pupila */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Examen de Pupila</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tamaño OD
                  </label>
                  <select
                    value={formData.exam?.pupilResponse?.size?.OD || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'size', 'OD'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Miótica">Miótica</option>
                    <option value="Midriática">Midriática</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tamaño OI
                  </label>
                  <select
                    value={formData.exam?.pupilResponse?.size?.OI || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'pupilResponse', 'size', 'OI'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Miótica">Miótica</option>
                    <option value="Midriática">Midriática</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reacción a la luz
                  </label>
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
                <div className="flex items-center">
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

            {/* Segmento Anterior */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Segmento Anterior</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Inyección conjuntival
                  </label>
                  <select
                    value={formData.exam?.anteriorSegment?.conjunctiva?.injection || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'conjunctiva', 'injection'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Leve">Leve</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Severa">Severa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Claridad corneal
                  </label>
                  <select
                    value={formData.exam?.anteriorSegment?.cornea?.clarity || 'Clara'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'cornea', 'clarity'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Clara">Clara</option>
                    <option value="Edema">Edema</option>
                    <option value="Opacidad">Opacidad</option>
                    <option value="Ulcera">Úlcera</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Profundidad de cámara anterior
                  </label>
                  <select
                    value={formData.exam?.anteriorSegment?.anteriorChamber?.depth || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'anteriorChamber', 'depth'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Shallow">Shallow</option>
                    <option value="Profunda">Profunda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Claridad del cristalino
                  </label>
                  <select
                    value={formData.exam?.anteriorSegment?.lens?.clarity || 'Clara'}
                    onChange={(e) => handleNestedInputChange(['exam', 'anteriorSegment', 'lens', 'clarity'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Clara">Clara</option>
                    <option value="Catarata">Catarata</option>
                    <option value="Subluxación">Subluxación</option>
                    <option value="Afaquia">Afaquia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fondo de Ojo */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-slate-700 mb-3">Fondo de Ojo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Relación copa/disco OD
                  </label>
                  <input
                    type="text"
                    value={formData.exam?.fundus?.opticNerve?.cupDiscRatio?.OD || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'opticNerve', 'cupDiscRatio', 'OD'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 0.3, 0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Relación copa/disco OI
                  </label>
                  <input
                    type="text"
                    value={formData.exam?.fundus?.opticNerve?.cupDiscRatio?.OI || ''}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'opticNerve', 'cupDiscRatio', 'OI'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 0.3, 0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Palidez del nervio óptico
                  </label>
                  <select
                    value={formData.exam?.fundus?.opticNerve?.pallor || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'opticNerve', 'pallor'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Leve">Leve</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Severa">Severa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado de la mácula
                  </label>
                  <select
                    value={formData.exam?.fundus?.macula?.center || 'Normal'}
                    onChange={(e) => handleNestedInputChange(['exam', 'fundus', 'macula', 'center'], e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Campos de texto libre */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Queja Principal
                </label>
                <textarea
                  value={formData.chiefComplaint || ''}
                  onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descripción de la queja principal del paciente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Historia de la Enfermedad Actual
                </label>
                <textarea
                  value={formData.historyOfPresentIllness || ''}
                  onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Descripción detallada de la evolución de la enfermedad actual..."
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
