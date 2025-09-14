// Tipos para análisis de imágenes médicas oftalmológicas

export interface ImageAnalysisResult {
  imageType: MedicalImageType;
  findings: ImageFindings;
  confidence: number;
  recommendations: string[];
  timestamp: string;
}

export type MedicalImageType = 
  | 'fundus'           // Fondo de ojo
  | 'oct'              // Tomografía de coherencia óptica
  | 'angiography'      // Angiografía (fluoresceína, ICG)
  | 'anterior_segment' // Segmento anterior
  | 'ultrasound'       // Ecografía ocular
  | 'visual_field'     // Campo visual
  | 'cornea'           // Topografía corneal
  | 'other';           // Otros tipos

export interface ImageFindings {
  // Hallazgos generales
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  artifacts: string[];
  laterality: 'OD' | 'OI' | 'both' | 'unknown';
  
  // Hallazgos específicos por tipo de imagen
  fundus?: FundusFindings;
  oct?: OCTFindings;
  angiography?: AngiographyFindings;
  anteriorSegment?: AnteriorSegmentFindings;
  ultrasound?: UltrasoundFindings;
  visualField?: VisualFieldFindings;
  cornea?: CorneaFindings;
}

// Hallazgos de fondo de ojo
export interface FundusFindings {
  opticNerve: {
    appearance: 'normal' | 'pale' | 'swollen' | 'cupped' | 'atrophic';
    cupDiscRatio: {
      OD: number | null;
      OI: number | null;
    };
    margins: 'sharp' | 'blurred' | 'irregular';
    color: 'normal' | 'pale' | 'hyperemic';
  };
  macula: {
    appearance: 'normal' | 'edematous' | 'atrophic' | 'scarred';
    fovealReflex: 'present' | 'absent' | 'irregular';
    drusen: 'none' | 'few' | 'many' | 'confluent';
    hemorrhages: 'none' | 'few' | 'many';
    exudates: 'none' | 'few' | 'many';
  };
  vessels: {
    arteries: {
      caliber: 'normal' | 'narrowed' | 'dilated';
      tortuosity: 'normal' | 'increased' | 'decreased';
      crossings: 'normal' | 'abnormal';
    };
    veins: {
      caliber: 'normal' | 'narrowed' | 'dilated';
      tortuosity: 'normal' | 'increased' | 'decreased';
    };
    occlusions: string[];
  };
  periphery: {
    tears: 'none' | 'present';
    detachments: 'none' | 'present';
    lattice: 'none' | 'present';
    pigment: 'normal' | 'increased' | 'decreased';
  };
  pathology: PathologyFinding[];
}

// Hallazgos de OCT
export interface OCTFindings {
  scanType: 'macular' | 'optic_nerve' | 'peripheral' | 'full_thickness';
  layers: {
    rpe: 'intact' | 'disrupted' | 'atrophic';
    ellipsoid: 'intact' | 'disrupted' | 'atrophic';
    outerNuclei: 'intact' | 'disrupted' | 'atrophic';
    innerNuclei: 'intact' | 'disrupted' | 'atrophic';
    ganglion: 'intact' | 'disrupted' | 'atrophic';
  };
  thickness: {
    central: number | null; // micrones
    average: number | null;
    minimum: number | null;
  };
  fluid: {
    intraretinal: 'none' | 'mild' | 'moderate' | 'severe';
    subretinal: 'none' | 'mild' | 'moderate' | 'severe';
    subRPE: 'none' | 'mild' | 'moderate' | 'severe';
  };
  pathology: PathologyFinding[];
}

// Hallazgos de angiografía
export interface AngiographyFindings {
  type: 'fluorescein' | 'icg' | 'oct_angiography';
  timing: {
    armToRetina: number | null; // segundos
    arteriovenous: number | null;
    venous: number | null;
    late: number | null;
  };
  leakage: {
    present: boolean;
    location: string[];
    severity: 'mild' | 'moderate' | 'severe';
  };
  blockage: {
    present: boolean;
    location: string[];
    type: 'filling_defect' | 'capillary_nonperfusion' | 'vessel_occlusion';
  };
  staining: {
    present: boolean;
    location: string[];
    pattern: 'diffuse' | 'focal' | 'linear';
  };
  pathology: PathologyFinding[];
}

