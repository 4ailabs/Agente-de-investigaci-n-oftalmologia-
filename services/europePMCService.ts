// Europe PMC API Service - Búsqueda avanzada en literatura biomédica europea
// API gratuita con acceso completo a abstracts y PDFs open access

export interface EuropePMCArticle {
  id: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract?: string;
  fullTextUrl?: string;
  pdfUrl?: string;
  keywords: string[];
  meshTerms: string[];
  citationCount: number;
  isOpenAccess: boolean;
  hasFullText: boolean;
  hasPDF: boolean;
  source: string;
  publicationType: string[];
  affiliation: string[];
  grantsList: string[];
  chemicals: string[];
}

export interface EuropePMCSearchResult {
  articles: EuropePMCArticle[];
  totalCount: number;
  searchQuery: string;
  searchTime: number;
  hasMore: boolean;
  nextPage?: number;
}

export interface EuropePMCSearchParams {
  query: string;
  maxResults?: number;
  startPage?: number;
  sortBy?: 'relevance' | 'date' | 'cited' | 'author_count';
  includeFullText?: boolean;
  onlyOpenAccess?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  journalFilter?: string[];
  publicationType?: string[];
}

export class EuropePMCService {
  private static readonly BASE_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest/';
  private static readonly SEARCH_ENDPOINT = 'search';
  private static readonly FULLTEXT_ENDPOINT = 'fullTextXML';

