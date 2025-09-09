// Enhanced Medical Reasoning Module
// Implementa razonamiento bayesiano y lógica clínica avanzada

export interface BayesianProbability {
  diagnosis: string;
  priorProbability: number;
  likelihoodRatio: number;
  posteriorProbability: number;
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  clinicalSignificance: 'high' | 'medium' | 'low';
}

export interface ClinicalReasoning {
  primaryDiagnosis: string;
  confidence: number;
  differentialDiagnoses: BayesianProbability[];
  criticalDecisionPoints: CriticalDecision[];
  emergencyFlags: EmergencyFlag[];
  recommendedActions: ClinicalAction[];
  uncertaintyAnalysis: UncertaintyAnalysis;
}

export interface CriticalDecision {
  decision: string;
  rationale: string;
  evidenceSupport: string[];
  riskAssessment: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'urgent' | 'routine';
}

export interface EmergencyFlag {
  flag: string;
  urgency: 'critical' | 'urgent' | 'semi-urgent';
  action: string;
  reasoning: string;
}

export interface ClinicalAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  category: 'diagnostic' | 'therapeutic' | 'monitoring' | 'referral';
  evidence: string;
  costBenefit: 'favorable' | 'neutral' | 'unfavorable';
}

export interface UncertaintyAnalysis {
  overallUncertainty: number; // 0-1
  keyUncertainties: string[];
  informationGaps: string[];
  riskTolerance: string;
  recommendedApproach: 'aggressive' | 'moderate' | 'conservative';
}

export class EnhancedMedicalReasoning {
  
  // 1. RAZONAMIENTO BAYESIANO MÉDICO
  static calculateBayesianProbabilities(
    symptoms: string[],
    patientProfile: { age: number; sex: string; history: string[] },
    findings: string[]
  ): BayesianProbability[] {
    
    // Base de conocimiento oftalmológica simplificada
    const ophthalmologyKnowledge = {
      'degeneración macular': {
        baseRate: 0.15, // 15% en población > 65 años
        ageMultiplier: (age: number) => age > 65 ? 3.0 : 0.5,
        symptoms: {
          'visión central borrosa': { lr: 8.0, strength: 'strong' },
          'metamorfopsias': { lr: 12.0, strength: 'strong' },
          'escotoma central': { lr: 15.0, strength: 'strong' },
          'dificultad lectura': { lr: 4.0, strength: 'moderate' }
        }
      },
      'retinopatía diabética': {
        baseRate: 0.28, // 28% en diabéticos
        comorbidityMultiplier: (history: string[]) => 
          history.some(h => h.toLowerCase().includes('diabetes')) ? 5.0 : 0.1,
        symptoms: {
          'visión borrosa': { lr: 3.5, strength: 'moderate' },
          'moscas volantes': { lr: 4.2, strength: 'moderate' },
          'manchas oscuras': { lr: 6.0, strength: 'strong' },
          'pérdida visual nocturna': { lr: 5.5, strength: 'strong' }
        }
      },
      'glaucoma': {
        baseRate: 0.02, // 2% población general
        ageMultiplier: (age: number) => age > 60 ? 4.0 : 1.0,
        symptoms: {
          'pérdida visión periférica': { lr: 10.0, strength: 'strong' },
          'dolor ocular': { lr: 3.0, strength: 'moderate' },
          'halos colores': { lr: 6.0, strength: 'strong' },
          'visión túnel': { lr: 12.0, strength: 'strong' }
        }
      },
      'cataratas': {
        baseRate: 0.50, // 50% población > 65 años
        ageMultiplier: (age: number) => age > 65 ? 2.0 : 0.3,
        symptoms: {
          'visión nublada': { lr: 5.0, strength: 'strong' },
          'deslumbramiento': { lr: 4.0, strength: 'moderate' },
          'colores apagados': { lr: 3.5, strength: 'moderate' },
          'doble visión': { lr: 2.5, strength: 'weak' }
        }
      }
    };

    const probabilities: BayesianProbability[] = [];

    Object.entries(ophthalmologyKnowledge).forEach(([diagnosis, knowledge]) => {
      // Calcular probabilidad previa ajustada
      let priorProbability = knowledge.baseRate;
      
      if ('ageMultiplier' in knowledge) {
        priorProbability *= knowledge.ageMultiplier(patientProfile.age);
      }
      
      if ('comorbidityMultiplier' in knowledge) {
        priorProbability *= knowledge.comorbidityMultiplier(patientProfile.history);
      }

      // Calcular likelihood ratio compuesto
      let compositeLR = 1.0;
      let evidenceStrength: 'strong' | 'moderate' | 'weak' = 'weak';
      let strongEvidence = 0;
      let moderateEvidence = 0;

      symptoms.forEach(symptom => {
        const symptomData = knowledge.symptoms[symptom.toLowerCase()];
        if (symptomData) {
          compositeLR *= symptomData.lr;
          if (symptomData.strength === 'strong') strongEvidence++;
          if (symptomData.strength === 'moderate') moderateEvidence++;
        }
      });

      // Determinar fuerza de evidencia
      if (strongEvidence >= 2) evidenceStrength = 'strong';
      else if (strongEvidence >= 1 || moderateEvidence >= 2) evidenceStrength = 'moderate';

      // Calcular probabilidad posterior usando regla de Bayes
      const posteriorOdds = (priorProbability / (1 - priorProbability)) * compositeLR;
      const posteriorProbability = posteriorOdds / (1 + posteriorOdds);

      // Determinar significancia clínica
      const clinicalSignificance: 'high' | 'medium' | 'low' = 
        posteriorProbability > 0.7 ? 'high' :
        posteriorProbability > 0.3 ? 'medium' : 'low';

      probabilities.push({
        diagnosis,
        priorProbability: Math.min(priorProbability, 0.95),
        likelihoodRatio: compositeLR,
        posteriorProbability: Math.min(posteriorProbability, 0.95),
        evidenceStrength,
        clinicalSignificance
      });
    });

    return probabilities.sort((a, b) => b.posteriorProbability - a.posteriorProbability);
  }