// Hallazgos de segmento anterior
export interface AnteriorSegmentFindings {
  cornea: {
    clarity: 'clear' | 'hazy' | 'opaque';
    epithelium: 'intact' | 'defect' | 'edema';
    stroma: 'clear' | 'hazy' | 'scarred';
    endothelium: 'intact' | 'guttata' | 'decompensated';
  };
  anteriorChamber: {
    depth: 'normal' | 'shallow' | 'deep';
    cells: 'none' | 'few' | 'many';
    flare: 'none' | 'mild' | 'moderate' | 'severe';
  };
  iris: {
    color: 'normal' | 'heterochromia' | 'atrophic';
    structure: 'normal' | 'atrophic' | 'neovascular';
    rubeosis: 'none' | 'mild' | 'moderate' | 'severe';
  };
  pupil: {
    size: 'normal' | 'small' | 'large' | 'irregular';
    reactivity: 'normal' | 'sluggish' | 'nonreactive';
    shape: 'round' | 'irregular' | 'keyhole';
  };
  lens: {
    clarity: 'clear' | 'cataract' | 'opaque';
    position: 'normal' | 'subluxated' | 'dislocated';
    type: 'nuclear' | 'cortical' | 'posterior_subcapsular' | 'mixed';
  };
  pathology: PathologyFinding[];
}

// Hallazgos de ecografía
export interface UltrasoundFindings {
  scanType: 'a_scan' | 'b_scan' | 'doppler';
  vitreous: {
    clarity: 'clear' | 'hazy' | 'opaque';
    detachment: 'none' | 'partial' | 'complete';
    hemorrhage: 'none' | 'mild' | 'moderate' | 'severe';
  };
  retina: {
    attached: boolean;
    thickness: 'normal' | 'thickened' | 'thinned';
    detachment: 'none' | 'partial' | 'complete';
  };
  choroid: {
    thickness: 'normal' | 'thickened' | 'thinned';
    detachment: 'none' | 'partial' | 'complete';
  };
  orbit: {
    muscles: 'normal' | 'thickened' | 'atrophic';
    opticNerve: 'normal' | 'thickened' | 'atrophic';
    foreignBodies: 'none' | 'present';
  };
  pathology: PathologyFinding[];
}

// Hallazgos de campo visual
export interface VisualFieldFindings {
  testType: 'humphrey' | 'goldmann' | 'octopus' | 'other';
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
  meanDeviation: number | null; // dB
  patternStandardDeviation: number | null; // dB
  defects: {
    central: 'none' | 'mild' | 'moderate' | 'severe';
    peripheral: 'none' | 'mild' | 'moderate' | 'severe';
    arcuate: 'none' | 'present';
    nasal: 'none' | 'mild' | 'moderate' | 'severe';
  };
  blindSpot: {
    enlarged: boolean;
    shifted: boolean;
  };
  pathology: PathologyFinding[];
}

// Hallazgos de topografía corneal
export interface CorneaFindings {
  keratometry: {
    k1: number | null; // dioptrías
    k2: number | null;
    axis: number | null; // grados
  };
  pachymetry: {
    central: number | null; // micrones
    thinnest: number | null;
    location: string | null;
  };
  elevation: {
    anterior: 'normal' | 'elevated' | 'depressed';
    posterior: 'normal' | 'elevated' | 'depressed';
  };
  regularity: {
    surface: 'regular' | 'irregular';
    astigmatism: 'with_the_rule' | 'against_the_rule' | 'oblique';
  };
  pathology: PathologyFinding[];
}

// Hallazgo patológico individual
export interface PathologyFinding {
  type: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  confidence: number; // 0-1
  differential: string[];
}

// Resultado de análisis de imagen
export interface MedicalImageAnalysis {
  id: string;
  imageType: MedicalImageType;
  findings: ImageFindings;
  analysis: ImageAnalysisResult;
  recommendations: string[];
  confidence: number;
  timestamp: string;
  imageUrl?: string;
}

// Configuración para análisis de imágenes
export interface ImageAnalysisConfig {
  imageType: MedicalImageType;
  priority: 'urgent' | 'routine' | 'follow_up';
  includeDifferential: boolean;
  includeRecommendations: boolean;
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
}
