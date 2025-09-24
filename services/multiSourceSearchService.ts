// Multi-Source Search Service - Orquestador de búsquedas en múltiples APIs académicas
// Integra PubMed, Europe PMC, Crossref, Semantic Scholar y Google para máxima cobertura

import { pubmedAPI, PubMedSearchParams, PubMedArticle } from './pubmedAPIService';
import { europePMC, EuropePMCSearchParams, EuropePMCArticle } from './europePMCService';
import { crossref, CrossrefSearchParams, CrossrefWork } from './crossrefService';
import { semanticScholar, SemanticScholarSearchParams, SemanticScholarPaper } from './semanticScholarService';
import { generateContent } from './geminiService';

export interface UnifiedSource {
  id: string;
  type: 'pubmed' | 'europepmc' | 'crossref' | 'semantic_scholar' | 'google';
  title: string;
  authors: string[];
  journal?: string;
  publicationDate: string;
  doi?: string;
  pmid?: string;
  url: string;
  abstract?: string;
  tldr?: string; // AI-generated summary from Semantic Scholar
  citationCount: number;
  isOpenAccess: boolean;
  qualityScore: number;
  relevanceScore: number;
  authorityScore: number;
  impactScore: number;
  keywords: string[];
  meshTerms?: string[];
  fullTextUrl?: string;
  pdfUrl?: string;
  license?: string;
  affiliations: string[];
  publicationType: string[];
}

export interface MultiSourceSearchResult {
  sources: UnifiedSource[];
  totalFound: number;
  searchQuery: string;
  searchTime: number;
  sourceBreakdown: {
    pubmed: number;
    europepmc: number;
    crossref: number;
    semantic_scholar: number;
    google: number;
  };
  qualityMetrics: {
    averageQuality: number;
    highQualityCount: number;
    openAccessCount: number;
    withAbstractCount: number;
    recentPublications: number;
    averageCitations: number;
  };
  duplicatesRemoved: number;
  searchStrategies: string[];
}

export interface MultiSourceSearchParams {
  query: string;
  maxResultsPerSource?: number;
  maxTotalResults?: number;
  includeAbstracts?: boolean;
  onlyOpenAccess?: boolean;
  onlyRecent?: boolean; // Last 5 years
  minQualityScore?: number;
  prioritizeSources?: ('pubmed' | 'europepmc' | 'crossref' | 'semantic_scholar' | 'google')[];
  enableDeduplication?: boolean;
  sortBy?: 'relevance' | 'quality' | 'citations' | 'date';
}

export class MultiSourceSearchService {
  private static instance: MultiSourceSearchService;

  private constructor() {}

  static getInstance(): MultiSourceSearchService {
    if (!MultiSourceSearchService.instance) {
      MultiSourceSearchService.instance = new MultiSourceSearchService();
    }
    return MultiSourceSearchService.instance;
  }

  /**
   * Búsqueda unificada en todas las fuentes
   */
  async searchAllSources(params: MultiSourceSearchParams): Promise<MultiSourceSearchResult> {
    const startTime = Date.now();
    console.log(`🔍 Multi-source search: "${params.query}"`);

    const maxPerSource = params.maxResultsPerSource || 15;
    const strategies: string[] = [];

    try {
      // Definir fuentes activas
      const activeSources = params.prioritizeSources || ['pubmed', 'europepmc', 'semantic_scholar', 'crossref', 'google'];

      // Ejecutar búsquedas en paralelo
      const searchPromises = activeSources.map(source => {
        switch (source) {
          case 'pubmed':
            strategies.push('PubMed MEDLINE database search');
            return this.searchPubMed(params, maxPerSource);
          case 'europepmc':
            strategies.push('Europe PMC comprehensive biomedical search');
            return this.searchEuropePMC(params, maxPerSource);
          case 'crossref':
            strategies.push('Crossref DOI registry search');
            return this.searchCrossref(params, maxPerSource);
          case 'semantic_scholar':
            strategies.push('Semantic Scholar AI-powered search');
            return this.searchSemanticScholar(params, maxPerSource);
          case 'google':
            strategies.push('Google Scholar via Gemini search');
            return this.searchGoogle(params, maxPerSource);
          default:
            return Promise.resolve([]);
        }
      });

      const results = await Promise.allSettled(searchPromises);

      // Combinar resultados
      const allSources: UnifiedSource[] = [];
      const sourceBreakdown = {
        pubmed: 0,
        europepmc: 0,
        crossref: 0,
        semantic_scholar: 0,
        google: 0
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const sourceType = activeSources[index];
          const sources = result.value as UnifiedSource[];
          allSources.push(...sources);
          sourceBreakdown[sourceType] = sources.length;
          console.log(`✅ ${sourceType}: ${sources.length} results`);
        } else {
          const sourceType = activeSources[index];
          console.warn(`❌ ${sourceType}: search failed`);
        }
      });

