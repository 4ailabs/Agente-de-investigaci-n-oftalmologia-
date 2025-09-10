// Ophthalmology Knowledge Graph
// Contiene conocimiento estructurado del dominio oftalmológico

export interface OphthalmicCondition {
  name: string;
  category: OphthalmicCategory;
  icd10: string;
  prevalence: PrevalenceData;
  pathophysiology: PathophysiologyData;
  clinicalPresentation: ClinicalPresentation;
  diagnosticCriteria: DiagnosticCriteria;
  differentialDiagnosis: string[];
  investigations: Investigation[];
  management: ManagementPlan;
  prognosis: PrognosisData;
  complications: ComplicationData[];
  emergencyFeatures: EmergencyFeature[];
}

export interface PrevalenceData {
  overall: number;
  ageGroups: { range: string; prevalence: number }[];
  riskFactors: RiskFactor[];
  demographicFactors: { factor: string; multiplier: number }[];
}

export interface RiskFactor {
  factor: string;
  relativeRisk: number;
  evidence: 'strong' | 'moderate' | 'weak';
}

export interface PathophysiologyData {
  primaryMechanism: string;
  anatomicalSite: AnatomicalSite[];
  molecularBasis: string;
  progressionPattern: 'acute' | 'chronic' | 'episodic';
  timeframe: string;
}

export interface ClinicalPresentation {
  commonSymptoms: Symptom[];
  commonSigns: Sign[];
  rareButSpecific: Symptom[];
  ageDependentVariations: { ageRange: string; variations: string[] }[];
}

export interface Symptom {
  symptom: string;
  frequency: number; // 0-1
  severity: 'mild' | 'moderate' | 'severe';
  timing: 'acute' | 'gradual' | 'progressive';
  quality: string;
}

export interface Sign {
  sign: string;
  frequency: number;
  sensitivity: number;
  specificity: number;
  examination: 'external' | 'slit-lamp' | 'fundoscopy' | 'tonometry' | 'visual-field';
}

export interface DiagnosticCriteria {
  goldStandard: string;
  supportiveTests: string[];
  clinicalCriteria: string[];
  imagingFindings: string[];
}

export interface Investigation {
  test: string;
  indication: string;
  sensitivity: number;
  specificity: number;
  cost: 'low' | 'moderate' | 'high';
  availability: 'primary' | 'secondary' | 'tertiary';
  urgency: 'routine' | 'urgent' | 'immediate';
}

export interface ManagementPlan {
  firstLine: Treatment[];
  secondLine: Treatment[];
  surgical: Treatment[];
  followUp: FollowUpPlan;
  lifestyle: string[];
}

export interface Treatment {
  treatment: string;
  mechanism: string;
  efficacy: number;
  sideEffects: string[];
  contraindications: string[];
  monitoring: string[];
}

export interface FollowUpPlan {
  frequency: string;
  parameters: string[];
  triggers: string[];
}

export interface PrognosisData {
  naturalHistory: string;
  withTreatment: string;
  factorsAffectingPrognosis: string[];
  visualOutcome: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ComplicationData {
  complication: string;
  incidence: number;
  severity: 'mild' | 'moderate' | 'severe';
  management: string;
}

export interface EmergencyFeature {
  feature: string;
  timeframe: string;
  action: string;
  consequence: string;
}

export enum OphthalmicCategory {
  RETINAL = 'retinal',
  GLAUCOMA = 'glaucoma', 
  CATARACT = 'cataract',
  CORNEAL = 'corneal',
  UVEITIS = 'uveitis',
  NEURO = 'neuro-ophthalmology',
  EXTERNAL = 'external',
  PEDIATRIC = 'pediatric'
}

export enum AnatomicalSite {
  CORNEA = 'cornea',
  IRIS = 'iris',
  LENS = 'lens',
  VITREOUS = 'vitreous',
  RETINA = 'retina',
  MACULA = 'macula',
  OPTIC_NERVE = 'optic-nerve',
  EXTRAOCULAR_MUSCLES = 'extraocular-muscles'
}

export class OphthalmologyKnowledgeGraph {
  private static conditions: Map<string, OphthalmicCondition> = new Map();

