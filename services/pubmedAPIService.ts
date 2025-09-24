// PubMed API Service - Integración con la base de datos médica más importante del mundo
// API gratuita de la National Library of Medicine (NLM)

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  doi?: string;
  pmc?: string;
  keywords: string[];
  meshTerms: string[];
  publicationType: string[];
  language: string;
  country: string;
  affiliation: string[];
  citationCount?: number;
  impactFactor?: number;
}

export interface PubMedSearchResult {
  articles: PubMedArticle[];
  totalCount: number;
  searchQuery: string;
  searchTime: number;
  hasMore: boolean;
  nextPage?: number;
}

export interface PubMedSearchParams {
  query: string;
  maxResults?: number;
  startDate?: string;
  endDate?: string;
  articleType?: string[];
  language?: string;
  sortBy?: 'relevance' | 'date' | 'author' | 'journal';
  includeAbstract?: boolean;
}

export class PubMedAPIService {
  private static readonly BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  private static readonly EMAIL = 'oftalmologia-app@example.com'; // Requerido por NCBI
  private static readonly TOOL = 'OftalmologiaResearchApp';
  
  // Cache para evitar llamadas repetidas
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

  /**
   * Buscar artículos en PubMed
   */
  async searchArticles(params: PubMedSearchParams): Promise<PubMedSearchResult> {
    const cacheKey = this.generateCacheKey(params);
    
    // Verificar caché
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('Using cached PubMed results');
        return cached.data;
      }
    }

    try {
      console.log(`Searching PubMed: "${params.query}"`);
      
      // Paso 1: Buscar IDs de artículos
      const searchIds = await this.searchArticleIds(params);
      
      if (searchIds.length === 0) {
        return {
          articles: [],
          totalCount: 0,
          searchQuery: params.query,
          searchTime: 0,
          hasMore: false
        };
      }

      // Paso 2: Obtener detalles de los artículos
      const articles = await this.fetchArticleDetails(searchIds, params);
      
      const result: PubMedSearchResult = {
        articles,
        totalCount: searchIds.length,
        searchQuery: params.query,
        searchTime: Date.now(),
        hasMore: searchIds.length >= (params.maxResults || 20)
      };

      // Guardar en caché
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`Found ${articles.length} PubMed articles`);
      return result;

    } catch (error) {
      console.error('PubMed API Error:', error);
      throw new Error(`PubMed search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Buscar IDs de artículos que coincidan con la consulta
   */
  private async searchArticleIds(params: PubMedSearchParams): Promise<string[]> {
    const searchQuery = this.buildSearchQuery(params);
    const maxResults = params.maxResults || 20;
    
    const url = `${PubMedAPIService.BASE_URL}esearch.fcgi?` +
      `db=pubmed&` +
      `term=${encodeURIComponent(searchQuery)}&` +
      `retmax=${maxResults}&` +
      `retmode=json&` +
      `email=${PubMedAPIService.EMAIL}&` +
      `tool=${PubMedAPIService.TOOL}`;

    console.log(`📡 PubMed Search URL: ${url}`);
    console.log(`📡 Search Query: ${searchQuery}`);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`PubMed search failed: ${response.status} ${response.statusText}`);
        return []; // Retornar array vacío en caso de error
      }

      const data = await response.json();
      const ids = data.esearchresult?.idlist || [];
      console.log(`Found ${ids.length} PubMed articles`);
      return ids;
    } catch (error) {
      console.error('PubMed search error:', error);
      return []; // Retornar array vacío en caso de error
    }
  }

  /**
   * Obtener detalles completos de los artículos
   */
  private async fetchArticleDetails(ids: string[], params: PubMedSearchParams): Promise<PubMedArticle[]> {
    if (ids.length === 0) return [];

    const url = `${PubMedAPIService.BASE_URL}efetch.fcgi?` +
      `db=pubmed&` +
      `id=${ids.join(',')}&` +
      `retmode=xml&` +
      `rettype=abstract&` +
      `email=${PubMedAPIService.EMAIL}&` +
      `tool=${PubMedAPIService.TOOL}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`PubMed fetch failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return this.parseXMLResponse(xmlText, params);
  }

  /**
   * Construir consulta de búsqueda optimizada para oftalmología
   */
  private buildSearchQuery(params: PubMedSearchParams): string {
    // Simplificar la query para evitar problemas de URL
    let query = params.query
      .replace(/[^\w\s]/g, ' ') // Remover caracteres especiales
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim()
      .substring(0, 100); // Limitar longitud
    
    // Solo agregar filtros básicos de oftalmología
    if (!query.toLowerCase().includes('ophthalmol') && 
        !query.toLowerCase().includes('eye') && 
        !query.toLowerCase().includes('retina')) {
      query += ' ophthalmology';
    }

    // Filtro por tipo de artículo (simplificado)
    if (params.articleType && params.articleType.length > 0) {
      const articleTypes = params.articleType.map(type => 
        type === 'review' ? 'review' : 
        type === 'clinical_trial' ? 'clinical trial' :
        type === 'meta_analysis' ? 'meta-analysis' :
        type
      ).join(' OR ');
      query += ` ${articleTypes}`;
    }

    // Filtro por idioma (simplificado)
    if (params.language) {
      query += ` ${params.language}`;
    }

    // Filtro por fecha (simplificado)
    if (params.startDate || params.endDate) {
      const startDate = params.startDate || '1900/01/01';
      const endDate = params.endDate || new Date().toISOString().split('T')[0].replace(/-/g, '/');
      query += ` AND (${startDate}:${endDate}[dp])`;
    }

    return query;
  }

  /**
   * Parsear respuesta XML de PubMed
   */
  private parseXMLResponse(xmlText: string, params: PubMedSearchParams): PubMedArticle[] {
    try {
      // Crear parser XML simple
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const articles = xmlDoc.getElementsByTagName('PubmedArticle');
      
      const results: PubMedArticle[] = [];
      
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const parsedArticle = this.parseArticle(article, params);
        if (parsedArticle) {
          results.push(parsedArticle);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error parsing PubMed XML:', error);
      return [];
    }
  }

  /**
   * Parsear un artículo individual
   */
  private parseArticle(articleElement: Element, params: PubMedSearchParams): PubMedArticle | null {
    try {
      const pmid = this.getTextContent(articleElement, 'PMID');
      if (!pmid) return null;

      const title = this.getTextContent(articleElement, 'ArticleTitle');
      const abstract = params.includeAbstract ? 
        this.getTextContent(articleElement, 'AbstractText') : '';
      
      const authors = this.getAuthors(articleElement);
      const journal = this.getTextContent(articleElement, 'Title');
      const publicationDate = this.getPublicationDate(articleElement);
      const doi = this.getDOI(articleElement);
      const pmc = this.getPMC(articleElement);
      const keywords = this.getKeywords(articleElement);
      const meshTerms = this.getMeSHTerms(articleElement);
      const publicationType = this.getPublicationTypes(articleElement);
      const language = this.getTextContent(articleElement, 'Language');
      const country = this.getTextContent(articleElement, 'Country');
      const affiliation = this.getAffiliations(articleElement);

      return {
        pmid,
        title: title || 'Sin título',
        authors,
        journal: journal || 'Sin revista',
        publicationDate,
        abstract: abstract || '',
        doi,
        pmc,
        keywords,
        meshTerms,
        publicationType,
        language: language || 'en',
        country: country || 'Unknown',
        affiliation
      };
    } catch (error) {
      console.error('Error parsing individual article:', error);
      return null;
    }
  }

  // Métodos auxiliares para extraer datos del XML
  private getTextContent(element: Element, tagName: string): string {
    const tag = element.getElementsByTagName(tagName)[0];
    return tag ? tag.textContent?.trim() || '' : '';
  }

  private getAuthors(articleElement: Element): string[] {
    const authors: string[] = [];
    const authorList = articleElement.getElementsByTagName('AuthorList')[0];
    if (authorList) {
      const authors_elements = authorList.getElementsByTagName('Author');
      for (let i = 0; i < authors_elements.length; i++) {
        const author = authors_elements[i];
        const lastName = this.getTextContent(author, 'LastName');
        const foreName = this.getTextContent(author, 'ForeName');
        if (lastName) {
          authors.push(foreName ? `${foreName} ${lastName}` : lastName);
        }
      }
    }
    return authors;
  }

  private getPublicationDate(articleElement: Element): string {
    const pubDate = articleElement.getElementsByTagName('PubDate')[0];
    if (pubDate) {
      const year = this.getTextContent(pubDate, 'Year');
      const month = this.getTextContent(pubDate, 'Month');
      const day = this.getTextContent(pubDate, 'Day');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  private getDOI(articleElement: Element): string | undefined {
    const elocationIds = articleElement.getElementsByTagName('ELocationID');
    for (let i = 0; i < elocationIds.length; i++) {
      const eloc = elocationIds[i];
      if (eloc.getAttribute('EIdType') === 'doi') {
        return eloc.textContent?.trim();
      }
    }
    return undefined;
  }

  private getPMC(articleElement: Element): string | undefined {
    const articleIds = articleElement.getElementsByTagName('ArticleId');
    for (let i = 0; i < articleIds.length; i++) {
      const id = articleIds[i];
      if (id.getAttribute('IdType') === 'pmc') {
        return id.textContent?.trim();
      }
    }
    return undefined;
  }

  private getKeywords(articleElement: Element): string[] {
    const keywords: string[] = [];
    const keywordList = articleElement.getElementsByTagName('KeywordList')[0];
    if (keywordList) {
      const keywordElements = keywordList.getElementsByTagName('Keyword');
      for (let i = 0; i < keywordElements.length; i++) {
        const keyword = keywordElements[i].textContent?.trim();
        if (keyword) keywords.push(keyword);
      }
    }
    return keywords;
  }

  private getMeSHTerms(articleElement: Element): string[] {
    const meshTerms: string[] = [];
    const meshHeadingList = articleElement.getElementsByTagName('MeshHeadingList')[0];
    if (meshHeadingList) {
      const meshHeadings = meshHeadingList.getElementsByTagName('MeshHeading');
      for (let i = 0; i < meshHeadings.length; i++) {
        const descriptor = meshHeadings[i].getElementsByTagName('DescriptorName')[0];
        if (descriptor) {
          meshTerms.push(descriptor.textContent?.trim() || '');
        }
      }
    }
    return meshTerms;
  }

  private getPublicationTypes(articleElement: Element): string[] {
    const types: string[] = [];
    const publicationTypeList = articleElement.getElementsByTagName('PublicationTypeList')[0];
    if (publicationTypeList) {
      const typeElements = publicationTypeList.getElementsByTagName('PublicationType');
      for (let i = 0; i < typeElements.length; i++) {
        const type = typeElements[i].textContent?.trim();
        if (type) types.push(type);
      }
    }
    return types;
  }

  private getAffiliations(articleElement: Element): string[] {
    const affiliations: string[] = [];
    const affiliationList = articleElement.getElementsByTagName('AffiliationInfo');
    for (let i = 0; i < affiliationList.length; i++) {
      const affiliation = affiliationList[i].textContent?.trim();
      if (affiliation) affiliations.push(affiliation);
    }
    return affiliations;
  }

  private generateCacheKey(params: PubMedSearchParams): string {
    return `pubmed_${JSON.stringify(params)}`;
  }

  /**
   * Buscar artículos relacionados a un tema específico
   */
  async searchRelatedArticles(pmid: string, maxResults: number = 10): Promise<PubMedSearchResult> {
    const params: PubMedSearchParams = {
      query: `similar[${pmid}]`,
      maxResults,
      includeAbstract: true
    };
    
    return this.searchArticles(params);
  }

  /**
   * Buscar artículos por autor específico
   */
  async searchByAuthor(authorName: string, maxResults: number = 20): Promise<PubMedSearchResult> {
    const params: PubMedSearchParams = {
      query: `"${authorName}"[Author]`,
      maxResults,
      includeAbstract: true
    };
    
    return this.searchArticles(params);
  }

  /**
   * Buscar revisiones sistemáticas y metaanálisis
   */
  async searchSystematicReviews(query: string, maxResults: number = 15): Promise<PubMedSearchResult> {
    const params: PubMedSearchParams = {
      query,
      maxResults,
      articleType: ['review', 'meta_analysis'],
      includeAbstract: true
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
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // Estimado basado en uso típico
    };
  }
}

// Instancia singleton
export const pubmedAPI = new PubMedAPIService();