  // 2. DETECCIÓN DE EMERGENCIAS MÉDICAS
  static detectEmergencyFlags(symptoms: string[], findings: string[]): EmergencyFlag[] {
    const flags: EmergencyFlag[] = [];
    
    const emergencyPatterns = {
      'desprendimiento de retina': {
        patterns: ['pérdida visual súbita', 'cortina visual', 'flashes luz', 'moscas volantes súbitas'],
        urgency: 'critical' as const,
        action: 'Consulta oftalmológica inmediata (<6 horas)',
        reasoning: 'Pérdida visual irreversible si no se trata dentro de 6-12 horas'
      },
      'neuritis óptica': {
        patterns: ['pérdida visual monocular', 'dolor movimiento ocular', 'pérdida color'],
        urgency: 'urgent' as const,
        action: 'Evaluación neurológica y oftalmológica <24 horas',
        reasoning: 'Posible indicación de esclerosis múltiple u otra condición desmielinizante'
      },
      'glaucoma agudo': {
        patterns: ['dolor ocular severo', 'náuseas', 'visión borrosa súbita', 'halos colores'],
        urgency: 'critical' as const,
        action: 'Atención oftalmológica inmediata',
        reasoning: 'Presión intraocular elevada puede causar daño irreversible del nervio óptico'
      },
      'arteritis temporal': {
        patterns: ['pérdida visual', 'dolor temporal', 'claudicación mandibular'],
        urgency: 'critical' as const,
        action: 'Corticosteroides sistémicos inmediatos + biopsia arterial',
        reasoning: 'Riesgo de ceguera bilateral irreversible'
      }
    };

    const allText = [...symptoms, ...findings].join(' ').toLowerCase();
    
    Object.entries(emergencyPatterns).forEach(([condition, data]) => {
      const matchedPatterns = data.patterns.filter(pattern => 
        allText.includes(pattern.toLowerCase())
      );
      
      if (matchedPatterns.length >= 2) {
        flags.push({
          flag: condition,
          urgency: data.urgency,
          action: data.action,
          reasoning: data.reasoning
        });
      }
    });

    return flags;
  }

  // 3. ANÁLISIS DE INCERTIDUMBRE CLÍNICA
  static analyzeUncertainty(
    probabilities: BayesianProbability[],
    evidenceQuality: string[],
    informationGaps: string[]
  ): UncertaintyAnalysis {
    
    // Calcular incertidumbre general
    const topProbability = probabilities[0]?.posteriorProbability || 0;
    const probabilitySpread = probabilities.slice(0, 3).reduce((sum, p) => sum + p.posteriorProbability, 0);
    
    const overallUncertainty = 1 - (topProbability - (probabilitySpread - topProbability) / 2);
    
    // Identificar incertidumbres clave
    const keyUncertainties: string[] = [];
    if (topProbability < 0.6) {
      keyUncertainties.push('Ningún diagnóstico tiene alta probabilidad');
    }
    if (probabilities.length > 1 && probabilities[1].posteriorProbability > 0.3) {
      keyUncertainties.push('Múltiples diagnósticos diferenciales plausibles');
    }
    if (evidenceQuality.includes('low')) {
      keyUncertainties.push('Calidad de evidencia limitada');
    }

    // Determinar enfoque recomendado
    let recommendedApproach: 'aggressive' | 'moderate' | 'conservative';
    if (overallUncertainty < 0.3) {
      recommendedApproach = 'aggressive';
    } else if (overallUncertainty < 0.6) {
      recommendedApproach = 'moderate';
    } else {
      recommendedApproach = 'conservative';
    }

    return {
      overallUncertainty: Math.min(overallUncertainty, 1.0),
      keyUncertainties,
      informationGaps,
      riskTolerance: 'Bajo para condiciones que amenacen la visión',
      recommendedApproach
    };
  }