  static {
    this.initializeKnowledgeBase();
  }

  private static initializeKnowledgeBase() {
    // DEGENERACIÓN MACULAR ASOCIADA A LA EDAD (DMAE)
    this.conditions.set('dmae', {
      name: 'Degeneración Macular Asociada a la Edad',
      category: OphthalmicCategory.RETINAL,
      icd10: 'H35.30',
      prevalence: {
        overall: 0.048,
        ageGroups: [
          { range: '50-59', prevalence: 0.002 },
          { range: '60-69', prevalence: 0.023 },
          { range: '70-79', prevalence: 0.114 },
          { range: '80+', prevalence: 0.304 }
        ],
        riskFactors: [
          { factor: 'Smoking', relativeRisk: 2.4, evidence: 'strong' },
          { factor: 'Family history', relativeRisk: 2.9, evidence: 'strong' },
          { factor: 'Hypertension', relativeRisk: 1.4, evidence: 'moderate' },
          { factor: 'Obesity', relativeRisk: 1.3, evidence: 'moderate' }
        ],
        demographicFactors: [
          { factor: 'European ancestry', multiplier: 1.5 },
          { factor: 'Female sex', multiplier: 1.2 }
        ]
      },
      pathophysiology: {
        primaryMechanism: 'Accumulation of drusen and RPE dysfunction leading to photoreceptor degeneration',
        anatomicalSite: [AnatomicalSite.MACULA, AnatomicalSite.RETINA],
        molecularBasis: 'Complement system dysregulation, oxidative stress, and lipofuscin accumulation',
        progressionPattern: 'chronic',
        timeframe: 'Years to decades'
      },
      clinicalPresentation: {
        commonSymptoms: [
          { symptom: 'Central visual blurring', frequency: 0.85, severity: 'moderate', timing: 'gradual', quality: 'Progressive loss of central detail vision' },
          { symptom: 'Metamorphopsia', frequency: 0.65, severity: 'moderate', timing: 'gradual', quality: 'Straight lines appear wavy or distorted' },
          { symptom: 'Central scotoma', frequency: 0.55, severity: 'severe', timing: 'progressive', quality: 'Dark or blind spot in central vision' },
          { symptom: 'Difficulty reading', frequency: 0.78, severity: 'moderate', timing: 'gradual', quality: 'Letters appear missing or distorted' }
        ],
        commonSigns: [
          { sign: 'Drusen deposits', frequency: 0.95, sensitivity: 0.95, specificity: 0.60, examination: 'fundoscopy' },
          { sign: 'RPE changes', frequency: 0.80, sensitivity: 0.80, specificity: 0.70, examination: 'fundoscopy' },
          { sign: 'Geographic atrophy', frequency: 0.35, sensitivity: 0.90, specificity: 0.95, examination: 'fundoscopy' },
          { sign: 'Subretinal fluid', frequency: 0.25, sensitivity: 0.85, specificity: 0.90, examination: 'slit-lamp' }
        ],
        rareButSpecific: [
          { symptom: 'Sudden visual loss', frequency: 0.10, severity: 'severe', timing: 'acute', quality: 'Suggests wet AMD conversion' }
        ],
        ageDependentVariations: [
          { ageRange: '50-65', variations: ['Often asymptomatic', 'Mild central blur'] },
          { ageRange: '65-80', variations: ['Progressive central loss', 'Metamorphopsia prominent'] },
          { ageRange: '80+', variations: ['Advanced disease', 'Significant functional impairment'] }
        ]
      },
      diagnosticCriteria: {
        goldStandard: 'OCT macula showing drusen, RPE changes, or CNV',
        supportiveTests: ['Fluorescein angiography', 'OCT-A', 'Fundus autofluorescence'],
        clinicalCriteria: ['Age >50', 'Central visual symptoms', 'Macular drusen on fundoscopy'],
        imagingFindings: ['Drusen >63μm', 'RPE pigmentary changes', 'Geographic atrophy', 'CNV complex']
      },
      differentialDiagnosis: [
        'Diabetic macular edema',
        'Central serous chorioretinopathy',
        'Macular hole',
        'Epiretinal membrane',
        'Pattern dystrophy'
      ],
      investigations: [
        { test: 'OCT macula', indication: 'Diagnosis and monitoring', sensitivity: 0.95, specificity: 0.90, cost: 'moderate', availability: 'secondary', urgency: 'routine' },
        { test: 'Fluorescein angiography', indication: 'Wet AMD detection', sensitivity: 0.90, specificity: 0.85, cost: 'high', availability: 'secondary', urgency: 'urgent' },
        { test: 'Amsler grid', indication: 'Home monitoring', sensitivity: 0.45, specificity: 0.85, cost: 'low', availability: 'primary', urgency: 'routine' }
      ],
      management: {
        firstLine: [
          { treatment: 'Anti-VEGF injections', mechanism: 'Vascular endothelial growth factor inhibition', efficacy: 0.70, sideEffects: ['Endophthalmitis', 'Retinal detachment'], contraindications: ['Active infection', 'Hypersensitivity'], monitoring: ['Visual acuity', 'OCT', 'IOP'] }
        ],
        secondLine: [
          { treatment: 'Photodynamic therapy', mechanism: 'Selective vascular closure', efficacy: 0.40, sideEffects: ['Photosensitivity', 'Visual loss'], contraindications: ['Porphyria'], monitoring: ['Visual field', 'Fundoscopy'] }
        ],
        surgical: [
          { treatment: 'Macular translocation', mechanism: 'Surgical repositioning of fovea', efficacy: 0.30, sideEffects: ['Diplopia', 'Retinal detachment'], contraindications: ['Advanced disease'], monitoring: ['Visual acuity', 'Fundoscopy'] }
        ],
        followUp: {
          frequency: 'Every 4-8 weeks for active treatment',
          parameters: ['Visual acuity', 'OCT findings', 'New symptoms'],
          triggers: ['New metamorphopsia', 'Sudden vision loss', 'OCT changes']
        },
        lifestyle: ['Smoking cessation', 'Antioxidant supplementation (AREDS)', 'UV protection', 'Regular monitoring']
      },
      prognosis: {
        naturalHistory: 'Progressive central vision loss over years',
        withTreatment: 'Stabilization or improvement in 60-70% of wet AMD',
        factorsAffectingPrognosis: ['Age at onset', 'Lesion size', 'Treatment response', 'Bilateral disease'],
        visualOutcome: 'fair'
      },
      complications: [
        { complication: 'Legal blindness', incidence: 0.15, severity: 'severe', management: 'Low vision aids and rehabilitation' },
        { complication: 'Geographic atrophy expansion', incidence: 0.25, severity: 'moderate', management: 'Monitoring and potential future therapies' }
      ],
      emergencyFeatures: [
        { feature: 'Sudden central vision loss', timeframe: 'Within hours to days', action: 'Urgent ophthalmology referral', consequence: 'Possible wet AMD requiring immediate treatment' }
      ]
    });

    // GLAUCOMA PRIMARIO DE ÁNGULO ABIERTO
    this.conditions.set('glaucoma', {
      name: 'Glaucoma Primario de Ángulo Abierto',
      category: OphthalmicCategory.GLAUCOMA,
      icd10: 'H40.10',
      prevalence: {
        overall: 0.02,
        ageGroups: [
          { range: '40-49', prevalence: 0.005 },
          { range: '50-59', prevalence: 0.015 },
          { range: '60-69', prevalence: 0.032 },
          { range: '70+', prevalence: 0.065 }
        ],
        riskFactors: [
          { factor: 'Elevated IOP', relativeRisk: 4.2, evidence: 'strong' },
          { factor: 'African ancestry', relativeRisk: 4.0, evidence: 'strong' },
          { factor: 'Family history', relativeRisk: 2.1, evidence: 'strong' },
          { factor: 'Myopia', relativeRisk: 1.6, evidence: 'moderate' }
        ],
        demographicFactors: [
          { factor: 'African descent', multiplier: 4.0 },
          { factor: 'Hispanic ethnicity', multiplier: 1.8 }
        ]
      },
      pathophysiology: {
        primaryMechanism: 'Progressive optic nerve damage due to elevated intraocular pressure',
        anatomicalSite: [AnatomicalSite.OPTIC_NERVE, AnatomicalSite.RETINA],
        molecularBasis: 'Retinal ganglion cell apoptosis and axonal degeneration',
        progressionPattern: 'chronic',
        timeframe: 'Years to decades'
      },
      clinicalPresentation: {
        commonSymptoms: [
          { symptom: 'Peripheral vision loss', frequency: 0.70, severity: 'moderate', timing: 'gradual', quality: 'Insidious onset, often unnoticed initially' },
          { symptom: 'Tunnel vision', frequency: 0.35, severity: 'severe', timing: 'progressive', quality: 'Advanced disease manifestation' },
          { symptom: 'Halos around lights', frequency: 0.25, severity: 'mild', timing: 'progressive', quality: 'Associated with pressure elevation' }
        ],
        commonSigns: [
          { sign: 'Optic disc cupping', frequency: 0.90, sensitivity: 0.85, specificity: 0.80, examination: 'fundoscopy' },
          { sign: 'RNFL thinning', frequency: 0.85, sensitivity: 0.90, specificity: 0.85, examination: 'fundoscopy' },
          { sign: 'Elevated IOP', frequency: 0.60, sensitivity: 0.60, specificity: 0.70, examination: 'tonometry' }
        ],
        rareButSpecific: [
          { symptom: 'Acute angle closure symptoms', frequency: 0.05, severity: 'severe', timing: 'acute', quality: 'Pain, nausea, halos - different entity' }
        ],
        ageDependentVariations: [
          { ageRange: '40-60', variations: ['Often asymptomatic', 'Elevated IOP finding'] },
          { ageRange: '60-80', variations: ['Subtle visual field defects', 'Progressive disc changes'] },
          { ageRange: '80+', variations: ['Advanced field loss', 'Functional impairment'] }
        ]
      },
      diagnosticCriteria: {
        goldStandard: 'Visual field defects consistent with glaucomatous optic neuropathy',
        supportiveTests: ['OCT optic nerve', 'Gonioscopy', 'Pachymetry'],
        clinicalCriteria: ['Optic disc abnormalities', 'Visual field defects', 'IOP consideration'],
        imagingFindings: ['Cup-to-disc ratio >0.6', 'RNFL thinning', 'Ganglion cell layer loss']
      },
      differentialDiagnosis: [
        'Normal tension glaucoma',
        'Secondary glaucoma',
        'Optic neuritis',
        'Ischemic optic neuropathy',
        'Compressive optic neuropathy'
      ],
      investigations: [
        { test: 'Visual fields (24-2)', indication: 'Functional assessment', sensitivity: 0.85, specificity: 0.90, cost: 'moderate', availability: 'secondary', urgency: 'routine' },
        { test: 'OCT optic nerve', indication: 'Structural assessment', sensitivity: 0.90, specificity: 0.85, cost: 'moderate', availability: 'secondary', urgency: 'routine' },
        { test: 'Gonioscopy', indication: 'Angle assessment', sensitivity: 0.95, specificity: 0.95, cost: 'low', availability: 'secondary', urgency: 'routine' }
      ],
      management: {
        firstLine: [
          { treatment: 'Topical beta-blockers', mechanism: 'Decreased aqueous production', efficacy: 0.70, sideEffects: ['Bradycardia', 'Bronchospasm'], contraindications: ['COPD', 'Heart block'], monitoring: ['IOP', 'Pulse', 'Visual fields'] },
          { treatment: 'Prostaglandin analogues', mechanism: 'Increased aqueous outflow', efficacy: 0.75, sideEffects: ['Iris darkening', 'Lash growth'], contraindications: ['Pregnancy', 'Active uveitis'], monitoring: ['IOP', 'Fundoscopy'] }
        ],
        secondLine: [
          { treatment: 'Carbonic anhydrase inhibitors', mechanism: 'Decreased aqueous production', efficacy: 0.65, sideEffects: ['Metabolic acidosis', 'Kidney stones'], contraindications: ['Sulfa allergy'], monitoring: ['IOP', 'Electrolytes'] }
        ],
        surgical: [
          { treatment: 'Trabeculectomy', mechanism: 'Create drainage pathway', efficacy: 0.80, sideEffects: ['Bleb leak', 'Hypotony'], contraindications: ['Active conjunctivitis'], monitoring: ['IOP', 'Bleb morphology'] }
        ],
        followUp: {
          frequency: 'Every 3-6 months depending on stability',
          parameters: ['IOP', 'Visual fields', 'Optic disc assessment'],
          triggers: ['IOP elevation', 'Field progression', 'New symptoms']
        },
        lifestyle: ['Regular exercise', 'Medication compliance', 'Regular monitoring']
      },
      prognosis: {
        naturalHistory: 'Progressive visual field loss leading to blindness',
        withTreatment: 'Stable in 80-90% with adequate IOP control',
        factorsAffectingPrognosis: ['Age at diagnosis', 'IOP control', 'Baseline damage', 'Compliance'],
        visualOutcome: 'good'
      },
      complications: [
        { complication: 'Blindness', incidence: 0.10, severity: 'severe', management: 'Mobility training and adaptive aids' },
        { complication: 'Medication side effects', incidence: 0.30, severity: 'mild', management: 'Alternative therapies or surgery' }
      ],
      emergencyFeatures: [
        { feature: 'Acute angle closure symptoms', timeframe: 'Hours', action: 'Immediate ophthalmology evaluation', consequence: 'Permanent vision loss if untreated' }
      ]
    });

    // Add more conditions as needed...
  }

