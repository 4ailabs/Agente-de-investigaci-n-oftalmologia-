// Semantic Scholar API Service - Búsqueda de literatura científica con análisis semántico por IA
// API gratuita con 200M+ papers y análisis de impacto, recomendaciones y citas

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  authors: SemanticScholarAuthor[];
  journal: string;
  venue: string;
  year: number;
  publicationDate?: string;
  abstract?: string;
  tldr?: string; // Auto-generated summary
  url: string;
  doi?: string;
  arxivId?: string;
  pmid?: string;
  citationCount: number;
  referenceCount: number;
  influentialCitationCount: number;
  fieldsOfStudy: string[];
  openAccessPdf?: SemanticScholarPDF;
  isOpenAccess: boolean;
  publicationTypes: string[];
  publicationVenue?: SemanticScholarVenue;
  citations: SemanticScholarCitation[];
  references: SemanticScholarReference[];
  embedding?: number[]; // Paper embedding vector
  s2FieldsOfStudy: SemanticScholarField[];
}

export interface SemanticScholarAuthor {
  authorId: string;
  name: string;
  affiliations?: string[];
  homepage?: string;
  paperCount?: number;
  citationCount?: number;
  hIndex?: number;
}

export interface SemanticScholarPDF {
  url: string;
  status: string;
}

export interface SemanticScholarVenue {
  id: string;
  name: string;
  type: string;
  alternate_names?: string[];
  issn?: string;
  isbn?: string;
  url?: string;
}

export interface SemanticScholarCitation {
  paperId: string;
  title: string;
  authors: SemanticScholarAuthor[];
  year?: number;
  contexts: string[]; // Context where this paper cites the current paper
  isInfluential: boolean;
}

export interface SemanticScholarReference {
  paperId: string;
  title: string;
  authors: SemanticScholarAuthor[];
  year?: number;
  contexts: string[];
  isInfluential: boolean;
}

export interface SemanticScholarField {
  category: string;
  source: string;
}

export interface SemanticScholarSearchResult {
  papers: SemanticScholarPaper[];
  total: number;
  offset: number;
  next?: number;
  searchQuery: string;
  searchTime: number;
}

export interface SemanticScholarSearchParams {
  query: string;
  limit?: number;
  offset?: number;
  fields?: string[];
  year?: string; // Format: '2019-2023' or '2020'
  venue?: string[];
  fieldsOfStudy?: string[];
  minCitationCount?: number;
  publicationTypes?: string[];
  openAccessPdf?: boolean;
  sort?: 'relevance' | 'citationCount' | 'publicationDate';
}

export interface SemanticScholarRecommendations {
  recommendedPapers: SemanticScholarPaper[];
  fromPaper: string;
  reason: string;
}

export class SemanticScholarService {
  private static readonly BASE_URL = 'https://api.semanticscholar.org/graph/v1';
  private static readonly SEARCH_ENDPOINT = 'paper/search';
  private static readonly PAPER_ENDPOINT = 'paper';
  private static readonly RECOMMENDATIONS_ENDPOINT = 'recommendations';
  private static readonly AUTHOR_ENDPOINT = 'author';

  // No requiere API key para uso básico, pero permite más requests con key
  private apiKey?: string;

  // Cache para evitar llamadas repetidas
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Buscar papers en Semantic Scholar
   */
  async searchPapers(params: SemanticScholarSearchParams): Promise<SemanticScholarSearchResult> {
    // TEMPORAL: Deshabilitado debido a CORS policy
    // Semantic Scholar no permite requests directos desde el navegador
    console.log('⚠️ Semantic Scholar temporarily disabled due to CORS policy');
    return this.createEmptyResult(params.query, params.offset || 0);
    
    /* Código original comentado para referencia futura:
    const cacheKey = this.generateCacheKey(params);

    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('📚 Using cached Semantic Scholar results');
        return cached.data;
      }
    }

    try {
      console.log(`🔍 Searching Semantic Scholar: "${params.query}"`);

      const searchUrl = this.buildSearchURL(params);
      console.log(`📡 Semantic Scholar URL: ${searchUrl}`);

      const headers = this.buildHeaders();
      const response = await fetch(searchUrl, { headers });

      if (!response.ok) {
        console.error(`Semantic Scholar search failed: ${response.status} ${response.statusText}`);
        return this.createEmptyResult(params.query, params.offset || 0);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        console.warn('Semantic Scholar returned no results');
        return this.createEmptyResult(params.query, params.offset || 0);
      }

      const papers = await this.enrichPapers(data.data, params);

      const result: SemanticScholarSearchResult = {
        papers,
        total: data.total || 0,
        offset: data.offset || 0,
        next: data.next,
        searchQuery: params.query,
        searchTime: Date.now()
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${papers.length} Semantic Scholar papers (${result.total} total)`);
      return result;

    } catch (error) {
      console.error('❌ Semantic Scholar API Error:', error);
      return this.createEmptyResult(params.query, params.offset || 0);
    }
    */
  }

