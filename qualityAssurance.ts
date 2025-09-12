// Quality Assurance Loop for Medical AI Agent
// Implementa validación continua y mejora de respuestas

export interface QualityMetrics {
  clinicalAccuracy: number;
  evidenceQuality: number;
  responseCompleteness: number;
  consistencyScore: number;
  safetyScore: number;
  overallQuality: number;
}

export interface QualityCheck {
  checkId: string;
  timestamp: Date;
  stepId: number;
  stepTitle: string;
  response: string;
  sources: any[];
  metrics: QualityMetrics;
  issues: QualityIssue[];
  recommendations: QualityRecommendation[];
  approved: boolean;
}

export interface QualityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'medical_accuracy' | 'evidence_quality' | 'safety' | 'completeness' | 'consistency';
  description: string;
  location: string;
  suggestedFix: string;
}

export interface QualityRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'additional_search' | 'source_verification' | 'clinical_validation' | 'safety_check';
  action: string;
  rationale: string;
}

export interface QualityPattern {
  pattern: RegExp;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export class QualityAssuranceEngine {
  
  // PATRONES DE CALIDAD MÉDICA
  private static readonly QUALITY_PATTERNS: QualityPattern[] = [
    // Patrones de seguridad críticos
    { pattern: /definitiv[ao]s?\s+diagnóstic[ao]s?/i, category: 'safety', severity: 'critical', description: 'Evitar afirmaciones diagnósticas definitivas sin evaluación clínica' },
    { pattern: /recomen[a|e]mos?\s+(tratar|medicament|cirugía)/i, category: 'safety', severity: 'critical', description: 'Evitar recomendaciones terapéuticas específicas sin supervisión médica' },
    { pattern: /no\s+necesita[s]?\s+(tratamiento|medicación)/i, category: 'safety', severity: 'high', description: 'Evitar descartar necesidad de tratamiento' },
    
    // Patrones de calidad evidencial
    { pattern: /según\s+(wikipedia|blogs?|foros?)/i, category: 'evidence_quality', severity: 'high', description: 'Fuentes no médicas de baja calidad detectadas' },
    { pattern: /\d+%\s+de\s+(eficacia|éxito|curación)/i, category: 'medical_accuracy', severity: 'medium', description: 'Verificar estadísticas médicas con fuentes primarias' },
    { pattern: /(siempre|nunca|todos?)\s+(los\s+)?pacientes?/i, category: 'medical_accuracy', severity: 'medium', description: 'Evitar generalizaciones absolutas en medicina' },
    
    // Patrones de completitud
    { pattern: /diagnósticos?\s+diferenciales?:/i, category: 'completeness', severity: 'low', description: 'Positivo: incluye diagnósticos diferenciales' },
    { pattern: /factores?\s+de\s+riesgos?/i, category: 'completeness', severity: 'low', description: 'Positivo: considera factores de riesgo' },
    { pattern: /pronósticos?/i, category: 'completeness', severity: 'low', description: 'Positivo: incluye información pronóstica' }
  ];

  // CRITERIOS DE EVALUACIÓN MÉDICA
  private static readonly MEDICAL_QUALITY_CRITERIA = {
    evidenceHierarchy: {
      'systematic review': 5,
      'meta-analysis': 5,
      'randomized controlled trial': 4,
      'cohort study': 3,
      'case-control': 2,
      'case series': 1,
      'expert opinion': 1
    },
    medicalTerminology: [
      'pathophysiology', 'etiology', 'differential diagnosis',
      'prognosis', 'sensitivity', 'specificity', 'prevalence',
      'incidence', 'risk factors', 'clinical presentation'
    ],
    safetyKeywords: [
      'emergency', 'urgent', 'immediate', 'consultation',
      'monitoring', 'contraindication', 'adverse effect'
    ]
  };

  // 1. EVALUACIÓN AUTOMÁTICA DE CALIDAD
  static evaluateResponse(response: string, sources: any[]): QualityMetrics {
    const clinicalAccuracy = this.assessClinicalAccuracy(response);
    const evidenceQuality = this.assessEvidenceQuality(sources);
    const responseCompleteness = this.assessCompleteness(response);
    const consistencyScore = this.assessConsistency(response);
    const safetyScore = this.assessSafety(response);
    
    const overallQuality = (
      clinicalAccuracy * 0.25 +
      evidenceQuality * 0.25 +
      responseCompleteness * 0.20 +
      consistencyScore * 0.15 +
      safetyScore * 0.15
    );

    return {
      clinicalAccuracy,
      evidenceQuality,
      responseCompleteness,
      consistencyScore,
      safetyScore,
      overallQuality
    };
  }

  private static assessClinicalAccuracy(response: string): number {
    let score = 0.7; // Base score
    const lowerResponse = response.toLowerCase();

    // Positive indicators
    let positiveCount = 0;
    this.MEDICAL_QUALITY_CRITERIA.medicalTerminology.forEach(term => {
      if (lowerResponse.includes(term)) positiveCount++;
    });
    score += (positiveCount / this.MEDICAL_QUALITY_CRITERIA.medicalTerminology.length) * 0.2;

    // Check for medical reasoning structure
    if (lowerResponse.includes('differential') || lowerResponse.includes('diagnóstico diferencial')) {
      score += 0.1;
    }
    if (lowerResponse.includes('pathophysiology') || lowerResponse.includes('fisiopatología')) {
      score += 0.1;
    }

    // Penalties for problematic patterns
    this.QUALITY_PATTERNS.forEach(pattern => {
      if (pattern.category === 'medical_accuracy' && pattern.pattern.test(response)) {
        const penalty = pattern.severity === 'critical' ? 0.3 : 
                       pattern.severity === 'high' ? 0.2 : 0.1;
        score -= penalty;
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  private static assessEvidenceQuality(sources: any[]): number {
    if (!sources || sources.length === 0) return 0.3;

    let totalScore = 0;
    let validSources = 0;

    sources.forEach(source => {
      if (source?.web?.title) {
        let sourceScore = 0.5; // Base score
        const title = source.web.title.toLowerCase();
        
        // Check evidence hierarchy
        Object.entries(this.MEDICAL_QUALITY_CRITERIA.evidenceHierarchy).forEach(([type, value]) => {
          if (title.includes(type)) {
            sourceScore = value / 5; // Normalize to 0-1
          }
        });

        // Check for medical journals/databases
        const highQualityDomains = ['pubmed', 'cochrane', 'nejm', 'jama', 'uptodate', 'medscape'];
        const uri = source.web.uri?.toLowerCase() || '';
        if (highQualityDomains.some(domain => uri.includes(domain))) {
          sourceScore = Math.max(sourceScore, 0.8);
        }

        totalScore += sourceScore;
        validSources++;
      }
    });

    return validSources > 0 ? totalScore / validSources : 0.3;
  }

  private static assessCompleteness(response: string): number {
    let score = 0.5; // Base score
    const lowerResponse = response.toLowerCase();

    // Check for key medical components
    const components = {
      'clinical presentation': /síntomas?|signos?|presentación|manifestac/i,
      'differential diagnosis': /diagnóstico.*diferencial|diagnósticos.*diferencial/i,
      'pathophysiology': /fisiopatología|mecanismo|patogenia/i,
      'management': /tratamiento|manejo|terapia/i,
      'prognosis': /pronóstico|evolución|desenlace/i,
      'risk factors': /factor.*riesgo|riesgos?/i
    };

    let componentCount = 0;
    Object.values(components).forEach(pattern => {
      if (pattern.test(response)) componentCount++;
    });

    score += (componentCount / Object.keys(components).length) * 0.5;

    // Length consideration (not too short, not excessively long)
    const wordCount = response.split(/\s+/).length;
    if (wordCount < 100) score *= 0.7; // Too brief
    if (wordCount > 2000) score *= 0.9; // Very long

    return Math.min(1, score);
  }

  private static assessConsistency(response: string): number {
    let score = 0.8; // Base score

    // Check for contradictions (simplified)
    const contradictoryPatterns = [
      { positive: /beneficioso|efectivo|mejora/i, negative: /perjudicial|inefectivo|empeora/i },
      { positive: /seguro|bien tolerado/i, negative: /peligroso|tóxico|adverso/i },
      { positive: /recomendado|indicado/i, negative: /contraindicado|no recomendado/i }
    ];

    contradictoryPatterns.forEach(pair => {
      if (pair.positive.test(response) && pair.negative.test(response)) {
        score -= 0.2; // Potential contradiction
      }
    });

    return Math.max(0, score);
  }

  private static assessSafety(response: string): number {
    let score = 0.8; // Base score

    // Critical safety patterns
    this.QUALITY_PATTERNS.forEach(pattern => {
      if (pattern.category === 'safety' && pattern.pattern.test(response)) {
        const penalty = pattern.severity === 'critical' ? 0.5 : 
                       pattern.severity === 'high' ? 0.3 : 0.1;
        score -= penalty;
      }
    });

    // Positive safety indicators
    let safetyCount = 0;
    this.MEDICAL_QUALITY_CRITERIA.safetyKeywords.forEach(keyword => {
      if (response.toLowerCase().includes(keyword)) safetyCount++;
    });
    
    if (safetyCount > 0) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  // 2. DETECCIÓN DE PROBLEMAS
  static detectIssues(response: string, sources: any[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Pattern-based issue detection
    this.QUALITY_PATTERNS.forEach(pattern => {
      const matches = response.match(pattern.pattern);
      if (matches) {
        issues.push({
          severity: pattern.severity,
          category: pattern.category as any,
          description: pattern.description,
          location: matches[0],
          suggestedFix: this.getSuggestedFix(pattern.category, matches[0])
        });
      }
    });

    // Source quality issues
    if (!sources || sources.length === 0) {
      issues.push({
        severity: 'high',
        category: 'evidence_quality',
        description: 'No se encontraron fuentes para respaldar la respuesta',
        location: 'Referencias',
        suggestedFix: 'Realizar búsqueda adicional en bases de datos médicas'
      });
    }

    // Response length issues
    const wordCount = response.split(/\s+/).length;
    if (wordCount < 50) {
      issues.push({
        severity: 'medium',
        category: 'completeness',
        description: 'Respuesta demasiado breve para consulta médica compleja',
        location: 'Longitud general',
        suggestedFix: 'Expandir con más detalles clínicos relevantes'
      });
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // 3. GENERACIÓN DE RECOMENDACIONES
  static generateRecommendations(metrics: QualityMetrics, issues: QualityIssue[]): QualityRecommendation[] {
    const recommendations: QualityRecommendation[] = [];

    // Based on metrics
    if (metrics.evidenceQuality < 0.6) {
      recommendations.push({
        priority: 'high',
        category: 'source_verification',
        action: 'Buscar fuentes adicionales en PubMed, Cochrane o guías clínicas',
        rationale: 'Calidad de evidencia insuficiente para recomendación médica confiable'
      });
    }

    if (metrics.clinicalAccuracy < 0.7) {
      recommendations.push({
        priority: 'high',
        category: 'clinical_validation',
        action: 'Revisar terminología médica y coherencia clínica',
        rationale: 'Precisión clínica por debajo del estándar aceptable'
      });
    }

    if (metrics.safetyScore < 0.8) {
      recommendations.push({
        priority: 'high',
        category: 'safety_check',
        action: 'Revisar lenguaje para evitar recomendaciones diagnósticas o terapéuticas directas',
        rationale: 'Riesgo de interpretación como consejo médico directo'
      });
    }

    // Based on issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'safety_check',
        action: 'Reescribir secciones que contengan afirmaciones médicas definitivas',
        rationale: 'Se detectaron patrones de alto riesgo que requieren corrección inmediata'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // 4. EVALUACIÓN COMPLETA
  static performQualityCheck(
    stepId: number, 
    stepTitle: string, 
    response: string, 
    sources: any[]
  ): QualityCheck {
    const metrics = this.evaluateResponse(response, sources);
    const issues = this.detectIssues(response, sources);
    const recommendations = this.generateRecommendations(metrics, issues);
    
    const approved = metrics.overallQuality >= 0.7 && 
                    !issues.some(i => i.severity === 'critical');

    return {
      checkId: `qa_${stepId}_${Date.now()}`,
      timestamp: new Date(),
      stepId,
      stepTitle,
      response,
      sources,
      metrics,
      issues,
      recommendations,
      approved
    };
  }

  // 5. UTILIDADES DE APOYO
  private static getSuggestedFix(category: string, match: string): string {
    const fixes = {
      safety: 'Reformular como información educativa sin emitir diagnóstico definitivo',
      medical_accuracy: 'Verificar con fuentes médicas primarias y agregar nivel de evidencia',
      evidence_quality: 'Citar fuentes de mayor autoridad médica (PubMed, guías clínicas)',
      completeness: 'Expandir con información clínica relevante adicional',
      consistency: 'Revisar y resolver aparentes contradicciones en el texto'
    };
    return fixes[category] || 'Revisar y corregir según mejores prácticas médicas';
  }

  // 6. INTEGRACIÓN CON SISTEMA EXISTENTE
  static formatQualityReport(check: QualityCheck): string {
    let report = `### REPORTE DE CALIDAD - ${check.stepTitle} ###\n\n`;
    
    report += `**Estado:** ${check.approved ? 'APROBADO' : 'REQUIERE REVISIÓN'}\n`;
    report += `**Calidad General:** ${(check.metrics.overallQuality * 100).toFixed(1)}%\n\n`;
    
    report += `**Métricas Detalladas:**\n`;
    report += `- Precisión Clínica: ${(check.metrics.clinicalAccuracy * 100).toFixed(1)}%\n`;
    report += `- Calidad de Evidencia: ${(check.metrics.evidenceQuality * 100).toFixed(1)}%\n`;
    report += `- Completitud: ${(check.metrics.responseCompleteness * 100).toFixed(1)}%\n`;
    report += `- Seguridad: ${(check.metrics.safetyScore * 100).toFixed(1)}%\n\n`;

    if (check.issues.length > 0) {
      report += `**Problemas Identificados:**\n`;
      check.issues.forEach((issue, index) => {
        const icon = issue.severity === 'critical' ? 'CRITICO' : 
                    issue.severity === 'high' ? 'ALTO' : 
                    issue.severity === 'medium' ? 'MEDIO' : 'INFO';
        report += `${index + 1}. [${icon}] ${issue.description}\n`;
        report += `   Ubicación: ${issue.location}\n`;
        report += `   Solución: ${issue.suggestedFix}\n\n`;
      });
    }

    if (check.recommendations.length > 0) {
      report += `**Recomendaciones de Mejora:**\n`;
      check.recommendations.forEach((rec, index) => {
        const icon = rec.priority === 'high' ? '🔴' : 
                    rec.priority === 'medium' ? '🟡' : '🟢';
        report += `${index + 1}. ${icon} ${rec.action}\n`;
        report += `   Razón: ${rec.rationale}\n\n`;
      });
    }

    return report;
  }

  static shouldRequestRevision(check: QualityCheck): boolean {
    return !check.approved || 
           check.metrics.overallQuality < 0.7 ||
           check.issues.some(i => i.severity === 'critical' || i.severity === 'high');
  }
}