      console.log(`📊 Total sources before processing: ${allSources.length}`);

      // Procesar y optimizar resultados
      let processedSources = allSources;

      // Deduplicación
      let duplicatesRemoved = 0;
      if (params.enableDeduplication !== false) {
        const beforeDedup = processedSources.length;
        processedSources = this.deduplicateSources(processedSources);
        duplicatesRemoved = beforeDedup - processedSources.length;
        console.log(`🔄 Removed ${duplicatesRemoved} duplicates`);
      }

      // Filtros de calidad
      if (params.minQualityScore) {
        processedSources = processedSources.filter(s => s.qualityScore >= params.minQualityScore!);
      }

      if (params.onlyOpenAccess) {
        processedSources = processedSources.filter(s => s.isOpenAccess);
      }

      if (params.onlyRecent) {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        processedSources = processedSources.filter(s => {
          const pubDate = new Date(s.publicationDate);
          return pubDate > fiveYearsAgo;
        });
      }

      // Ordenamiento
      processedSources = this.sortSources(processedSources, params.sortBy || 'relevance');

      // Limitar resultados finales
      const maxTotal = params.maxTotalResults || 50;
      const finalSources = processedSources.slice(0, maxTotal);

      // Calcular métricas
      const qualityMetrics = this.calculateQualityMetrics(finalSources);

      const result: MultiSourceSearchResult = {
        sources: finalSources,
        totalFound: allSources.length,
        searchQuery: params.query,
        searchTime: Date.now() - startTime,
        sourceBreakdown,
        qualityMetrics,
        duplicatesRemoved,
        searchStrategies: strategies
      };

