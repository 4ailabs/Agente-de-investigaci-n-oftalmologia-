// Crossref API Service - Búsqueda de literatura académica con DOIs y metadatos completos
// API gratuita con 50M+ artículos académicos y datos de citas

export interface CrossrefWork {
  doi: string;
  title: string[];
  authors: CrossrefAuthor[];
  journal: string;
  publisher: string;
  publicationDate: string;
  abstract?: string;
  type: string;
  subjectAreas: string[];
  citedByCount: number;
  referencesCount: number;
  url: string;
  isOpenAccess: boolean;
  license?: CrossrefLicense[];
  issn: string[];
  volume?: string;
  issue?: string;
  pages?: string;
  language: string;
  references?: CrossrefReference[];
  fundingInfo: CrossrefFunding[];
  affiliations: string[];
}

export interface CrossrefAuthor {
  given?: string;
  family?: string;
  sequence: string;
  affiliation: CrossrefAffiliation[];
  orcid?: string;
}

export interface CrossrefAffiliation {
  name: string;
  id?: string[];
}

export interface CrossrefLicense {
  url: string;
  start: string;
  delayInDays: number;
  contentVersion: string;
}

export interface CrossrefReference {
  key: string;
  doi?: string;
  title?: string;
  author?: string;
  year?: string;
  journalTitle?: string;
}

export interface CrossrefFunding {
  name: string;
  award: string[];
  doi?: string;
}

export interface CrossrefSearchResult {
  works: CrossrefWork[];
  totalResults: number;
  searchQuery: string;
  searchTime: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface CrossrefSearchParams {
  query: string;
  maxResults?: number;
  offset?: number;
  sortBy?: 'relevance' | 'published' | 'updated' | 'deposited' | 'indexed' | 'is-referenced-by-count';
  sortOrder?: 'asc' | 'desc';
  fromPublishedDate?: string;
  untilPublishedDate?: string;
  hasAbstract?: boolean;
  hasReferences?: boolean;
  hasFullText?: boolean;
  onlyOpenAccess?: boolean;
  publisherFilter?: string[];
  typeFilter?: string[];
  subjectFilter?: string[];
}

export class CrossrefService {
  private static readonly BASE_URL = 'https://api.crossref.org/works';
  private static readonly POLITE_POOL_URL = 'https://api.crossref.org/works';
  private static readonly MAILTO = 'oftalmologia-research@example.com'; // Para acceso cortés

  // Cache para evitar llamadas repetidas
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Buscar trabajos académicos en Crossref
   */
  async searchWorks(params: CrossrefSearchParams): Promise<CrossrefSearchResult> {
    const cacheKey = this.generateCacheKey(params);

    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('📚 Using cached Crossref results');
        return cached.data;
      }
    }