  // MÉTODOS DE CONSULTA
  static getCondition(key: string): OphthalmicCondition | null {
    return this.conditions.get(key.toLowerCase()) || null;
  }

  static searchConditions(query: string): OphthalmicCondition[] {
    const results: OphthalmicCondition[] = [];
    const lowerQuery = query.toLowerCase();

    this.conditions.forEach((condition) => {
      if (
        condition.name.toLowerCase().includes(lowerQuery) ||
        condition.clinicalPresentation.commonSymptoms.some(s => 
          s.symptom.toLowerCase().includes(lowerQuery)
        ) ||
        condition.differentialDiagnosis.some(d => 
          d.toLowerCase().includes(lowerQuery)
        )
      ) {
        results.push(condition);
      }
    });

    return results;
  }

  static getConditionsByCategory(category: OphthalmicCategory): OphthalmicCondition[] {
    const results: OphthalmicCondition[] = [];
    this.conditions.forEach((condition) => {
      if (condition.category === category) {
        results.push(condition);
      }
    });
    return results;
  }

  static calculatePrevalence(conditionKey: string, age: number, riskFactors: string[]): number {
    const condition = this.getCondition(conditionKey);
    if (!condition) return 0;

    let prevalence = condition.prevalence.overall;

    // Adjust for age
    const ageGroup = condition.prevalence.ageGroups.find(group => {
      const [min, max] = group.range.includes('+') 
        ? [parseInt(group.range), 200] 
        : group.range.split('-').map(Number);
      return age >= min && age <= max;
    });

    if (ageGroup) {
      prevalence = ageGroup.prevalence;
    }

    // Adjust for risk factors
    riskFactors.forEach(factor => {
      const riskFactor = condition.prevalence.riskFactors.find(rf => 
        rf.factor.toLowerCase().includes(factor.toLowerCase())
      );
      if (riskFactor) {
        prevalence *= riskFactor.relativeRisk;
      }
    });

    return Math.min(prevalence, 0.95); // Cap at 95%
  }

