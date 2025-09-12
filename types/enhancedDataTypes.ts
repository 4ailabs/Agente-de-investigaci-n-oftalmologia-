// Enhanced data types for improved medical data collection

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  indication?: string;
}

export interface Allergy {
  substance: string;
  reaction: string;
  severity: 'Leve' | 'Moderada' | 'Severa';
}

export interface Surgery {
  type: string;
  date: string;
  eye: 'OD' | 'OI' | 'Ambos' | 'Sistémica';
  complications?: string;
}

export interface FamilyHistory {
  condition: string;
  relation: string;
  ageOfOnset?: number;
}

export interface PainSymptom {
  present: boolean;
  location: 'Periorbitario' | 'Retrobulbar' | 'Frontal' | 'Temporal' | 'Otros';
  type: 'Punzante' | 'Sordo' | 'Ardiente' | 'Pulsátil' | 'Otros';
  intensity: number; // 1-10
  triggers?: string[];
}

export interface DischargeSymptom {
  present: boolean;
  type: 'Acuosa' | 'Mucosa' | 'Purulenta' | 'Sangre';
  color: 'Clara' | 'Amarilla' | 'Verde' | 'Roja' | 'Otros';
  consistency: 'Líquida' | 'Espesa' | 'Crustosa';
  amount: 'Leve' | 'Moderada' | 'Abundante';
}

export interface VisualSymptom {
  blur: {
    present: boolean;
    type: 'Gradual' | 'Súbita' | 'Intermittente';
    laterality: 'OD' | 'OI' | 'Ambos';
    distance: 'Lejana' | 'Cercana' | 'Ambas';
  };
  distortion: boolean;
  colorVision: 'Normal' | 'Alterada' | 'No evaluada';
  nightVision: 'Normal' | 'Dificultad' | 'No evaluada';
}

export interface PupilExam {
  size: {
    OD: 'Normal' | 'Miótica' | 'Midriática';
    OI: 'Normal' | 'Miótica' | 'Midriática';
  };
  reaction: {
    light: 'Normal' | 'Lenta' | 'Ausente';
    accommodation: 'Normal' | 'Lenta' | 'Ausente';
  };
  shape: 'Redonda' | 'Irregular' | 'Ovalada';
  anisocoria: boolean;
}

export interface AnteriorSegmentExam {
  conjunctiva: {
    injection: 'Normal' | 'Leve' | 'Moderada' | 'Severa';
    chemosis: boolean;
    follicles: boolean;
    papillae: boolean;
  };
  cornea: {
    clarity: 'Clara' | 'Edema' | 'Opacidad' | 'Ulcera';
    staining: 'Negativo' | 'Puntate' | 'Difuso' | 'Ulcera';
    thickness: 'Normal' | 'Aumentada' | 'Disminuida';
  };
  anteriorChamber: {
    depth: 'Normal' | 'Shallow' | 'Profunda';
    cells: '0' | '1+' | '2+' | '3+' | '4+';
    flare: '0' | '1+' | '2+' | '3+' | '4+';
  };
  iris: {
    color: string;
    pattern: 'Normal' | 'Atrofia' | 'Neovascularización';
    synechiae: 'Ninguna' | 'Anterior' | 'Posterior' | 'Ambas';
  };
  lens: {
    clarity: 'Clara' | 'Catarata' | 'Subluxación' | 'Afaquia';
    type: 'Nuclear' | 'Cortical' | 'Subcapsular' | 'Mixta';
  };
}

export interface FundusExam {
  opticNerve: {
    cupDiscRatio: {
      OD: string;
      OI: string;
    };
    pallor: 'Normal' | 'Leve' | 'Moderada' | 'Severa';
    swelling: boolean;
    hemorrhage: boolean;
  };
  macula: {
    center: 'Normal' | 'Edema' | 'Atrofia' | 'Agujero';
    periphery: 'Normal' | 'Alterada';
    drusen: boolean;
  };
  vessels: {
    arteries: 'Normal' | 'Aterosclerosis' | 'Oclusión';
    veins: 'Normal' | 'Tortuosas' | 'Oclusión';
    hemorrhages: 'Ninguna' | 'Retinales' | 'Vitreales';
  };
  periphery: 'Normal' | 'Desgarros' | 'Desprendimiento' | 'Degeneración';
}

export interface VisualFieldExam {
  method: 'Confrontación' | 'Amsler' | 'Campimetría' | 'No evaluado';
  defects: {
    OD: string[];
    OI: string[];
  };
  reliability: 'Buena' | 'Regular' | 'Mala' | 'No evaluada';
}

export interface EnhancedPatientData {
  // Demográficos básicos
  age: number;
  sex: 'M' | 'F' | 'Otros';
  occupation?: string;
  location?: string;
  
  // Antecedentes médicos
  systemicDiseases: string[];
  currentMedications: Medication[];
  allergies: Allergy[];
  previousSurgeries: Surgery[];
  familyHistory: FamilyHistory[];
  
  // Síntomas oftalmológicos
  symptoms: OphthalmologySymptoms;
  
  // Examen oftalmológico
  exam: OphthalmologyExam;
  
  // Información clínica consolidada (elimina duplicación)
  clinicalInfo: {
    chiefComplaint: string;              // Queja principal breve
    historyOfPresentIllness: string;     // Historia detallada actual
    reviewOfSystems: string[];           // Revisión por sistemas
  };
  
  socialHistory: {
    smoking: 'Nunca' | 'Ex-fumador' | 'Fumador actual';
    alcohol: 'Nunca' | 'Ocasional' | 'Regular' | 'Excesivo';
    drugs: string[];
  };
}

export interface OphthalmologySymptoms {
  mainSymptom: {
    description: string;
    duration: string;
    laterality: 'OD' | 'OI' | 'Ambos';
    severity: number; // 1-10
    pattern: 'Agudo' | 'Subagudo' | 'Crónico' | 'Recurrente';
  };
  
  associatedSymptoms: {
    pain: PainSymptom;
    photophobia: boolean;
    tearing: 'Normal' | 'Excesivo' | 'Disminuido';
    discharge: DischargeSymptom;
    visualDisturbance: VisualSymptom;
    photopsias: boolean;
    scotomas: boolean;
    diplopia: 'Monocular' | 'Binocular' | 'Ninguna';
  };
}

export interface OphthalmologyExam {
  visualAcuity: {
    OD: string;
    OI: string;
    withCorrection: boolean;
    pinhole: string;
  };
  intraocularPressure: {
    OD: number;
    OI: number;
    method: 'Goldmann' | 'Tonopen' | 'iCare' | 'No medido';
  };
  pupilResponse: PupilExam;
  anteriorSegment: AnteriorSegmentExam;
  fundus: FundusExam;
  visualFields: VisualFieldExam;
  additionalNotes?: string;
}

// Red flags for urgent conditions
export interface RedFlags {
  acuteVisionLoss: boolean;
  severePain: boolean;
  trauma: boolean;
  flashes: boolean;
  floaters: boolean;
  diplopia: boolean;
  headache: boolean;
  nausea: boolean;
  vomiting: boolean;
  fever: boolean;
  rash: boolean;
  other: string[];
}

// Data quality indicators
export interface DataQuality {
  completeness: number; // 0-100
  consistency: number; // 0-100
  medicalValidity: number; // 0-100
  missingFields: string[];
  inconsistencies: string[];
  suggestions: string[];
}