  /**
   * Construir URL de búsqueda
   */
  private buildSearchURL(params: SemanticScholarSearchParams): string {
    const url = new URL(`${SemanticScholarService.BASE_URL}/${SemanticScholarService.SEARCH_ENDPOINT}`);

    // Query principal optimizada
    const optimizedQuery = this.optimizeQuery(params.query);
    url.searchParams.append('query', optimizedQuery);

    // Parámetros de paginación
    url.searchParams.append('limit', String(params.limit || 25));
    if (params.offset) {
      url.searchParams.append('offset', String(params.offset));
    }

    // Campos a incluir en la respuesta
    const defaultFields = [
      'paperId', 'title', 'authors', 'journal', 'venue', 'year',
      'publicationDate', 'abstract', 'tldr', 'url', 'doi', 'pmid',
      'citationCount', 'referenceCount', 'influentialCitationCount',
      'fieldsOfStudy', 'openAccessPdf', 'publicationTypes', 's2FieldsOfStudy'
    ];
    const fields = params.fields || defaultFields;
    url.searchParams.append('fields', fields.join(','));

    // Filtros opcionales
    if (params.year) {
      url.searchParams.append('year', params.year);
    }

    if (params.venue && params.venue.length > 0) {
      params.venue.forEach(v => url.searchParams.append('venue', v));
    }

    if (params.fieldsOfStudy && params.fieldsOfStudy.length > 0) {
      params.fieldsOfStudy.forEach(field => url.searchParams.append('fieldsOfStudy', field));
    }

    if (params.minCitationCount) {
      url.searchParams.append('minCitationCount', String(params.minCitationCount));
    }

    if (params.openAccessPdf) {
      url.searchParams.append('openAccessPdf', 'true');
    }

    return url.toString();
  }

  /**
   * Optimizar query para búsquedas médicas oftalmológicas
   */
  private optimizeQuery(query: string): string {
    let optimizedQuery = query.trim();

    // Agregar términos oftalmológicos si no están presentes
    const medicalTerms = [
      'ophthalmology', 'eye', 'retina', 'ocular', 'visual', 'ophthalmic',
      'cornea', 'glaucoma', 'cataract', 'macular', 'vitreous', 'iris'
    ];

    const hasMedicalTerm = medicalTerms.some(term =>
      optimizedQuery.toLowerCase().includes(term.toLowerCase())
    );

    if (!hasMedicalTerm) {
      optimizedQuery += ' ophthalmology OR eye OR retina OR ocular';
    }

    return optimizedQuery;
  }

  /**
   * Construir headers para la solicitud
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'OftalmologiaResearchApp/1.0'
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Enriquecer papers con información adicional
   */
  private async enrichPapers(papers: any[], params: SemanticScholarSearchParams): Promise<SemanticScholarPaper[]> {
    return papers.map(paper => this.parsePaper(paper));
  }

  /**
   * Parsear un paper individual
   */
  private parsePaper(item: any): SemanticScholarPaper {
    return {
      paperId: item.paperId || '',
      title: item.title || 'Sin título',
      authors: this.parseAuthors(item.authors || []),
      journal: item.journal?.name || item.venue || 'Unknown Journal',
      venue: item.venue || 'Unknown Venue',
      year: item.year || new Date().getFullYear(),
      publicationDate: item.publicationDate,
      abstract: item.abstract,
      tldr: item.tldr?.text,
      url: item.url || `https://www.semanticscholar.org/paper/${item.paperId}`,
      doi: item.doi,
      arxivId: item.arxivId,
      pmid: item.pmid,
      citationCount: item.citationCount || 0,
      referenceCount: item.referenceCount || 0,
      influentialCitationCount: item.influentialCitationCount || 0,
      fieldsOfStudy: item.fieldsOfStudy || [],
      openAccessPdf: item.openAccessPdf,
      isOpenAccess: !!item.openAccessPdf?.url,
      publicationTypes: item.publicationTypes || [],
      publicationVenue: item.publicationVenue,
      citations: this.parseCitations(item.citations || []),
      references: this.parseReferences(item.references || []),
      s2FieldsOfStudy: item.s2FieldsOfStudy || []
    };
  }

  /**
   * Parsear autores
   */
  private parseAuthors(authors: any[]): SemanticScholarAuthor[] {
    return authors.map(author => ({
      authorId: author.authorId || '',
      name: author.name || 'Unknown Author',
      affiliations: author.affiliations || [],
      homepage: author.homepage,
      paperCount: author.paperCount,
      citationCount: author.citationCount,
      hIndex: author.hIndex
    }));
  }

  /**
   * Parsear citas
   */
  private parseCitations(citations: any[]): SemanticScholarCitation[] {
    return citations.slice(0, 10).map(citation => ({ // Limitar a 10 citas
      paperId: citation.paperId || '',
      title: citation.title || 'Unknown Title',
      authors: this.parseAuthors(citation.authors || []),
      year: citation.year,
      contexts: citation.contexts || [],
      isInfluential: citation.isInfluential || false
    }));
  }