  static getDifferentialDiagnosis(symptoms: string[], age: number): OphthalmicCondition[] {
    const candidates: Array<{ condition: OphthalmicCondition; score: number }> = [];

    this.conditions.forEach((condition) => {
      let score = 0;

      // Score based on symptom match
      symptoms.forEach(symptom => {
        const matchingSymptom = condition.clinicalPresentation.commonSymptoms.find(s =>
          s.symptom.toLowerCase().includes(symptom.toLowerCase()) ||
          symptom.toLowerCase().includes(s.symptom.toLowerCase())
        );
        if (matchingSymptom) {
          score += matchingSymptom.frequency * 100;
        }
      });

      // Age appropriateness
      const ageGroup = condition.prevalence.ageGroups.find(group => {
        const [min, max] = group.range.includes('+') 
          ? [parseInt(group.range), 200] 
          : group.range.split('-').map(Number);
        return age >= min && age <= max;
      });

      if (ageGroup) {
        score += ageGroup.prevalence * 50;
      }

      if (score > 10) { // Threshold for inclusion
        candidates.push({ condition, score });
      }
    });

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => c.condition);
  }

  static getEmergencyFeatures(conditionKey: string): EmergencyFeature[] {
    const condition = this.getCondition(conditionKey);
    return condition?.emergencyFeatures || [];
  }

