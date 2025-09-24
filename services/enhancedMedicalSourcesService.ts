// Enhanced Medical Sources Service - Integración de múltiples fuentes médicas
// Combina PubMed API, Google Search y otras fuentes para máxima cobertura

import { pubmedAPI, PubMedSearchResult, PubMedSearchParams } from './pubmedAPIService';
import { generateContent } from './geminiService';

export interface EnhancedSource {
  id: string;
  title: string;
  url: string;
  abstract?: string;
  authors?: string[];
  journal?: string;
  publicationDate?: string;
  doi?: string;
  sourceType: 'pubmed' | 'google' | 'cochrane' | 'clinical_trials' | 'other';
  qualityScore: number;
  relevanceScore: number;
  authorityScore: number;
  isOpenAccess: boolean;
  meshTerms?: string[];
  keywords?: string[];
}

export interface EnhancedSearchResult {
  sources: EnhancedSource[];
  totalCount: number;
  searchQuery: string;
  searchTime: number;
  sourcesBreakdown: {
    pubmed: number;
    google: number;
    cochrane: number;
    clinical_trials: number;
    other: number;
  };
  qualityMetrics: {
    averageQuality: number;
    highQualityCount: number;
    openAccessCount: number;
    recentPublications: number;
  };
}

export interface MedicalSearchParams {
  query: string;
  maxResults?: number;
  includeAbstract?: boolean;
  articleTypes?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  language?: string;
  prioritizeRecent?: boolean;
  requireOpenAccess?: boolean;
}

export class EnhancedMedicalSourcesService {
  private static instance: EnhancedMedicalSourcesService;
  
  private constructor() {}
  
  static getInstance(): EnhancedMedicalSourcesService {
    if (!EnhancedMedicalSourcesService.instance) {
      EnhancedMedicalSourcesService.instance = new EnhancedMedicalSourcesService();
    }
    return EnhancedMedicalSourcesService.instance;
  }