      console.log(`✅ Multi-source search completed: ${finalSources.length} final sources in ${result.searchTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Multi-source search failed:', error);
      throw new Error(`Multi-source search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Búsqueda en PubMed
   */
  private async searchPubMed(params: MultiSourceSearchParams, maxResults: number): Promise<UnifiedSource[]> {
    try {
      const pubmedParams: PubMedSearchParams = {
        query: params.query,
        maxResults,
        includeAbstract: params.includeAbstracts !== false,
        sortBy: 'relevance'
      };

      const result = await pubmedAPI.searchArticles(pubmedParams);
      return result.articles.map(article => this.convertPubMedToUnified(article));
    } catch (error) {
      console.warn('PubMed search failed:', error);
      return [];
    }
  }

  /**
   * Búsqueda en Europe PMC
   */
  private async searchEuropePMC(params: MultiSourceSearchParams, maxResults: number): Promise<UnifiedSource[]> {
    try {
      const pmcParams: EuropePMCSearchParams = {
        query: params.query,
        maxResults,
        includeFullText: params.includeAbstracts !== false,
        onlyOpenAccess: params.onlyOpenAccess,
        sortBy: 'relevance'
      };

      const result = await europePMC.searchArticles(pmcParams);
      return result.articles.map(article => this.convertEuropePMCToUnified(article));
    } catch (error) {
      console.warn('Europe PMC search failed:', error);
      return [];
    }
  }

  /**
   * Búsqueda en Crossref
   */
  private async searchCrossref(params: MultiSourceSearchParams, maxResults: number): Promise<UnifiedSource[]> {
    try {
      const crossrefParams: CrossrefSearchParams = {
        query: params.query,
        maxResults,
        hasAbstract: params.includeAbstracts !== false,
        sortBy: 'relevance'
      };

      const result = await crossref.searchWorks(crossrefParams);
      return result.works.map(work => this.convertCrossrefToUnified(work));
    } catch (error) {
      console.warn('Crossref search failed:', error);
      return [];
    }
  }

  /**
   * Búsqueda en Semantic Scholar
   */
  private async searchSemanticScholar(params: MultiSourceSearchParams, maxResults: number): Promise<UnifiedSource[]> {
    try {
      const ssParams: SemanticScholarSearchParams = {
        query: params.query,
        limit: maxResults,
        openAccessPdf: params.onlyOpenAccess,
        sort: 'relevance',
        fieldsOfStudy: ['Medicine', 'Biology']
      };

      const result = await semanticScholar.searchPapers(ssParams);
      return result.papers.map(paper => this.convertSemanticScholarToUnified(paper));
    } catch (error) {
      console.warn('Semantic Scholar search failed:', error);
      return [];
    }
  }

  /**
   * Búsqueda en Google via Gemini
   */
  private async searchGoogle(params: MultiSourceSearchParams, maxResults: number): Promise<UnifiedSource[]> {
    try {
      const prompt = `Busca información médica académica sobre: "${params.query}"

Prioriza fuentes de alta calidad médica:
- PubMed Central
- Revistas médicas especializadas en oftalmología
- Guías clínicas oficiales
- Cochrane Library

Enfócate en evidencia médica basada en investigación.
Máximo ${maxResults} resultados de calidad.`;

      const result = await generateContent(prompt, true);

      if (!result.sources || result.sources.length === 0) {
        return [];
      }

      return result.sources.map((source, index) => this.convertGoogleToUnified(source, index));
    } catch (error) {
      console.warn('Google search failed:', error);
      return [];
    }
  }

  // Métodos de conversión a formato unificado
  private convertPubMedToUnified(article: PubMedArticle): UnifiedSource {
    return {
      id: `pubmed_${article.pmid}`,
      type: 'pubmed',
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      publicationDate: article.publicationDate,
      doi: article.doi,
      pmid: article.pmid,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      abstract: article.abstract,
      citationCount: article.citationCount || 0,
      isOpenAccess: !!article.pmc,
      qualityScore: this.calculatePubMedQuality(article),
      relevanceScore: 75, // Base score
      authorityScore: 85, // PubMed has high authority
      impactScore: article.citationCount || 0,
      keywords: article.keywords,
      meshTerms: article.meshTerms,
      affiliations: article.affiliation,
      publicationType: article.publicationType
    };
  }

  private convertEuropePMCToUnified(article: EuropePMCArticle): UnifiedSource {
    return {
      id: `europepmc_${article.id}`,
      type: 'europepmc',
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      publicationDate: article.publicationDate,
      doi: article.doi,
      pmid: article.pmid,
      url: article.fullTextUrl || `https://europepmc.org/article/MED/${article.pmid}`,
      abstract: article.abstract,
      citationCount: article.citationCount,
      isOpenAccess: article.isOpenAccess,
      qualityScore: this.calculateEuropePMCQuality(article),
      relevanceScore: 80, // Higher base score due to full text
      authorityScore: 80,
      impactScore: article.citationCount,
      keywords: article.keywords,
      meshTerms: article.meshTerms,
      fullTextUrl: article.fullTextUrl,
      pdfUrl: article.pdfUrl,
      affiliations: article.affiliation,
      publicationType: article.publicationType
    };
  }

  private convertCrossrefToUnified(work: CrossrefWork): UnifiedSource {
    return {
      id: `crossref_${work.doi}`,
      type: 'crossref',
      title: work.title.join(' '),
      authors: work.authors.map(a => `${a.given || ''} ${a.family || ''}`).filter(Boolean),
      journal: work.journal,
      publicationDate: work.publicationDate,
      doi: work.doi,
      url: work.url,
      citationCount: work.citedByCount,
      isOpenAccess: work.isOpenAccess,
      qualityScore: this.calculateCrossrefQuality(work),
      relevanceScore: 70,
      authorityScore: 75,
      impactScore: work.citedByCount,
      keywords: work.subjectAreas,
      license: work.license?.[0]?.url,
      affiliations: work.affiliations,
      publicationType: [work.type]
    };
  }

  private convertSemanticScholarToUnified(paper: SemanticScholarPaper): UnifiedSource {
    return {
      id: `ss_${paper.paperId}`,
      type: 'semantic_scholar',
      title: paper.title,
      authors: paper.authors.map(a => a.name),
      journal: paper.journal,
      publicationDate: paper.publicationDate || `${paper.year}-01-01`,
      doi: paper.doi,
      pmid: paper.pmid,
      url: paper.url,
      abstract: paper.abstract,
      tldr: paper.tldr,
      citationCount: paper.citationCount,
      isOpenAccess: paper.isOpenAccess,
      qualityScore: this.calculateSemanticScholarQuality(paper),
      relevanceScore: 85, // AI-powered relevance
      authorityScore: 70,
      impactScore: paper.influentialCitationCount * 2, // Weight influential citations more
      keywords: paper.fieldsOfStudy,
      fullTextUrl: paper.openAccessPdf?.url,
      affiliations: paper.authors.flatMap(a => a.affiliations || []),
      publicationType: paper.publicationTypes
    };
  }

  private convertGoogleToUnified(source: any, index: number): UnifiedSource {
    return {
      id: `google_${index}`,
      type: 'google',
      title: source.web?.title || 'Sin título',
      authors: [], // Google doesn't provide detailed author info
      publicationDate: new Date().toISOString().split('T')[0],
      url: source.web?.uri || '',
      citationCount: 0,
      isOpenAccess: this.isOpenAccessURL(source.web?.uri || ''),
      qualityScore: this.calculateGoogleQuality(source),
      relevanceScore: 60,
      authorityScore: this.calculateGoogleAuthority(source.web?.uri || ''),
      impactScore: 0,
      keywords: [],
      affiliations: [],
      publicationType: ['web']
    };
  }

  // Métodos de cálculo de calidad
  private calculatePubMedQuality(article: PubMedArticle): number {
    let score = 70; // Base score
    if (article.abstract) score += 15;
    if (article.meshTerms.length > 3) score += 10;
    if (article.doi) score += 5;
    return Math.min(score, 100);
  }

  private calculateEuropePMCQuality(article: EuropePMCArticle): number {
    let score = 75; // Higher base for Europe PMC
    if (article.abstract) score += 10;
    if (article.isOpenAccess) score += 10;
    if (article.hasFullText) score += 5;
    return Math.min(score, 100);
  }

  private calculateCrossrefQuality(work: CrossrefWork): number {
    let score = 65; // Base score
    if (work.citedByCount > 10) score += 15;
    if (work.isOpenAccess) score += 10;
    if (work.license && work.license.length > 0) score += 5;
    if (work.referencesCount > 20) score += 5;
    return Math.min(score, 100);
  }

  private calculateSemanticScholarQuality(paper: SemanticScholarPaper): number {
    let score = 70; // Base score
    if (paper.abstract) score += 10;
    if (paper.tldr) score += 5; // AI summary available
    if (paper.influentialCitationCount > 5) score += 10;
    if (paper.isOpenAccess) score += 5;
    return Math.min(score, 100);
  }

  private calculateGoogleQuality(source: any): number {
    const url = source.web?.uri || '';
    let score = 30; // Lower base for Google results

    if (url.includes('pubmed')) score += 25;
    else if (url.includes('cochrane')) score += 30;
    else if (url.includes('aao.org')) score += 25;
    else if (url.includes('nejm')) score += 20;

    return Math.min(score, 100);
  }

  private calculateGoogleAuthority(url: string): number {
    const authorityDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'cochrane.org',
      'aao.org',
      'nejm.org',
      'jamanetwork.com'
    ];

    for (const domain of authorityDomains) {
      if (url.includes(domain)) {
        return 85;
      }
    }

    return 40;
  }