  static getManagementRecommendations(conditionKey: string): ManagementPlan | null {
    const condition = this.getCondition(conditionKey);
    return condition?.management || null;
  }

  // UTILIDADES PARA INTEGRACIÓN CON SISTEMA EXISTENTE
  static formatKnowledgeForPrompt(conditionKey: string): string {
    const condition = this.getCondition(conditionKey);
    if (!condition) return '';

    let prompt = `### CONOCIMIENTO ESPECIALIZADO: ${condition.name} ###\n\n`;
    
    prompt += `**Prevalencia:** ${(condition.prevalence.overall * 100).toFixed(1)}% población general\n`;
    prompt += `**Factores de Riesgo Principales:**\n`;
    condition.prevalence.riskFactors.slice(0, 3).forEach(rf => {
      prompt += `- ${rf.factor}: RR ${rf.relativeRisk} (evidencia ${rf.evidence})\n`;
    });
    
    prompt += `\n**Presentación Clínica Típica:**\n`;
    condition.clinicalPresentation.commonSymptoms.slice(0, 3).forEach(symptom => {
      prompt += `- ${symptom.symptom}: ${(symptom.frequency * 100).toFixed(0)}% frecuencia\n`;
    });

    prompt += `\n**Diagnóstico Gold Standard:** ${condition.diagnosticCriteria.goldStandard}\n`;
    
    prompt += `\n**Manejo Primera Línea:**\n`;
    condition.management.firstLine.forEach(treatment => {
      prompt += `- ${treatment.treatment}: ${(treatment.efficacy * 100).toFixed(0)}% eficacia\n`;
    });

    if (condition.emergencyFeatures.length > 0) {
      prompt += `\n**🚨 CARACTERÍSTICAS DE EMERGENCIA:**\n`;
      condition.emergencyFeatures.forEach(feature => {
        prompt += `- ${feature.feature}: ${feature.action}\n`;
      });
    }

    return prompt;
  }

