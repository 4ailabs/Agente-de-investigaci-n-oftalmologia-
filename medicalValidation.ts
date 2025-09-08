// Medical Validation and Quality Assurance Module
// Implementa validación de fuentes médicas y detección de contradicciones

export interface SourceQuality {
  level: 'high' | 'medium' | 'low';
  authority: number; // 0-100
  recency: Date | null;
  peerReviewed: boolean;
  medicalAuthority: boolean;
  domain: string;
}

export interface MedicalDisclaimers {
  ai_limitation: string;
  supervision_required: string;
  evidence_quality: string;
  not_diagnostic: string;
  source_validation: string;
}

export interface ContradictionDetection {
  hasConflicts: boolean;
  conflicts: Conflict[];
  resolution: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface Conflict {
  type: 'contradictory_findings' | 'different_diagnoses' | 'conflicting_treatments';
  sources: string[];
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// 1. VALIDACIÓN DE FUENTES MÉDICAS
export class MedicalSourceValidator {
  private static readonly HIGH_AUTHORITY_DOMAINS = [
    'cochrane.org',
    'pubmed.ncbi.nlm.nih.gov',
    'clinicaltrials.gov',
    'uptodate.com',
    'medscape.com',
    'aao.org',
    'esrs.org',
    'thelancet.com',
    'jama.ama-assn.org',
    'nejm.org',
    'ophthalmology.org'
  ];

  private static readonly MEDIUM_AUTHORITY_DOMAINS = [
    'mayoclinic.org',
    'webmd.com',
    'healthline.com',
    'medicalnewstoday.com'
  ];

  private static readonly PEER_REVIEWED_INDICATORS = [
    'systematic review',
    'meta-analysis',
    'randomized controlled trial',
    'cochrane',
    'pubmed',
    'clinical trial',
    'peer reviewed'
  ];

  static validateSource(source: { web: { uri: string; title: string } }): SourceQuality {
    const uri = source.web.uri;
    const title = source.web.title;
    const domain = this.extractDomain(uri);
    
    const authority = this.calculateAuthority(domain, title);
    const level = this.determineLevel(authority);
    const peerReviewed = this.isPeerReviewed(title);
    const medicalAuthority = this.isMedicalAuthority(domain, title);
    
    return {
      level,
      authority,
      recency: null, // Se puede implementar parsing de fecha
      peerReviewed,
      medicalAuthority,
      domain
    };
  }

  private static extractDomain(uri: string): string {
    try {
      const url = new URL(uri);
      return url.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private static calculateAuthority(domain: string, title: string): number {
    let score = 0;
    
    // Scoring por dominio
    if (this.HIGH_AUTHORITY_DOMAINS.some(d => domain.includes(d))) {
      score += 80;
    } else if (this.MEDIUM_AUTHORITY_DOMAINS.some(d => domain.includes(d))) {
      score += 50;
    } else {
      score += 20;
    }
    
    // Bonus por indicadores de calidad
    if (this.PEER_REVIEWED_INDICATORS.some(indicator => 
      title.toLowerCase().includes(indicator.toLowerCase())
    )) {
      score += 15;
    }
    
    // Penalty por dominios no médicos
    if (domain.includes('wikipedia') || domain.includes('blog')) {
      score -= 30;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private static determineLevel(authority: number): 'high' | 'medium' | 'low' {
    if (authority >= 70) return 'high';
    if (authority >= 40) return 'medium';
    return 'low';
  }

  private static isPeerReviewed(title: string): boolean {
    return this.PEER_REVIEWED_INDICATORS.some(indicator => 
      title.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private static isMedicalAuthority(domain: string, title: string): boolean {
    const medicalKeywords = [
      'medical', 'clinical', 'health', 'medicine', 'ophthalmology',
      'eye', 'vision', 'retina', 'cornea', 'glaucoma'
    ];
    
    return this.HIGH_AUTHORITY_DOMAINS.some(d => domain.includes(d)) ||
           medicalKeywords.some(keyword => 
             title.toLowerCase().includes(keyword.toLowerCase())
           );
  }
}

// 2. DETECCIÓN DE CONTRADICCIONES
export class ContradictionDetector {
  static detectConflicts(sources: { web: { uri: string; title: string } }[]): ContradictionDetection {
    const conflicts: Conflict[] = [];
    
    // Detectar contradicciones en títulos (simplificado)
    const titles = sources.map(s => s.web.title.toLowerCase());
    
    // Buscar patrones contradictorios
    const contradictoryPatterns = [
      { positive: ['effective', 'beneficial', 'improves'], negative: ['ineffective', 'harmful', 'worsens'] },
      { positive: ['safe', 'well-tolerated'], negative: ['unsafe', 'toxic', 'adverse'] },
      { positive: ['recommended', 'indicated'], negative: ['contraindicated', 'not recommended'] }
    ];
    
    contradictoryPatterns.forEach(pattern => {
      const hasPositive = titles.some(title => 
        pattern.positive.some(p => title.includes(p))
      );
      const hasNegative = titles.some(title => 
        pattern.negative.some(n => title.includes(n))
      );
      
      if (hasPositive && hasNegative) {
        conflicts.push({
          type: 'contradictory_findings',
          sources: sources.map(s => s.web.title),
          description: `Contradicción detectada en evidencia sobre efectividad/seguridad`,
          severity: 'high'
        });
      }
    });
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolution: this.generateResolution(conflicts),
      confidence: conflicts.length > 0 ? 'high' : 'low'
    };
  }

  private static generateResolution(conflicts: Conflict[]): string {
    if (conflicts.length === 0) return 'No se detectaron contradicciones en las fuentes';
    
    return `Se detectaron ${conflicts.length} contradicción(es) en las fuentes. Se recomienda priorizar evidencia de mayor calidad y buscar consenso en la literatura médica.`;
  }
}

// 3. DISCLAIMERS MÉDICOS
export const MEDICAL_DISCLAIMERS: MedicalDisclaimers = {
  ai_limitation: "⚠️ **IMPORTANTE**: Este análisis es generado por inteligencia artificial y no reemplaza el juicio clínico profesional.",
  supervision_required: "👨‍⚕️ **SUPERVISIÓN MÉDICA REQUERIDA**: Todas las recomendaciones deben ser validadas por un médico calificado antes de su aplicación.",
  evidence_quality: "📊 **CALIDAD DE EVIDENCIA**: La calidad y actualidad de la evidencia puede variar según las fuentes disponibles.",
  not_diagnostic: "🚫 **NO ES DIAGNÓSTICO**: Este análisis no constituye un diagnóstico médico definitivo y no debe utilizarse como tal.",
  source_validation: "🔍 **VALIDACIÓN DE FUENTES**: Las fuentes han sido evaluadas por autoridad médica, pero se recomienda verificación adicional."
};

// 4. GENERADOR DE DISCLAIMERS PARA REPORTES
export class DisclaimerGenerator {
  static generateReportDisclaimers(): string {
    return `
---
${MEDICAL_DISCLAIMERS.ai_limitation}

${MEDICAL_DISCLAIMERS.supervision_required}

${MEDICAL_DISCLAIMERS.evidence_quality}

${MEDICAL_DISCLAIMERS.not_diagnostic}

${MEDICAL_DISCLAIMERS.source_validation}
---
    `.trim();
  }

  static generateStepDisclaimers(quality: SourceQuality): string {
    let disclaimer = '';
    
    if (quality.level === 'low') {
      disclaimer += `⚠️ **ADVERTENCIA**: Las fuentes utilizadas tienen autoridad limitada. Se recomienda verificación adicional.\n\n`;
    }
    
    if (!quality.peerReviewed) {
      disclaimer += `📝 **NOTA**: La evidencia no proviene de fuentes revisadas por pares.\n\n`;
    }
    
    return disclaimer;
  }
}

// 5. EVALUADOR DE CALIDAD DE EVIDENCIA
export class EvidenceQualityEvaluator {
  static evaluateEvidence(sources: { web: { uri: string; title: string } }[]): {
    overallQuality: 'high' | 'medium' | 'low';
    highQualityCount: number;
    mediumQualityCount: number;
    lowQualityCount: number;
    recommendations: string[];
  } {
    const qualities = sources.map(source => MedicalSourceValidator.validateSource(source));
    
    const highQualityCount = qualities.filter(q => q.level === 'high').length;
    const mediumQualityCount = qualities.filter(q => q.level === 'medium').length;
    const lowQualityCount = qualities.filter(q => q.level === 'low').length;
    
    let overallQuality: 'high' | 'medium' | 'low';
    if (highQualityCount >= sources.length * 0.7) {
      overallQuality = 'high';
    } else if (highQualityCount + mediumQualityCount >= sources.length * 0.5) {
      overallQuality = 'medium';
    } else {
      overallQuality = 'low';
    }
    
    const recommendations: string[] = [];
    if (lowQualityCount > 0) {
      recommendations.push(`Se encontraron ${lowQualityCount} fuentes de baja calidad. Se recomienda buscar evidencia adicional.`);
    }
    if (highQualityCount < 2) {
      recommendations.push('Se recomienda buscar al menos 2 fuentes de alta calidad para mayor confiabilidad.');
    }
    
    return {
      overallQuality,
      highQualityCount,
      mediumQualityCount,
      lowQualityCount,
      recommendations
    };
  }
}

// 6. INTEGRACIÓN CON EL SISTEMA EXISTENTE
export class MedicalValidationService {
  static async validateAndEnhanceSources(sources: { web: { uri: string; title: string } }[] | null): Promise<{
    validatedSources: { web: { uri: string; title: string } }[];
    quality: SourceQuality[];
    contradictions: ContradictionDetection;
    disclaimers: string;
  }> {
    if (!sources || sources.length === 0) {
      return {
        validatedSources: [],
        quality: [],
        contradictions: { hasConflicts: false, conflicts: [], resolution: '', confidence: 'low' },
        disclaimers: DisclaimerGenerator.generateReportDisclaimers()
      };
    }
    
    // Validar calidad de fuentes
    const quality = sources.map(source => MedicalSourceValidator.validateSource(source));
    
    // Filtrar fuentes de muy baja calidad
    const validatedSources = sources.filter((_, index) => quality[index].authority > 20);
    
    // Detectar contradicciones
    const contradictions = ContradictionDetector.detectConflicts(validatedSources);
    
    // Generar disclaimers
    const disclaimers = DisclaimerGenerator.generateReportDisclaimers();
    
    return {
      validatedSources,
      quality,
      contradictions,
      disclaimers
    };
  }
}
