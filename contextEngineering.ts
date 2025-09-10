// Advanced Context Engineering for Medical AI Agent
// Implementa preservación de contexto médico y razonamiento especializado

import { ResearchStep } from './types';

export interface MedicalContext {
  patientProfile: PatientProfile;
  clinicalFindings: ClinicalFindings;
  workingDiagnoses: WorkingDiagnosis[];
  evidenceQuality: EvidenceMetrics;
  redFlags: RedFlag[];
  anatomicalRegions: AnatomicalRegion[];
  temporalPattern: TemporalPattern;
}

export interface PatientProfile {
  age: number | null;
  sex: 'male' | 'female' | null;
  riskFactors: string[];
  medicalHistory: string[];
  currentSymptoms: Symptom[];
}

export interface Symptom {
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  location: string;
  quality: string;
}

export interface ClinicalFindings {
  visualAcuity: string | null;
  pupilResponse: string | null;
  intraocularPressure: string | null;
  fundusFindings: string | null;
  slitLampFindings: string | null;
  visualFields: string | null;
}

export interface WorkingDiagnosis {
  diagnosis: string;
  probability: number; // 0-1
  supportingEvidence: string[];
  contraIndications: string[];
  nextSteps: string[];
  urgency: 'emergent' | 'urgent' | 'routine';
}

export interface EvidenceMetrics {
  totalSources: number;
  highQualitySources: number;
  peerReviewedSources: number;
  contradictoryEvidence: boolean;
  consensusLevel: 'high' | 'moderate' | 'low' | 'conflicting';
}

export interface RedFlag {
  finding: string;
  significance: string;
  action: string;
  urgency: 'immediate' | 'same-day' | 'within-week';
}

export interface AnatomicalRegion {
  region: 'anterior_segment' | 'posterior_segment' | 'optic_nerve' | 'orbit' | 'lids_lacrimal';
  involved: boolean;
  findings: string[];
}

export interface TemporalPattern {
  onset: 'acute' | 'subacute' | 'chronic' | 'progressive';
  course: 'stable' | 'improving' | 'worsening' | 'fluctuating';
  duration: string;
}

// Context Preservation Engine
export class MedicalContextEngine {
  private context: MedicalContext;
  
  constructor() {
    this.context = this.initializeContext();
  }

  private initializeContext(): MedicalContext {
    return {
      patientProfile: {
        age: null,
        sex: null,
        riskFactors: [],
        medicalHistory: [],
        currentSymptoms: []
      },
      clinicalFindings: {
        visualAcuity: null,
        pupilResponse: null,
        intraocularPressure: null,
        fundusFindings: null,
        slitLampFindings: null,
        visualFields: null
      },
      workingDiagnoses: [],
      evidenceQuality: {
        totalSources: 0,
        highQualitySources: 0,
        peerReviewedSources: 0,
        contradictoryEvidence: false,
        consensusLevel: 'low'
      },
      redFlags: [],
      anatomicalRegions: this.initializeAnatomicalRegions(),
      temporalPattern: {
        onset: 'acute',
        course: 'stable',
        duration: 'unknown'
      }
    };
  }

  private initializeAnatomicalRegions(): AnatomicalRegion[] {
    const regions: AnatomicalRegion['region'][] = [
      'anterior_segment', 'posterior_segment', 'optic_nerve', 'orbit', 'lids_lacrimal'
    ];
    
    return regions.map(region => ({
      region,
      involved: false,
      findings: []
    }));
  }

  // Parse initial patient query and extract structured data
  parseInitialQuery(query: string): void {
    const lines = query.split('\n');
    
    // Extract demographics from first line
    const demographicLine = lines[0] || '';
    const ageMatch = demographicLine.match(/(\d+)\s*años?/i);
    const sexMatch = demographicLine.match(/sexo\s*(masculino|femenino|male|female)/i);
    
    if (ageMatch) {
      this.context.patientProfile.age = parseInt(ageMatch[1]);
    }
    
    if (sexMatch) {
      const sex = sexMatch[1].toLowerCase();
      this.context.patientProfile.sex = sex.startsWith('m') ? 'male' : 'female';
    }

    // Extract symptoms from clinical section
    const clinicalSection = query.split('---')[1] || query;
    this.extractSymptoms(clinicalSection);
    this.detectRedFlags(clinicalSection);
    this.analyzeTemporalPattern(clinicalSection);
  }