  static extractRelevantKnowledge(symptoms: string[], suspectedDiagnoses: string[]): string {
    let knowledge = `### KNOWLEDGE GRAPH OFTALMOLÓGICO ###\n\n`;
    
    // Get differential diagnoses
    const differentials = this.getDifferentialDiagnosis(symptoms, 65); // Assume middle age
    
    knowledge += `**DIAGNÓSTICOS DIFERENCIALES RELEVANTES:**\n`;
    differentials.slice(0, 3).forEach((condition, index) => {
      knowledge += `${index + 1}. ${condition.name}\n`;
      knowledge += `   - Prevalencia: ${(condition.prevalence.overall * 100).toFixed(1)}%\n`;
      knowledge += `   - Síntomas clave: ${condition.clinicalPresentation.commonSymptoms.slice(0, 2).map(s => s.symptom).join(', ')}\n`;
      if (condition.emergencyFeatures.length > 0) {
        knowledge += `   - ⚠️ Emergencias: ${condition.emergencyFeatures[0].feature}\n`;
      }
      knowledge += '\n';
    });

    // Add specific knowledge for suspected diagnoses
    suspectedDiagnoses.forEach(diagnosis => {
      const condition = this.searchConditions(diagnosis)[0];
      if (condition) {
        knowledge += this.formatKnowledgeForPrompt(diagnosis);
      }
    });

    return knowledge;
  }
}