  /**
   * Búsqueda integrada en múltiples fuentes médicas
   */
  async searchMedicalSources(params: MedicalSearchParams): Promise<EnhancedSearchResult> {
    console.log(`🔍 Enhanced medical search: "${params.query}"`);
    
    const startTime = Date.now();
    const maxResults = params.maxResults || 25;
    
    try {
      // Ejecutar búsquedas en paralelo
      const [pubmedResults, googleResults] = await Promise.allSettled([
        this.searchPubMed(params, Math.ceil(maxResults * 0.6)), // 60% PubMed
        this.searchGoogle(params, Math.ceil(maxResults * 0.4))   // 40% Google
      ]);

      // Procesar resultados
      const allSources: EnhancedSource[] = [];
      
      if (pubmedResults.status === 'fulfilled') {
        allSources.push(...this.convertPubMedToEnhancedSources(pubmedResults.value));
      }
      
      if (googleResults.status === 'fulfilled') {
        allSources.push(...this.convertGoogleToEnhancedSources(googleResults.value));
      }

      // Ordenar y filtrar por calidad
      const sortedSources = this.rankAndFilterSources(allSources, params);
      
      // Calcular métricas de calidad
      const qualityMetrics = this.calculateQualityMetrics(sortedSources);
      
      // Contar fuentes por tipo
      const sourcesBreakdown = this.calculateSourcesBreakdown(sortedSources);

      const result: EnhancedSearchResult = {
        sources: sortedSources.slice(0, maxResults),
        totalCount: sortedSources.length,
        searchQuery: params.query,
        searchTime: Date.now() - startTime,
        sourcesBreakdown,
        qualityMetrics
      };

      console.log(`✅ Enhanced search completed: ${result.sources.length} sources in ${result.searchTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Enhanced medical search failed:', error);
      throw new Error(`Medical sources search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Buscar en PubMed
   */
  private async searchPubMed(params: MedicalSearchParams, maxResults: number): Promise<PubMedSearchResult> {
    const pubmedParams: PubMedSearchParams = {
      query: params.query,
      maxResults,
      includeAbstract: params.includeAbstract,
      articleType: params.articleTypes,
      language: params.language,
      startDate: params.dateRange?.start,
      endDate: params.dateRange?.end
    };

    return pubmedAPI.searchArticles(pubmedParams);
  }

  /**
   * Buscar en Google (fuente existente)
   */
  private async searchGoogle(params: MedicalSearchParams, maxResults: number): Promise<any> {
    // Usar el servicio existente de Gemini con búsqueda
    const prompt = this.createGoogleSearchPrompt(params.query, maxResults);
    const result = await generateContent(prompt, true, params.query);
    
    return {
      sources: result.sources || [],
      totalCount: result.sources?.length || 0
    };
  }

  /**
   * Convertir resultados de PubMed a formato unificado
   */
  private convertPubMedToEnhancedSources(pubmedResult: PubMedSearchResult): EnhancedSource[] {
    return pubmedResult.articles.map(article => ({
      id: `pubmed_${article.pmid}`,
      title: article.title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      abstract: article.abstract,
      authors: article.authors,
      journal: article.journal,
      publicationDate: article.publicationDate,
      doi: article.doi,
      sourceType: 'pubmed' as const,
      qualityScore: this.calculatePubMedQualityScore(article),
      relevanceScore: this.calculateRelevanceScore(article.title, article.abstract, pubmedResult.searchQuery),
      authorityScore: this.calculateAuthorityScore(article.journal, article.meshTerms),
      isOpenAccess: !!article.pmc,
      meshTerms: article.meshTerms,
      keywords: article.keywords
    }));
  }

  /**
   * Convertir resultados de Google a formato unificado
   */
  private convertGoogleToEnhancedSources(googleResult: any): EnhancedSource[] {
    if (!googleResult.sources) return [];
    
    return googleResult.sources.map((source: any, index: number) => ({
      id: `google_${index}`,
      title: source.web?.title || 'Sin título',
      url: source.web?.uri || '',
      sourceType: this.detectGoogleSourceType(source.web?.uri || ''),
      qualityScore: this.calculateGoogleQualityScore(source),
      relevanceScore: this.calculateRelevanceScore(source.web?.title || '', '', googleResult.searchQuery),
      authorityScore: this.calculateGoogleAuthorityScore(source.web?.uri || ''),
      isOpenAccess: this.isOpenAccessURL(source.web?.uri || '')
    }));
  }

  /**
   * Calcular puntuación de calidad para artículos de PubMed
   */
  private calculatePubMedQualityScore(article: any): number {
    let score = 50; // Base score
    
    // Factores positivos
    if (article.abstract && article.abstract.length > 200) score += 10;
    if (article.meshTerms && article.meshTerms.length > 3) score += 10;
    if (article.doi) score += 5;
    if (article.pmc) score += 15; // Open access
    if (article.authors && article.authors.length > 0) score += 5;
    
    // Factores de revista
    const journal = article.journal?.toLowerCase() || '';
    if (journal.includes('nature') || journal.includes('science')) score += 20;
    else if (journal.includes('lancet') || journal.includes('nejm')) score += 15;
    else if (journal.includes('jama') || journal.includes('bmj')) score += 10;
    else if (journal.includes('ophthalmology') || journal.includes('retina')) score += 8;
    
    // Tipo de publicación
    if (article.publicationType?.includes('Review')) score += 10;
    if (article.publicationType?.includes('Meta-Analysis')) score += 15;
    if (article.publicationType?.includes('Clinical Trial')) score += 8;
    
    return Math.min(score, 100);
  }

  /**
   * Calcular puntuación de calidad para fuentes de Google
   */
  private calculateGoogleQualityScore(source: any): number {
    let score = 30; // Base score más baja para Google
    
    const url = source.web?.uri || '';
    const title = source.web?.title || '';
    
    // Factores positivos
    if (url.includes('pubmed')) score += 20;
    else if (url.includes('cochrane')) score += 25;
    else if (url.includes('uptodate')) score += 30;
    else if (url.includes('aao.org')) score += 25;
    else if (url.includes('esrs.org')) score += 20;
    else if (url.includes('nejm.org') || url.includes('jama')) score += 15;
    
    // Factores negativos
    if (url.includes('wikipedia')) score -= 10;
    if (url.includes('webmd')) score -= 5;
    if (url.includes('mayoclinic')) score += 5;
    
    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Calcular puntuación de relevancia
   */
  private calculateRelevanceScore(title: string, abstract: string, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const text = `${title} ${abstract}`.toLowerCase();
    
    let matches = 0;
    queryWords.forEach(word => {
      if (text.includes(word)) matches++;
    });
    
    return Math.min((matches / queryWords.length) * 100, 100);
  }

  /**
   * Calcular puntuación de autoridad
   */
  private calculateAuthorityScore(journal: string, meshTerms: string[]): number {
    let score = 50;
    
    // Revistas de alta autoridad
    const highAuthorityJournals = [
      'nature', 'science', 'lancet', 'nejm', 'jama', 'bmj',
      'ophthalmology', 'retina', 'cornea', 'investigative ophthalmology'
    ];
    
    const journalLower = journal?.toLowerCase() || '';
    if (highAuthorityJournals.some(auth => journalLower.includes(auth))) {
      score += 30;
    }
    
    // MeSH terms relevantes
    if (meshTerms && meshTerms.length > 0) {
      score += Math.min(meshTerms.length * 2, 20);
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calcular puntuación de autoridad para Google
   */
  private calculateGoogleAuthorityScore(url: string): number {
    const authorityDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'cochrane.org',
      'uptodate.com',
      'aao.org',
      'esrs.org',
      'nejm.org',
      'jamanetwork.com',
      'nature.com',
      'science.org'
    ];
    
    for (const domain of authorityDomains) {
      if (url.includes(domain)) {
        return 80 + Math.random() * 20; // 80-100
      }
    }
    
    return 30 + Math.random() * 40; // 30-70
  }

  /**
   * Detectar tipo de fuente de Google
   */
  private detectGoogleSourceType(url: string): 'pubmed' | 'cochrane' | 'clinical_trials' | 'google' | 'other' {
    if (url.includes('pubmed')) return 'pubmed';
    if (url.includes('cochrane')) return 'cochrane';
    if (url.includes('clinicaltrials.gov')) return 'clinical_trials';
    return 'google';
  }

  /**
   * Verificar si es acceso abierto
   */
  private isOpenAccessURL(url: string): boolean {
    const openAccessDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'cochrane.org',
      'plos.org',
      'bmc.com',
      'frontiersin.org',
      'nature.com/articles'
    ];
    
    return openAccessDomains.some(domain => url.includes(domain));
  }

  /**
   * Crear prompt para búsqueda en Google
   */
  private createGoogleSearchPrompt(query: string, maxResults: number): string {
    return `Busca información médica sobre: "${query}"

Prioriza fuentes de alta calidad médica como:
- PubMed Central
- Cochrane Library  
- Guías clínicas oficiales (AAO, ESCRS)
- Revistas médicas especializadas
- ClinicalTrials.gov

Enfócate en oftalmología y medicina basada en evidencia.
Máximo ${maxResults} resultados.`;
  }

  /**
   * Ordenar y filtrar fuentes por calidad
   */
  private rankAndFilterSources(sources: EnhancedSource[], params: MedicalSearchParams): EnhancedSource[] {
    return sources
      .filter(source => {
        // Filtros básicos
        if (params.requireOpenAccess && !source.isOpenAccess) return false;
        if (source.qualityScore < 30) return false;
        return true;
      })
      .sort((a, b) => {
        // Ordenar por puntuación combinada
        const scoreA = (a.qualityScore * 0.4) + (a.relevanceScore * 0.4) + (a.authorityScore * 0.2);
        const scoreB = (b.qualityScore * 0.4) + (b.relevanceScore * 0.4) + (b.authorityScore * 0.2);
        return scoreB - scoreA;
      });
  }

  /**
   * Calcular métricas de calidad
   */
  private calculateQualityMetrics(sources: EnhancedSource[]): any {
    const totalSources = sources.length;
    if (totalSources === 0) {
      return {
        averageQuality: 0,
        highQualityCount: 0,
        openAccessCount: 0,
        recentPublications: 0
      };
    }

    const averageQuality = sources.reduce((sum, s) => sum + s.qualityScore, 0) / totalSources;
    const highQualityCount = sources.filter(s => s.qualityScore >= 70).length;
    const openAccessCount = sources.filter(s => s.isOpenAccess).length;
    
    // Contar publicaciones recientes (últimos 5 años)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const recentPublications = sources.filter(s => {
      if (!s.publicationDate) return false;
      return new Date(s.publicationDate) > fiveYearsAgo;
    }).length;

    return {
      averageQuality: Math.round(averageQuality),
      highQualityCount,
      openAccessCount,
      recentPublications
    };
  }

  /**
   * Calcular desglose de fuentes
   */
  private calculateSourcesBreakdown(sources: EnhancedSource[]): any {
    const breakdown = {
      pubmed: 0,
      google: 0,
      cochrane: 0,
      clinical_trials: 0,
      other: 0
    };

    sources.forEach(source => {
      breakdown[source.sourceType]++;
    });

    return breakdown;
  }

  /**
   * Buscar revisiones sistemáticas específicamente
   */
  async searchSystematicReviews(query: string, maxResults: number = 15): Promise<EnhancedSearchResult> {
    const params: MedicalSearchParams = {
      query,
      maxResults,
      articleTypes: ['review', 'meta_analysis'],
      includeAbstract: true,
      prioritizeRecent: true
    };

    return this.searchMedicalSources(params);
  }

  /**
   * Buscar ensayos clínicos
   */
  async searchClinicalTrials(query: string, maxResults: number = 20): Promise<EnhancedSearchResult> {
    const params: MedicalSearchParams = {
      query,
      maxResults,
      articleTypes: ['clinical_trial'],
      includeAbstract: true,
      prioritizeRecent: true
    };

    return this.searchMedicalSources(params);
  }

  /**
   * Limpiar caché de todas las fuentes
   */
  clearAllCaches(): void {
    pubmedAPI.clearCache();
  }
}

// Instancia singleton
export const enhancedMedicalSources = EnhancedMedicalSourcesService.getInstance();