  // 4. GENERACIÓN DE ACCIONES CLÍNICAS
  static generateClinicalActions(
    primaryDiagnosis: string,
    confidence: number,
    emergencyFlags: EmergencyFlag[],
    uncertainty: UncertaintyAnalysis
  ): ClinicalAction[] {
    
    const actions: ClinicalAction[] = [];

    // Acciones de emergencia
    if (emergencyFlags.length > 0) {
      emergencyFlags.forEach(flag => {
        actions.push({
          action: flag.action,
          priority: 'high',
          category: flag.urgency === 'critical' ? 'therapeutic' : 'diagnostic',
          evidence: flag.reasoning,
          costBenefit: 'favorable'
        });
      });
    }

    // Acciones diagnósticas basadas en confianza
    if (confidence < 0.7) {
      actions.push({
        action: 'Examen oftalmológico completo con dilatación pupilar',
        priority: 'high',
        category: 'diagnostic',
        evidence: 'Diagnóstico diferencial incierto requiere evaluación estructural',
        costBenefit: 'favorable'
      });
    }

    // Acciones específicas por diagnóstico
    const diagnosticActions = {
      'degeneración macular': [
        {
          action: 'OCT (tomografía coherencia óptica) mácula',
          priority: 'high' as const,
          category: 'diagnostic' as const,
          evidence: 'Gold standard para diagnóstico y seguimiento DMAE',
          costBenefit: 'favorable' as const
        },
        {
          action: 'Angiografía fluoresceína si DMAE húmeda sospechada',
          priority: 'medium' as const,
          category: 'diagnostic' as const,
          evidence: 'Determinar eligibilidad para tratamiento anti-VEGF',
          costBenefit: 'favorable' as const
        }
      ],
      'glaucoma': [
        {
          action: 'Campo visual automatizado (24-2)',
          priority: 'high' as const,
          category: 'diagnostic' as const,
          evidence: 'Evaluación funcional defectos campimétricos',
          costBenefit: 'favorable' as const
        },
        {
          action: 'OCT nervio óptico y capa fibras nerviosas',
          priority: 'high' as const,
          category: 'diagnostic' as const,
          evidence: 'Detección temprana cambios estructurales',
          costBenefit: 'favorable' as const
        }
      ]
    };

    const specificActions = diagnosticActions[primaryDiagnosis.toLowerCase()];
    if (specificActions) {
      actions.push(...specificActions);
    }

    // Acciones basadas en incertidumbre
    if (uncertainty.overallUncertainty > 0.6) {
      actions.push({
        action: 'Interconsulta con subespecialista en oftalmología',
        priority: 'medium',
        category: 'referral',
        evidence: 'Alta incertidumbre diagnóstica requiere expertise especializada',
        costBenefit: 'favorable'
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // 5. SÍNTESIS COMPLETA DE RAZONAMIENTO CLÍNICO
  static synthesizeReasoning(
    symptoms: string[],
    patientProfile: { age: number; sex: string; history: string[] },
    findings: string[],
    evidenceQuality: string[]
  ): ClinicalReasoning {
    
    // 1. Calcular probabilidades bayesianas
    const probabilities = this.calculateBayesianProbabilities(symptoms, patientProfile, findings);
    
    // 2. Detectar flags de emergencia
    const emergencyFlags = this.detectEmergencyFlags(symptoms, findings);
    
    // 3. Identificar gaps de información comunes
    const informationGaps = [
      'Duración exacta de síntomas',
      'Agudeza visual cuantificada',
      'Presión intraocular',
      'Examen fundoscópico detallado'
    ];
    
    // 4. Analizar incertidumbre
    const uncertaintyAnalysis = this.analyzeUncertainty(probabilities, evidenceQuality, informationGaps);
    
    // 5. Determinar diagnóstico primario y confianza
    const primaryDiagnosis = probabilities[0]?.diagnosis || 'Diagnóstico incierto';
    const confidence = probabilities[0]?.posteriorProbability || 0;
    
    // 6. Generar acciones clínicas
    const recommendedActions = this.generateClinicalActions(
      primaryDiagnosis,
      confidence,
      emergencyFlags,
      uncertaintyAnalysis
    );
    
    // 7. Crear puntos de decisión críticos
    const criticalDecisionPoints: CriticalDecision[] = [];
    
    if (emergencyFlags.length > 0) {
      criticalDecisionPoints.push({
        decision: 'Tratamiento inmediato vs observación',
        rationale: 'Presencia de signos de alarma requiere decisión urgente',
        evidenceSupport: emergencyFlags.map(f => f.reasoning),
        riskAssessment: 'high',
        timeframe: 'immediate'
      });
    }
    
    if (confidence < 0.5) {
      criticalDecisionPoints.push({
        decision: 'Investigación adicional vs tratamiento empírico',
        rationale: 'Diagnóstico incierto requiere balance riesgo-beneficio',
        evidenceSupport: ['Múltiples diagnósticos diferenciales plausibles'],
        riskAssessment: 'medium',
        timeframe: 'urgent'
      });
    }

    return {
      primaryDiagnosis,
      confidence,
      differentialDiagnoses: probabilities,
      criticalDecisionPoints,
      emergencyFlags,
      recommendedActions,
      uncertaintyAnalysis
    };
  }
}

// 6. UTILIDADES PARA INTEGRACIÓN CON SISTEMA EXISTENTE
export class ReasoningIntegration {
  
  static formatReasoningForPrompt(reasoning: ClinicalReasoning): string {
    let prompt = `### RAZONAMIENTO CLÍNICO AVANZADO ###\n\n`;
    
    prompt += `**Diagnóstico Principal:** ${reasoning.primaryDiagnosis} (Confianza: ${(reasoning.confidence * 100).toFixed(1)}%)\n\n`;
    
    if (reasoning.emergencyFlags.length > 0) {
      prompt += `**🚨 FLAGS DE EMERGENCIA:**\n`;
      reasoning.emergencyFlags.forEach(flag => {
        prompt += `- ${flag.flag}: ${flag.action}\n`;
      });
      prompt += `\n`;
    }
    
    prompt += `**Diagnósticos Diferenciales (Bayesianos):**\n`;
    reasoning.differentialDiagnoses.slice(0, 4).forEach(dx => {
      prompt += `- ${dx.diagnosis}: ${(dx.posteriorProbability * 100).toFixed(1)}% (LR: ${dx.likelihoodRatio.toFixed(1)})\n`;
    });
    
    prompt += `\n**Nivel de Incertidumbre:** ${(reasoning.uncertaintyAnalysis.overallUncertainty * 100).toFixed(1)}%\n`;
    prompt += `**Enfoque Recomendado:** ${reasoning.uncertaintyAnalysis.recommendedApproach}\n\n`;
    
    prompt += `**Acciones Prioritarias:**\n`;
    reasoning.recommendedActions.slice(0, 3).forEach(action => {
      prompt += `- [${action.priority.toUpperCase()}] ${action.action}\n`;
    });
    
    return prompt;
  }

  static extractReasoningFromResponse(response: string): Partial<ClinicalReasoning> | null {
    // Implementación para extraer razonamiento de respuestas del AI
    // Esto permitiría retroalimentación y mejora continua
    const patterns = {
      confidence: /confianza[:\s]*(\d+(?:\.\d+)?)/i,
      diagnosis: /diagnóstico[:\s]*([^\n]+)/i,
      emergency: /emergencia|urgente|inmediato/i
    };
    
    const extracted: Partial<ClinicalReasoning> = {};
    
    const confidenceMatch = response.match(patterns.confidence);
    if (confidenceMatch) {
      extracted.confidence = parseFloat(confidenceMatch[1]) / 100;
    }
    
    const diagnosisMatch = response.match(patterns.diagnosis);
    if (diagnosisMatch) {
      extracted.primaryDiagnosis = diagnosisMatch[1].trim();
    }
    
    if (patterns.emergency.test(response)) {
      extracted.emergencyFlags = [{
        flag: 'Situación de emergencia detectada en respuesta',
        urgency: 'urgent',
        action: 'Revisar respuesta para acciones específicas',
        reasoning: 'Términos de urgencia detectados en análisis'
      }];
    }
    
    return Object.keys(extracted).length > 0 ? extracted : null;
  }
}