  private extractSymptoms(text: string): void {
    const symptomKeywords = {
      vision: ['visión', 'vision', 'see', 'sight', 'blur', 'borrosa'],
      pain: ['dolor', 'pain', 'ache', 'hurt'],
      discharge: ['secreción', 'discharge', 'pus', 'mucus'],
      redness: ['rojez', 'red', 'inflammation', 'inflam'],
      flashing: ['destellos', 'flash', 'lights', 'luces'],
      floaters: ['moscas', 'floaters', 'spots', 'manchas']
    };

    Object.entries(symptomKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword)) {
          const severity = this.determineSeverity(text, keyword);
          this.context.patientProfile.currentSymptoms.push({
            description: `${category} symptoms detected`,
            severity,
            duration: this.extractDuration(text, keyword),
            location: this.extractLocation(text, keyword),
            quality: keyword
          });
        }
      });
    });
  }

  private determineSeverity(text: string, keyword: string): 'mild' | 'moderate' | 'severe' {
    const keywordIndex = text.toLowerCase().indexOf(keyword);
    const surrounding = text.substring(Math.max(0, keywordIndex - 50), keywordIndex + 50).toLowerCase();
    
    if (surrounding.includes('severo') || surrounding.includes('severe') || surrounding.includes('intenso')) {
      return 'severe';
    }
    if (surrounding.includes('moderado') || surrounding.includes('moderate')) {
      return 'moderate';
    }
    return 'mild';
  }

  private extractDuration(text: string, keyword: string): string {
    const durationPatterns = [
      /(\d+)\s*(días?|days?)/gi,
      /(\d+)\s*(semanas?|weeks?)/gi,
      /(\d+)\s*(meses?|months?)/gi,
      /(\d+)\s*(años?|years?)/gi,
      /(hace|since|for)\s*(\d+)/gi
    ];

    for (const pattern of durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return 'unknown';
  }

  private extractLocation(text: string, keyword: string): string {
    const locations = ['ojo derecho', 'ojo izquierdo', 'ambos ojos', 'right eye', 'left eye', 'both eyes'];
    
    for (const location of locations) {
      if (text.toLowerCase().includes(location)) {
        return location;
      }
    }
    return 'unspecified';
  }

  private detectRedFlags(text: string): void {
    const redFlagPatterns = [
      {
        pattern: /pérdida.*visión.*súbita|sudden.*vision.*loss/gi,
        finding: 'Sudden vision loss',
        significance: 'Potential retinal artery occlusion, retinal detachment, or optic neuritis',
        action: 'Immediate ophthalmologic evaluation',
        urgency: 'immediate' as const
      },
      {
        pattern: /dolor.*severo|severe.*pain|dolor.*intenso/gi,
        finding: 'Severe eye pain',
        significance: 'Possible acute angle-closure glaucoma or severe inflammation',
        action: 'Same-day ophthalmologic evaluation',
        urgency: 'same-day' as const
      },
      {
        pattern: /destellos.*luces|flashing.*lights|photopsia/gi,
        finding: 'Photopsia/flashing lights',
        significance: 'Possible retinal tear or detachment',
        action: 'Urgent funduscopic examination',
        urgency: 'same-day' as const
      },
      {
        pattern: /cortina.*visión|curtain.*vision|campo.*visual/gi,
        finding: 'Visual field defect',
        significance: 'Possible retinal detachment or neurological cause',
        action: 'Emergency evaluation if acute onset',
        urgency: 'immediate' as const
      }
    ];

    redFlagPatterns.forEach(({ pattern, finding, significance, action, urgency }) => {
      if (pattern.test(text)) {
        this.context.redFlags.push({
          finding,
          significance,
          action,
          urgency
        });
      }
    });
  }

  private analyzeTemporalPattern(text: string): void {
    const onsetPatterns = {
      acute: /súbit[oa]|sudden|acute|agud[oa]/gi,
      subacute: /progresiv[oa]|gradual|subagud[oa]/gi,
      chronic: /crónic[oa]|chronic|persistent|meses|months|años|years/gi
    };

    Object.entries(onsetPatterns).forEach(([onset, pattern]) => {
      if (pattern.test(text)) {
        this.context.temporalPattern.onset = onset as any;
      }
    });

    // Course analysis
    if (/empeorand[oa]|worsening|worse|deteriorat/gi.test(text)) {
      this.context.temporalPattern.course = 'worsening';
    } else if (/mejorand[oa]|improving|better/gi.test(text)) {
      this.context.temporalPattern.course = 'improving';
    } else if (/intermitente|fluctuat|variable/gi.test(text)) {
      this.context.temporalPattern.course = 'fluctuating';
    }
  }

  // Update context with new step results
  updateContextWithStepResult(step: ResearchStep): void {
    if (!step.result) return;

    // Update working diagnoses
    this.extractDiagnoses(step.result);
    
    // Update clinical findings
    this.extractClinicalFindings(step.result);
    
    // Update evidence quality
    this.updateEvidenceMetrics(step.sources || []);
    
    // Update anatomical involvement
    this.updateAnatomicalInvolvement(step.result);
  }

  private extractDiagnoses(result: string): void {
    const diagnosisPatterns = [
      /diagnóstico.*:([^\.]+)/gi,
      /diagnosis.*:([^\.]+)/gi,
      /posible.*:([^\.]+)/gi,
      /probable.*:([^\.]+)/gi,
      /differential.*diagnosis.*:([^\.]+)/gi
    ];

    diagnosisPatterns.forEach(pattern => {
      const matches = [...result.matchAll(pattern)];
      matches.forEach(match => {
        const diagnosisText = match[1].trim();
        const probability = this.calculateProbability(result, diagnosisText);
        
        // Check if diagnosis already exists
        const existingIndex = this.context.workingDiagnoses.findIndex(d => 
          d.diagnosis.toLowerCase().includes(diagnosisText.toLowerCase()) ||
          diagnosisText.toLowerCase().includes(d.diagnosis.toLowerCase())
        );

        const diagnosis: WorkingDiagnosis = {
          diagnosis: diagnosisText,
          probability,
          supportingEvidence: this.extractSupportingEvidence(result, diagnosisText),
          contraIndications: this.extractContraIndications(result, diagnosisText),
          nextSteps: this.extractNextSteps(result, diagnosisText),
          urgency: this.determineUrgency(diagnosisText)
        };

        if (existingIndex >= 0) {
          // Update existing diagnosis with higher probability if needed
          if (probability > this.context.workingDiagnoses[existingIndex].probability) {
            this.context.workingDiagnoses[existingIndex] = diagnosis;
          }
        } else {
          this.context.workingDiagnoses.push(diagnosis);
        }
      });
    });

    // Sort by probability
    this.context.workingDiagnoses.sort((a, b) => b.probability - a.probability);
    
    // Keep top 5 diagnoses
    this.context.workingDiagnoses = this.context.workingDiagnoses.slice(0, 5);
  }

  private calculateProbability(text: string, diagnosis: string): number {
    let probability = 0.5; // Base probability
    
    const highProbabilityTerms = ['más probable', 'most likely', 'primary', 'principal'];
    const mediumProbabilityTerms = ['posible', 'possible', 'considerar', 'consider'];
    const lowProbabilityTerms = ['menos probable', 'unlikely', 'descartar', 'rule out'];
    
    const diagnosisContext = this.getContextAroundTerm(text, diagnosis, 100);
    
    if (highProbabilityTerms.some(term => diagnosisContext.includes(term))) {
      probability += 0.3;
    } else if (mediumProbabilityTerms.some(term => diagnosisContext.includes(term))) {
      probability += 0.1;
    } else if (lowProbabilityTerms.some(term => diagnosisContext.includes(term))) {
      probability -= 0.2;
    }
    
    return Math.max(0.1, Math.min(0.95, probability));
  }

  private getContextAroundTerm(text: string, term: string, contextSize: number): string {
    const termIndex = text.toLowerCase().indexOf(term.toLowerCase());
    if (termIndex === -1) return '';
    
    const start = Math.max(0, termIndex - contextSize);
    const end = Math.min(text.length, termIndex + term.length + contextSize);
    
    return text.substring(start, end).toLowerCase();
  }

  private extractSupportingEvidence(text: string, diagnosis: string): string[] {
    // This would be more sophisticated in practice
    const evidencePatterns = [
      /evidencia.*:([^\.]+)/gi,
      /evidence.*:([^\.]+)/gi,
      /supporting.*:([^\.]+)/gi,
      /apoyan.*:([^\.]+)/gi
    ];
    
    const evidence: string[] = [];
    evidencePatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => evidence.push(match[1].trim()));
    });
    
    return evidence;
  }

  private extractContraIndications(text: string, diagnosis: string): string[] {
    const contraPatterns = [
      /contraindica.*:([^\.]+)/gi,
      /against.*:([^\.]+)/gi,
      /no.*compatible.*:([^\.]+)/gi
    ];
    
    const contraindications: string[] = [];
    contraPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => contraindications.push(match[1].trim()));
    });
    
    return contraindications;
  }

  private extractNextSteps(text: string, diagnosis: string): string[] {
    const stepPatterns = [
      /siguiente.*paso.*:([^\.]+)/gi,
      /next.*step.*:([^\.]+)/gi,
      /recomenda.*:([^\.]+)/gi,
      /recommend.*:([^\.]+)/gi
    ];
    
    const steps: string[] = [];
    stepPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => steps.push(match[1].trim()));
    });
    
    return steps;
  }

  private determineUrgency(diagnosis: string): 'emergent' | 'urgent' | 'routine' {
    const emergentConditions = [
      'retinal artery occlusion', 'retinal detachment', 'acute angle closure glaucoma',
      'optic neuritis', 'temporal arteritis', 'endophthalmitis'
    ];
    
    const urgentConditions = [
      'retinal tear', 'vitreous hemorrhage', 'central serous chorioretinopathy',
      'anterior uveitis', 'corneal ulcer'
    ];
    
    const diagnosisLower = diagnosis.toLowerCase();
    
    if (emergentConditions.some(condition => diagnosisLower.includes(condition))) {
      return 'emergent';
    }
    
    if (urgentConditions.some(condition => diagnosisLower.includes(condition))) {
      return 'urgent';
    }
    
    return 'routine';
  }

  private extractClinicalFindings(result: string): void {
    const findingPatterns = {
      visualAcuity: /visual.*acuity.*:([^\.]+)|agudeza.*visual.*:([^\.]+)/gi,
      pupilResponse: /pupil.*response.*:([^\.]+)|respuesta.*pupilar.*:([^\.]+)/gi,
      intraocularPressure: /intraocular.*pressure.*:([^\.]+)|presión.*intraocular.*:([^\.]+)/gi,
      fundusFindings: /fundus.*:([^\.]+)|fondo.*ojo.*:([^\.]+)/gi,
      slitLampFindings: /slit.*lamp.*:([^\.]+)|lámpara.*hendidura.*:([^\.]+)/gi,
      visualFields: /visual.*field.*:([^\.]+)|campo.*visual.*:([^\.]+)/gi
    };

    Object.entries(findingPatterns).forEach(([finding, pattern]) => {
      const matches = [...result.matchAll(pattern)];
      if (matches.length > 0) {
        const value = matches[0][1] || matches[0][2];
        if (value) {
          (this.context.clinicalFindings as any)[finding] = value.trim();
        }
      }
    });
  }

  private updateEvidenceMetrics(sources: any[]): void {
    this.context.evidenceQuality.totalSources += sources.length;
    
    // This would integrate with the existing MedicalSourceValidator
    sources.forEach(source => {
      if (this.isHighQualitySource(source)) {
        this.context.evidenceQuality.highQualitySources++;
      }
      if (this.isPeerReviewedSource(source)) {
        this.context.evidenceQuality.peerReviewedSources++;
      }
    });
    
    this.updateConsensusLevel();
  }

  private isHighQualitySource(source: any): boolean {
    if (!source.web?.uri) return false;
    
    const highQualityDomains = [
      'pubmed', 'cochrane', 'uptodate', 'aao.org', 'nature.com',
      'nejm.org', 'jama.ama-assn.org', 'thelancet.com'
    ];
    
    return highQualityDomains.some(domain => source.web.uri.includes(domain));
  }

  private isPeerReviewedSource(source: any): boolean {
    if (!source.web?.title) return false;
    
    const peerReviewedIndicators = [
      'systematic review', 'meta-analysis', 'randomized controlled trial',
      'clinical trial', 'peer reviewed', 'cochrane'
    ];
    
    return peerReviewedIndicators.some(indicator => 
      source.web.title.toLowerCase().includes(indicator)
    );
  }

  private updateConsensusLevel(): void {
    const highQualityRatio = this.context.evidenceQuality.highQualitySources / 
                           Math.max(1, this.context.evidenceQuality.totalSources);
    
    if (highQualityRatio >= 0.7) {
      this.context.evidenceQuality.consensusLevel = 'high';
    } else if (highQualityRatio >= 0.4) {
      this.context.evidenceQuality.consensusLevel = 'moderate';
    } else {
      this.context.evidenceQuality.consensusLevel = 'low';
    }
  }

  private updateAnatomicalInvolvement(result: string): void {
    const anatomicalKeywords = {
      anterior_segment: ['cornea', 'iris', 'lens', 'anterior chamber', 'conjunctiva'],
      posterior_segment: ['retina', 'vitreous', 'macula', 'choroid'],
      optic_nerve: ['optic nerve', 'optic disc', 'nervio óptico'],
      orbit: ['orbital', 'orbit', 'extraocular muscles', 'órbita'],
      lids_lacrimal: ['eyelid', 'lacrimal', 'tear duct', 'párpado']
    };

    Object.entries(anatomicalKeywords).forEach(([region, keywords]) => {
      const regionData = this.context.anatomicalRegions.find(r => r.region === region);
      if (!regionData) return;

      keywords.forEach(keyword => {
        if (result.toLowerCase().includes(keyword.toLowerCase())) {
          regionData.involved = true;
          if (!regionData.findings.includes(keyword)) {
            regionData.findings.push(keyword);
          }
        }
      });
    });
  }

  // Generate compressed context for next step
  generateContextSummary(): string {
    const patientAge = this.context.patientProfile.age || 'unknown age';
    const patientSex = this.context.patientProfile.sex || 'unknown sex';
    
    const topDiagnosis = this.context.workingDiagnoses[0];
    const redFlags = this.context.redFlags.length > 0 ? 
      `🚨 RED FLAGS: ${this.context.redFlags.map(rf => rf.finding).join(', ')}` : '';
    
    const involvedRegions = this.context.anatomicalRegions
      .filter(r => r.involved)
      .map(r => r.region)
      .join(', ');

    return `
### MEDICAL CONTEXT SUMMARY ###
**Patient:** ${patientAge}, ${patientSex}
**Temporal Pattern:** ${this.context.temporalPattern.onset} onset, ${this.context.temporalPattern.course} course
**Anatomical Regions:** ${involvedRegions || 'not specified'}
**Primary Working Diagnosis:** ${topDiagnosis?.diagnosis || 'not established'} (${Math.round((topDiagnosis?.probability || 0) * 100)}% confidence)
**Evidence Quality:** ${this.context.evidenceQuality.consensusLevel} consensus (${this.context.evidenceQuality.highQualitySources}/${this.context.evidenceQuality.totalSources} high-quality sources)
${redFlags}

**Key Clinical Findings:**
${Object.entries(this.context.clinicalFindings)
  .filter(([_, value]) => value !== null)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Current Symptom Profile:**
${this.context.patientProfile.currentSymptoms
  .map(s => `- ${s.description} (${s.severity}, ${s.duration})`)
  .join('\n')}
    `.trim();
  }

  // Get current context
  getContext(): MedicalContext {
    return { ...this.context };
  }

  // Reset context for new case
  resetContext(): void {
    this.context = this.initializeContext();
  }

  // STATIC METHODS FOR INTEGRATION WITH EXISTING SYSTEM
  static parseInitialContext(query: string): MedicalContext {
    const engine = new MedicalContextEngine();
    engine.parseInitialQuery(query);
    return engine.getContext();
  }

  static generateContextSummary(context: MedicalContext): string {
    const patientAge = context.patientProfile.age || 'unknown age';
    const patientSex = context.patientProfile.sex || 'unknown sex';
    
    const topDiagnosis = context.workingDiagnoses[0];
    const redFlags = context.redFlags.length > 0 ? 
      `🚨 RED FLAGS: ${context.redFlags.map(rf => rf.finding).join(', ')}` : '';
    
    const involvedRegions = context.anatomicalRegions
      .filter(r => r.involved)
      .map(r => r.region)
      .join(', ');

    return `
### MEDICAL CONTEXT SUMMARY ###
**Patient:** ${patientAge}, ${patientSex}
**Temporal Pattern:** ${context.temporalPattern.onset} onset, ${context.temporalPattern.course} course
**Anatomical Regions:** ${involvedRegions || 'not specified'}
**Primary Working Diagnosis:** ${topDiagnosis?.diagnosis || 'not established'} (${Math.round((topDiagnosis?.probability || 0) * 100)}% confidence)
**Evidence Quality:** ${context.evidenceQuality.consensusLevel} consensus (${context.evidenceQuality.highQualitySources}/${context.evidenceQuality.totalSources} high-quality sources)
${redFlags}

**Key Clinical Findings:**
${Object.entries(context.clinicalFindings)
  .filter(([_, value]) => value !== null)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

**Current Symptom Profile:**
${context.patientProfile.currentSymptoms
  .map(s => `- ${s.description} (${s.severity}, ${s.duration})`)
  .join('\n')}
    `.trim();
  }

  static updateContext(
    currentContext: MedicalContext,
    newFindings: string,
    sources: any[],
    quality: any[]
  ): MedicalContext {
    const engine = new MedicalContextEngine();
    engine.context = currentContext;
    
    // Create a mock research step with the new findings
    const mockStep: ResearchStep = {
      id: Date.now(),
      title: 'Context Update',
      status: 'completed',
      result: newFindings,
      prompt: '',
      sources: sources
    };
    
    engine.updateContextWithStepResult(mockStep);
    return engine.getContext();
  }
}