  // Cache para evitar llamadas repetidas
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Buscar artículos en Europe PMC
   */
  async searchArticles(params: EuropePMCSearchParams): Promise<EuropePMCSearchResult> {
    const cacheKey = this.generateCacheKey(params);

    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('📚 Using cached Europe PMC results');
        return cached.data;
      }
    }

    try {
      console.log(`🔍 Searching Europe PMC: "${params.query}"`);

      const searchUrl = this.buildSearchURL(params);
      console.log(`📡 Europe PMC URL: ${searchUrl}`);

      const response = await fetch(searchUrl);

      if (!response.ok) {
        console.error(`Europe PMC search failed: ${response.status} ${response.statusText}`);
        return this.createEmptyResult(params.query);
      }

      const data = await response.json();
      const articles = await this.parseSearchResults(data, params);

      const result: EuropePMCSearchResult = {
        articles,
        totalCount: data.hitCount || 0,
        searchQuery: params.query,
        searchTime: Date.now(),
        hasMore: articles.length >= (params.maxResults || 25),
        nextPage: (params.startPage || 1) + 1
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${articles.length} Europe PMC articles (${data.hitCount} total)`);
      return result;

    } catch (error) {
      console.error('❌ Europe PMC API Error:', error);
      return this.createEmptyResult(params.query);
    }
  }

  /**
   * Construir URL de búsqueda
   */
  private buildSearchURL(params: EuropePMCSearchParams): string {
    const baseUrl = `${EuropePMCService.BASE_URL}${EuropePMCService.SEARCH_ENDPOINT}`;
    const urlParams = new URLSearchParams();

    // Construir query optimizada
    let query = this.buildOptimizedQuery(params);
    urlParams.append('query', query);

    // Parámetros básicos
    urlParams.append('format', 'json');
    urlParams.append('resultType', 'core');
    urlParams.append('pageSize', String(params.maxResults || 25));
    urlParams.append('cursorMark', '*');

    // Ordenamiento
    if (params.sortBy) {
      const sortMapping = {
        'relevance': 'relevance',
        'date': 'date desc',
        'cited': 'cited desc',
        'author_count': 'author_count desc'
      };
      urlParams.append('sort', sortMapping[params.sortBy]);
    }

    return `${baseUrl}?${urlParams.toString()}`;
  }

  /**
   * Construir query optimizada para Europe PMC
   */
  private buildOptimizedQuery(params: EuropePMCSearchParams): string {
    let query = params.query;

    // Agregar filtro de oftalmología si no está presente
    if (!query.toLowerCase().includes('ophthalmol') &&
        !query.toLowerCase().includes('eye') &&
        !query.toLowerCase().includes('retina') &&
        !query.toLowerCase().includes('ocular')) {
      query += ' AND (ophthalmology OR eye OR retina OR ocular OR visual)';
    }

    // Solo acceso abierto si se solicita
    if (params.onlyOpenAccess) {
      query += ' AND (OPEN_ACCESS:y)';
    }

    // Filtro por rango de fechas
    if (params.dateRange) {
      query += ` AND (PUB_YEAR:[${params.dateRange.from} TO ${params.dateRange.to}])`;
    }

    // Filtro por tipo de publicación
    if (params.publicationType && params.publicationType.length > 0) {
      const types = params.publicationType.map(type => `"${type}"`).join(' OR ');
      query += ` AND (PUB_TYPE:(${types}))`;
    }

    // Filtro por revistas específicas
    if (params.journalFilter && params.journalFilter.length > 0) {
      const journals = params.journalFilter.map(journal => `"${journal}"`).join(' OR ');
      query += ` AND (JOURNAL:(${journals}))`;
    }

    return query;
  }

  /**
   * Parsear resultados de búsqueda
   */
  private async parseSearchResults(data: any, params: EuropePMCSearchParams): Promise<EuropePMCArticle[]> {
    if (!data.resultList || !data.resultList.result) {
      return [];
    }

    const results: EuropePMCArticle[] = [];

    for (const item of data.resultList.result) {
      try {
        const article = await this.parseArticle(item, params);
        if (article) {
          results.push(article);
        }
      } catch (error) {
        console.warn('Error parsing Europe PMC article:', error);
        continue;
      }
    }

    return results;
  }

  /**
   * Parsear un artículo individual
   */
  private async parseArticle(item: any, params: EuropePMCSearchParams): Promise<EuropePMCArticle | null> {
    try {
      const id = item.id || item.pmid || item.pmcid || 'unknown';

      // Obtener full text si se solicita y está disponible
      let fullTextUrl = '';
      let pdfUrl = '';
      let abstract = item.abstractText || '';

      if (params.includeFullText && item.hasTextMinedTerms === 'Y') {
        const fullTextData = await this.getFullTextInfo(item.pmcid);
        if (fullTextData) {
          fullTextUrl = fullTextData.fullTextUrl;
          pdfUrl = fullTextData.pdfUrl;
          if (!abstract && fullTextData.abstract) {
            abstract = fullTextData.abstract;
          }
        }
      }

      const article: EuropePMCArticle = {
        id,
        pmid: item.pmid,
        pmcid: item.pmcid,
        doi: item.doi,
        title: item.title || 'Sin título',
        authors: this.parseAuthors(item.authorList),
        journal: item.journalInfo?.journal?.title || item.journalTitle || 'Sin revista',
        publicationDate: this.parsePublicationDate(item),
        abstract,
        fullTextUrl,
        pdfUrl,
        keywords: this.parseKeywords(item),
        meshTerms: this.parseMeshTerms(item),
        citationCount: parseInt(item.citedByCount) || 0,
        isOpenAccess: item.isOpenAccess === 'Y',
        hasFullText: item.hasTextMinedTerms === 'Y',
        hasPDF: item.hasPDF === 'Y',
        source: item.source || 'Europe PMC',
        publicationType: this.parsePublicationType(item),
        affiliation: this.parseAffiliations(item),
        grantsList: this.parseGrants(item),
        chemicals: this.parseChemicals(item)
      };

      return article;
    } catch (error) {
      console.error('Error parsing individual Europe PMC article:', error);
      return null;
    }
  }

  /**
   * Obtener información de texto completo
   */
  private async getFullTextInfo(pmcid: string): Promise<{ fullTextUrl: string; pdfUrl: string; abstract?: string } | null> {
    if (!pmcid) return null;

    try {
      const fullTextUrl = `${EuropePMCService.BASE_URL}${EuropePMCService.FULLTEXT_ENDPOINT}/PMC${pmcid}`;
      const pdfUrl = `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcid}/pdf/`;

      return {
        fullTextUrl,
        pdfUrl
      };
    } catch (error) {
      console.warn('Error getting full text info:', error);
      return null;
    }
  }

  // Métodos auxiliares para parsear datos
  private parseAuthors(authorList: any): string[] {
    if (!authorList || !authorList.author) return [];

    return authorList.author.map((author: any) => {
      const firstName = author.firstName || '';
      const lastName = author.lastName || '';
      const initials = author.initials || '';

      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (lastName && initials) {
        return `${initials} ${lastName}`;
      } else if (lastName) {
        return lastName;
      }
      return author.fullName || 'Autor desconocido';
    }).filter(Boolean);
  }

  private parsePublicationDate(item: any): string {
    if (item.firstPublicationDate) {
      return item.firstPublicationDate;
    } else if (item.electronicPublicationDate) {
      return item.electronicPublicationDate;
    } else if (item.journalInfo?.yearOfPublication) {
      return `${item.journalInfo.yearOfPublication}-01-01`;
    }
    return new Date().toISOString().split('T')[0];
  }

  private parseKeywords(item: any): string[] {
    const keywords: string[] = [];

    if (item.keywordList && item.keywordList.keyword) {
      keywords.push(...item.keywordList.keyword);
    }

    return keywords;
  }

  private parseMeshTerms(item: any): string[] {
    const meshTerms: string[] = [];

    if (item.meshHeadingList && item.meshHeadingList.meshHeading) {
      meshTerms.push(...item.meshHeadingList.meshHeading.map((mesh: any) =>
        mesh.descriptorName || mesh
      ));
    }

    return meshTerms;
  }

  private parsePublicationType(item: any): string[] {
    if (!item.pubTypeList || !item.pubTypeList.pubType) return [];

    return item.pubTypeList.pubType.map((type: any) => type.value || type);
  }

  private parseAffiliations(item: any): string[] {
    const affiliations: string[] = [];

    if (item.affiliation) {
      affiliations.push(item.affiliation);
    }

    if (item.authorList && item.authorList.author) {
      item.authorList.author.forEach((author: any) => {
        if (author.affiliation) {
          affiliations.push(author.affiliation);
        }
      });
    }

    return [...new Set(affiliations)]; // Remove duplicates
  }

  private parseGrants(item: any): string[] {
    if (!item.grantsList || !item.grantsList.grant) return [];

    return item.grantsList.grant.map((grant: any) =>
      `${grant.grantId || ''} (${grant.agency || 'Unknown agency'})`
    ).filter(Boolean);
  }

  private parseChemicals(item: any): string[] {
    if (!item.chemicalList || !item.chemicalList.chemical) return [];

    return item.chemicalList.chemical.map((chemical: any) =>
      chemical.name || chemical
    ).filter(Boolean);
  }

  private createEmptyResult(query: string): EuropePMCSearchResult {
    return {
      articles: [],
      totalCount: 0,
      searchQuery: query,
      searchTime: Date.now(),
      hasMore: false
    };
  }

  private generateCacheKey(params: EuropePMCSearchParams): string {
    return `europepmc_${JSON.stringify(params)}`;
  }

  /**
   * Buscar artículos similares
   */
  async findSimilarArticles(pmid: string, maxResults: number = 10): Promise<EuropePMCSearchResult> {
    const params: EuropePMCSearchParams = {
      query: `SIM:"${pmid}"`,
      maxResults,
      includeFullText: true
    };

    return this.searchArticles(params);
  }

  /**
   * Buscar solo artículos de acceso abierto
   */
  async searchOpenAccess(query: string, maxResults: number = 25): Promise<EuropePMCSearchResult> {
    const params: EuropePMCSearchParams = {
      query,
      maxResults,
      onlyOpenAccess: true,
      includeFullText: true,
      sortBy: 'relevance'
    };

    return this.searchArticles(params);
  }

  /**
   * Buscar revisiones sistemáticas
   */
  async searchSystematicReviews(query: string, maxResults: number = 15): Promise<EuropePMCSearchResult> {
    const params: EuropePMCSearchParams = {
      query,
      maxResults,
      publicationType: ['Review', 'Systematic Review', 'Meta-Analysis'],
      includeFullText: true,
      sortBy: 'cited'
    };

    return this.searchArticles(params);
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
}

// Instancia singleton
export const europePMC = new EuropePMCService();