  private isOpenAccessURL(url: string): boolean {
    const openAccessDomains = [
      'pubmed.ncbi.nlm.nih.gov',
      'cochrane.org',
      'plos.org',
      'frontiersin.org'
    ];

    return openAccessDomains.some(domain => url.includes(domain));
  }

  /**
   * Deduplicación de fuentes
   */
  private deduplicateSources(sources: UnifiedSource[]): UnifiedSource[] {
    const seen = new Set<string>();
    const deduplicated: UnifiedSource[] = [];

    for (const source of sources) {
      // Generar claves de deduplicación
      const keys = [
        source.doi?.toLowerCase(),
        source.pmid,
        this.normalizeTitle(source.title)
      ].filter(Boolean);

      let isDuplicate = false;
      for (const key of keys) {
        if (seen.has(key)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        keys.forEach(key => seen.add(key));
        deduplicated.push(source);
      }
    }

    return deduplicated;
  }

  /**
   * Normalizar título para deduplicación
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50); // Usar solo los primeros 50 caracteres
  }

  /**
   * Ordenamiento de fuentes
   */
  private sortSources(sources: UnifiedSource[], sortBy: string): UnifiedSource[] {
    return sources.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.qualityScore - a.qualityScore;
        case 'citations':
          return b.citationCount - a.citationCount;
        case 'date':
          return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime();
        case 'relevance':
        default:
          // Puntuación combinada para relevancia
          const scoreA = (a.relevanceScore * 0.4) + (a.qualityScore * 0.3) + (a.authorityScore * 0.3);
          const scoreB = (b.relevanceScore * 0.4) + (b.qualityScore * 0.3) + (b.authorityScore * 0.3);
          return scoreB - scoreA;
      }
    });
  }

  /**
   * Calcular métricas de calidad
   */
  private calculateQualityMetrics(sources: UnifiedSource[]): any {
    if (sources.length === 0) {
      return {
        averageQuality: 0,
        highQualityCount: 0,
        openAccessCount: 0,
        withAbstractCount: 0,
        recentPublications: 0,
        averageCitations: 0
      };
    }

    const averageQuality = sources.reduce((sum, s) => sum + s.qualityScore, 0) / sources.length;
    const highQualityCount = sources.filter(s => s.qualityScore >= 80).length;
    const openAccessCount = sources.filter(s => s.isOpenAccess).length;
    const withAbstractCount = sources.filter(s => !!s.abstract).length;

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const recentPublications = sources.filter(s => {
      return new Date(s.publicationDate) > fiveYearsAgo;
    }).length;

    const averageCitations = sources.reduce((sum, s) => sum + s.citationCount, 0) / sources.length;

    return {
      averageQuality: Math.round(averageQuality),
      highQualityCount,
      openAccessCount,
      withAbstractCount,
      recentPublications,
      averageCitations: Math.round(averageCitations)
    };
  }

  /**
   * Búsqueda especializada en revisiones sistemáticas
   */
  async searchSystematicReviews(query: string): Promise<MultiSourceSearchResult> {
    const params: MultiSourceSearchParams = {
      query: query + ' systematic review OR meta-analysis',
      maxResultsPerSource: 10,
      includeAbstracts: true,
      sortBy: 'citations',
      prioritizeSources: ['pubmed', 'cochrane', 'europepmc', 'crossref']
    };

    return this.searchAllSources(params);
  }

  /**
   * Búsqueda de alta calidad (solo fuentes premium)
   */
  async searchHighQuality(query: string): Promise<MultiSourceSearchResult> {
    const params: MultiSourceSearchParams = {
      query,
      maxResultsPerSource: 15,
      minQualityScore: 75,
      includeAbstracts: true,
      sortBy: 'quality',
      prioritizeSources: ['pubmed', 'europepmc', 'semantic_scholar']
    };

    return this.searchAllSources(params);
  }

  /**
   * Limpiar todos los caches
   */
  clearAllCaches(): void {
    pubmedAPI.clearCache();
    europePMC.clearCache();
    crossref.clearCache();
    semanticScholar.clearCache();
  }
}

// Instancia singleton
export const multiSourceSearch = MultiSourceSearchService.getInstance();