  /**
   * Parsear referencias
   */
  private parseReferences(references: any[]): SemanticScholarReference[] {
    return references.slice(0, 10).map(reference => ({ // Limitar a 10 referencias
      paperId: reference.paperId || '',
      title: reference.title || 'Unknown Title',
      authors: this.parseAuthors(reference.authors || []),
      year: reference.year,
      contexts: reference.contexts || [],
      isInfluential: reference.isInfluential || false
    }));
  }

  /**
   * Obtener paper por ID
   */
  async getPaperById(paperId: string, fields?: string[]): Promise<SemanticScholarPaper | null> {
    try {
      const defaultFields = [
        'paperId', 'title', 'authors', 'journal', 'year', 'publicationDate',
        'abstract', 'tldr', 'url', 'doi', 'pmid', 'citationCount',
        'referenceCount', 'influentialCitationCount', 'fieldsOfStudy',
        'openAccessPdf', 'citations', 'references'
      ];

      const url = new URL(`${SemanticScholarService.BASE_URL}/${SemanticScholarService.PAPER_ENDPOINT}/${paperId}`);
      url.searchParams.append('fields', (fields || defaultFields).join(','));

      const headers = this.buildHeaders();
      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        console.error(`Failed to fetch paper ${paperId}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.parsePaper(data);
    } catch (error) {
      console.error(`Error fetching paper ${paperId}:`, error);
      return null;
    }
  }

  /**
   * Obtener recomendaciones basadas en un paper
   */
  async getRecommendations(paperId: string, limit: number = 10): Promise<SemanticScholarRecommendations | null> {
    try {
      const url = `${SemanticScholarService.BASE_URL}/${SemanticScholarService.PAPER_ENDPOINT}/${paperId}/${SemanticScholarService.RECOMMENDATIONS_ENDPOINT}?limit=${limit}`;

      const headers = this.buildHeaders();
      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`Failed to fetch recommendations for ${paperId}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        recommendedPapers: data.recommendedPapers.map((paper: any) => this.parsePaper(paper)),
        fromPaper: paperId,
        reason: 'Semantic similarity based on paper content and citations'
      };
    } catch (error) {
      console.error(`Error fetching recommendations for ${paperId}:`, error);
      return null;
    }
  }

  /**
   * Buscar papers altamente citados
   */
  async searchHighImpact(query: string, minCitations: number = 50, limit: number = 20): Promise<SemanticScholarSearchResult> {
    const params: SemanticScholarSearchParams = {
      query,
      limit,
      minCitationCount: minCitations,
      sort: 'citationCount',
      fieldsOfStudy: ['Medicine', 'Biology']
    };

    return this.searchPapers(params);
  }

  /**
   * Buscar papers recientes (últimos 2 años)
   */
  async searchRecent(query: string, limit: number = 25): Promise<SemanticScholarSearchResult> {
    const currentYear = new Date().getFullYear();
    const twoYearsAgo = currentYear - 2;

    const params: SemanticScholarSearchParams = {
      query,
      limit,
      year: `${twoYearsAgo}-${currentYear}`,
      sort: 'publicationDate',
      fieldsOfStudy: ['Medicine', 'Biology']
    };

    return this.searchPapers(params);
  }

  /**
   * Buscar solo papers con acceso abierto
   */
  async searchOpenAccess(query: string, limit: number = 25): Promise<SemanticScholarSearchResult> {
    const params: SemanticScholarSearchParams = {
      query,
      limit,
      openAccessPdf: true,
      sort: 'relevance',
      fieldsOfStudy: ['Medicine', 'Biology']
    };

    return this.searchPapers(params);
  }

  /**
   * Buscar papers por autor
   */
  async searchByAuthor(authorName: string, limit: number = 20): Promise<SemanticScholarSearchResult> {
    const params: SemanticScholarSearchParams = {
      query: `author:"${authorName}"`,
      limit,
      sort: 'citationCount',
      fieldsOfStudy: ['Medicine', 'Biology']
    };

    return this.searchPapers(params);
  }

  /**
   * Obtener papers similares semánticamente
   */
  async findSimilarPapers(paperId: string, limit: number = 10): Promise<SemanticScholarPaper[]> {
    const recommendations = await this.getRecommendations(paperId, limit);
    return recommendations ? recommendations.recommendedPapers : [];
  }

  private createEmptyResult(query: string, offset: number): SemanticScholarSearchResult {
    return {
      papers: [],
      total: 0,
      offset,
      searchQuery: query,
      searchTime: Date.now()
    };
  }

  private generateCacheKey(params: SemanticScholarSearchParams): string {
    return `semantic_scholar_${JSON.stringify(params)}`;
  }

  /**
   * Limpiar caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtener estadísticas del caché
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length
    };
  }

  /**
   * Configurar API key (opcional, para mayor límite de requests)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// Instancia singleton
export const semanticScholar = new SemanticScholarService();