    try {
      console.log(`🔍 Searching Crossref: "${params.query}"`);

      const searchUrl = this.buildSearchURL(params);
      console.log(`📡 Crossref URL: ${searchUrl}`);

      // Headers para acceso cortés (mejor rate limit)
      const headers = {
        'User-Agent': 'OftalmologiaResearchApp/1.0 (mailto:oftalmologia-research@example.com)',
        'Accept': 'application/json'
      };

      const response = await fetch(searchUrl, { headers });

      if (!response.ok) {
        console.error(`Crossref search failed: ${response.status} ${response.statusText}`);
        return this.createEmptyResult(params.query);
      }

      const data = await response.json();

      if (!data.message || !data.message.items) {
        console.warn('Crossref returned no results');
        return this.createEmptyResult(params.query);
      }

      const works = this.parseSearchResults(data.message.items, params);

      const result: CrossrefSearchResult = {
        works,
        totalResults: data.message['total-results'] || 0,
        searchQuery: params.query,
        searchTime: Date.now(),
        hasMore: works.length >= (params.maxResults || 20),
        nextOffset: (params.offset || 0) + works.length
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${works.length} Crossref works (${result.totalResults} total)`);
      return result;

    } catch (error) {
      console.error('❌ Crossref API Error:', error);
      return this.createEmptyResult(params.query);
    }
  }

  /**
   * Construir URL de búsqueda
   */
  private buildSearchURL(params: CrossrefSearchParams): string {
    const urlParams = new URLSearchParams();

    // Query principal
    if (params.query) {
      // Optimizar query para búsquedas médicas
      let query = this.optimizeQuery(params.query);
      urlParams.append('query', query);
    }

    // Parámetros de paginación
    urlParams.append('rows', String(params.maxResults || 20));
    if (params.offset) {
      urlParams.append('offset', String(params.offset));
    }

    // Ordenamiento
    if (params.sortBy) {
      const sortOrder = params.sortOrder || 'desc';
      urlParams.append('sort', `${params.sortBy}:${sortOrder}`);
    }

    // Filtros por fecha
    if (params.fromPublishedDate) {
      urlParams.append('from-published-date', params.fromPublishedDate);
    }
    if (params.untilPublishedDate) {
      urlParams.append('until-published-date', params.untilPublishedDate);
    }

    // Filtros de contenido
    if (params.hasAbstract) {
      urlParams.append('has-abstract', 'true');
    }
    if (params.hasReferences) {
      urlParams.append('has-references', 'true');
    }
    if (params.hasFullText) {
      urlParams.append('has-full-text', 'true');
    }

    // Filtro por tipo de publicación
    if (params.typeFilter && params.typeFilter.length > 0) {
      params.typeFilter.forEach(type => {
        urlParams.append('filter', `type:${type}`);
      });
    }

    // Filtro por publisher
    if (params.publisherFilter && params.publisherFilter.length > 0) {
      params.publisherFilter.forEach(publisher => {
        urlParams.append('filter', `publisher-name:${publisher}`);
      });
    }

    // Email para acceso cortés
    urlParams.append('mailto', CrossrefService.MAILTO);

    return `${CrossrefService.BASE_URL}?${urlParams.toString()}`;
  }

  /**
   * Optimizar query para búsquedas médicas
   */
  private optimizeQuery(query: string): string {
    // Limpiar y optimizar la consulta
    let optimizedQuery = query.trim();

    // Agregar términos oftalmológicos si no están presentes
    const ophthalmologyTerms = ['ophthalmology', 'eye', 'retina', 'ocular', 'visual', 'ophthalmic'];
    const hasOphthalmologyTerm = ophthalmologyTerms.some(term =>
      optimizedQuery.toLowerCase().includes(term.toLowerCase())
    );

    if (!hasOphthalmologyTerm) {
      optimizedQuery += ' ophthalmology OR eye OR retina OR ocular';
    }

    return optimizedQuery;
  }

  /**
   * Parsear resultados de búsqueda
   */
  private parseSearchResults(items: any[], params: CrossrefSearchParams): CrossrefWork[] {
    return items
      .map(item => this.parseWork(item))
      .filter(work => work !== null) as CrossrefWork[];
  }

  /**
   * Parsear un trabajo individual
   */
  private parseWork(item: any): CrossrefWork | null {
    try {
      if (!item.DOI || !item.title || item.title.length === 0) {
        return null;
      }

      const work: CrossrefWork = {
        doi: item.DOI,
        title: item.title,
        authors: this.parseAuthors(item.author || []),
        journal: this.parseJournal(item),
        publisher: item.publisher || 'Unknown Publisher',
        publicationDate: this.parsePublicationDate(item),
        type: item.type || 'journal-article',
        subjectAreas: this.parseSubjects(item.subject || []),
        citedByCount: item['is-referenced-by-count'] || 0,
        referencesCount: item['references-count'] || 0,
        url: item.URL || `https://doi.org/${item.DOI}`,
        isOpenAccess: this.determineOpenAccess(item),
        license: this.parseLicenses(item.license || []),
        issn: item.ISSN || [],
        volume: item.volume,
        issue: item.issue,
        pages: item.page,
        language: item.language || 'en',
        references: this.parseReferences(item.reference || []),
        fundingInfo: this.parseFunding(item.funder || []),
        affiliations: this.extractAffiliations(item.author || [])
      };

      return work;
    } catch (error) {
      console.warn('Error parsing Crossref work:', error);
      return null;
    }
  }

  // Métodos auxiliares para parsear datos
  private parseAuthors(authors: any[]): CrossrefAuthor[] {
    return authors.map(author => ({
      given: author.given,
      family: author.family,
      sequence: author.sequence || 'additional',
      affiliation: author.affiliation ? author.affiliation.map((aff: any) => ({
        name: aff.name || 'Unknown affiliation',
        id: aff.id
      })) : [],
      orcid: author.ORCID
    }));
  }

  private parseJournal(item: any): string {
    if (item['container-title'] && item['container-title'].length > 0) {
      return item['container-title'][0];
    }
    if (item['short-container-title'] && item['short-container-title'].length > 0) {
      return item['short-container-title'][0];
    }
    return 'Unknown Journal';
  }

  private parsePublicationDate(item: any): string {
    if (item.published && item.published['date-parts'] && item.published['date-parts'][0]) {
      const dateParts = item.published['date-parts'][0];
      const year = dateParts[0] || new Date().getFullYear();
      const month = dateParts[1] || 1;
      const day = dateParts[2] || 1;
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    if (item['published-online'] && item['published-online']['date-parts']) {
      const dateParts = item['published-online']['date-parts'][0];
      const year = dateParts[0] || new Date().getFullYear();
      const month = dateParts[1] || 1;
      const day = dateParts[2] || 1;
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return new Date().toISOString().split('T')[0];
  }

  private parseSubjects(subjects: string[]): string[] {
    return subjects.filter(Boolean);
  }

  private determineOpenAccess(item: any): boolean {
    // Verificar licencias open access
    if (item.license) {
      const hasOpenLicense = item.license.some((license: any) => {
        const url = license.URL?.toLowerCase() || '';
        return url.includes('creative') || url.includes('cc-by') || url.includes('open');
      });
      if (hasOpenLicense) return true;
    }

    // Verificar por publisher (algunos publishers son principalmente open access)
    const openAccessPublishers = ['PLOS', 'BioMed Central', 'Frontiers', 'MDPI'];
    const publisher = item.publisher?.toLowerCase() || '';
    if (openAccessPublishers.some(oap => publisher.includes(oap.toLowerCase()))) {
      return true;
    }

    return false;
  }

  private parseLicenses(licenses: any[]): CrossrefLicense[] {
    return licenses.map(license => ({
      url: license.URL || '',
      start: license.start?.['date-time'] || license.start?.['date-parts']?.join('-') || '',
      delayInDays: license['delay-in-days'] || 0,
      contentVersion: license['content-version'] || 'unspecified'
    }));
  }

  private parseReferences(references: any[]): CrossrefReference[] {
    return references.slice(0, 10).map((ref, index) => ({ // Limitar a 10 referencias
      key: ref.key || `ref-${index}`,
      doi: ref.DOI,
      title: ref['article-title'],
      author: ref.author,
      year: ref.year,
      journalTitle: ref['journal-title']
    }));
  }

  private parseFunding(funders: any[]): CrossrefFunding[] {
    return funders.map(funder => ({
      name: funder.name || 'Unknown funder',
      award: funder.award || [],
      doi: funder.DOI
    }));
  }

  private extractAffiliations(authors: any[]): string[] {
    const affiliations = new Set<string>();

    authors.forEach(author => {
      if (author.affiliation) {
        author.affiliation.forEach((aff: any) => {
          if (aff.name) {
            affiliations.add(aff.name);
          }
        });
      }
    });

    return Array.from(affiliations);
  }

  private createEmptyResult(query: string): CrossrefSearchResult {
    return {
      works: [],
      totalResults: 0,
      searchQuery: query,
      searchTime: Date.now(),
      hasMore: false
    };
  }

  private generateCacheKey(params: CrossrefSearchParams): string {
    return `crossref_${JSON.stringify(params)}`;
  }

  /**
   * Buscar por DOI específico
   */
  async getWorkByDOI(doi: string): Promise<CrossrefWork | null> {
    try {
      const url = `${CrossrefService.BASE_URL}/${doi}`;
      const headers = {
        'User-Agent': 'OftalmologiaResearchApp/1.0',
        'Accept': 'application/json'
      };

      const response = await fetch(url, { headers });

      if (!response.ok) {
        console.error(`Failed to fetch DOI ${doi}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.parseWork(data.message);
    } catch (error) {
      console.error(`Error fetching DOI ${doi}:`, error);
      return null;
    }
  }

  /**
   * Buscar trabajos de un autor específico
   */
  async searchByAuthor(authorName: string, maxResults: number = 20): Promise<CrossrefSearchResult> {
    const params: CrossrefSearchParams = {
      query: `author:"${authorName}"`,
      maxResults,
      sortBy: 'published',
      sortOrder: 'desc'
    };

    return this.searchWorks(params);
  }

  /**
   * Buscar solo artículos de acceso abierto
   */
  async searchOpenAccess(query: string, maxResults: number = 20): Promise<CrossrefSearchResult> {
    const params: CrossrefSearchParams = {
      query,
      maxResults,
      onlyOpenAccess: true,
      hasAbstract: true,
      sortBy: 'relevance'
    };

    return this.searchWorks(params);
  }

  /**
   * Buscar revisiones y meta-análisis
   */
  async searchReviews(query: string, maxResults: number = 15): Promise<CrossrefSearchResult> {
    const params: CrossrefSearchParams = {
      query: query + ' review OR meta-analysis OR systematic',
      maxResults,
      hasAbstract: true,
      sortBy: 'is-referenced-by-count',
      sortOrder: 'desc'
    };

    return this.searchWorks(params);
  }

  /**
   * Buscar publicaciones recientes (último año)
   */
  async searchRecent(query: string, maxResults: number = 25): Promise<CrossrefSearchResult> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const params: CrossrefSearchParams = {
      query,
      maxResults,
      fromPublishedDate: oneYearAgo.toISOString().split('T')[0],
      sortBy: 'published',
      sortOrder: 'desc'
    };

    return this.searchWorks(params);
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
export const crossref = new CrossrefService();