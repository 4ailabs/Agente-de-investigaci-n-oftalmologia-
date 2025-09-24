// Advanced Cache Service - Optimización de rendimiento
// Sistema de caché multi-nivel con estrategias inteligentes

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

class AdvancedCacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private indexCache = new Map<string, Set<string>>(); // tag -> keys
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  
  private config: CacheConfig = {
    maxSize: 500, // Aumentado de 100
    defaultTTL: 24 * 60 * 60 * 1000, // 24 horas
    cleanupInterval: 60 * 60 * 1000, // 1 hora
    compressionEnabled: true,
    persistenceEnabled: true
  };
  
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
    this.loadFromPersistence();
  }

  // Generar clave de caché optimizada
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${prefix}:${this.hashString(sortedParams)}`;
  }

  // Hash simple pero efectivo
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Comprimir datos si es necesario
  private compress(data: any): any {
    if (!this.config.compressionEnabled) return data;
    
    // Para objetos grandes, usar compresión simple
    if (typeof data === 'object' && JSON.stringify(data).length > 1000) {
      return {
        _compressed: true,
        _data: JSON.stringify(data)
      };
    }
    
    return data;
  }

  // Descomprimir datos
  private decompress(data: any): any {
    if (data && typeof data === 'object' && data._compressed) {
      return JSON.parse(data._data);
    }
    return data;
  }

  // Calcular tamaño de entrada
  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  // Obtener entrada del caché
  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Verificar expiración
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.removeFromIndex(entry);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return this.decompress(entry.data);
  }

  // Guardar entrada en caché
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      tags?: string[];
    } = {}
  ): void {
    const now = Date.now();
    const ttl = options.ttl || this.config.defaultTTL;
    const compressedData = this.compress(data);
    const size = this.calculateSize(compressedData);

    const entry: CacheEntry<T> = {
      data: compressedData,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      size,
      priority: options.priority || 'medium',
      tags: options.tags || []
    };

    // Verificar si necesitamos hacer espacio
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictEntries();
    }

    // Remover entrada anterior si existe
    const existingEntry = this.memoryCache.get(key);
    if (existingEntry) {
      this.removeFromIndex(existingEntry);
    }

    // Agregar nueva entrada
    this.memoryCache.set(key, entry);
    this.addToIndex(key, entry.tags);
    this.stats.size = this.memoryCache.size;
    this.stats.memoryUsage += size;

    // Persistir si está habilitado
    if (this.config.persistenceEnabled) {
      this.persistToStorage();
    }
  }

  // Obtener múltiples entradas por tags
  getByTags(tags: string[]): Map<string, any> {
    const results = new Map<string, any>();
    const relevantKeys = new Set<string>();

    // Encontrar claves que coincidan con los tags
    for (const tag of tags) {
      const keys = this.indexCache.get(tag);
      if (keys) {
        keys.forEach(key => relevantKeys.add(key));
      }
    }

    // Obtener datos de las claves relevantes
    for (const key of relevantKeys) {
      const data = this.get(key);
      if (data !== null) {
        results.set(key, data);
      }
    }

    return results;
  }

  // Invalidar entradas por tags
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    const keysToDelete = new Set<string>();

    for (const tag of tags) {
      const keys = this.indexCache.get(tag);
      if (keys) {
        keys.forEach(key => keysToDelete.add(key));
      }
    }

    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.memoryCache.delete(key);
        this.removeFromIndex(entry);
        this.stats.evictions++;
        invalidated++;
      }
    }

    this.stats.size = this.memoryCache.size;
    return invalidated;
  }

  // Estrategia de evicción inteligente (LRU + Priority)
  private evictEntries(): void {
    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Priorizar por: priority, luego por lastAccessed
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.entry.priority];
        const bPriority = priorityOrder[b.entry.priority];
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority; // Menor prioridad primero
        }
        
        return a.entry.lastAccessed - b.entry.lastAccessed; // Más antiguo primero
      });

    // Evictar el 20% de las entradas menos importantes
    const evictCount = Math.ceil(entries.length * 0.2);
    
    for (let i = 0; i < evictCount; i++) {
      const { key, entry } = entries[i];
      this.memoryCache.delete(key);
      this.removeFromIndex(entry);
      this.stats.evictions++;
    }

    this.stats.size = this.memoryCache.size;
  }

  // Agregar entrada al índice de tags
  private addToIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.indexCache.has(tag)) {
        this.indexCache.set(tag, new Set());
      }
      this.indexCache.get(tag)!.add(key);
    }
  }

  // Remover entrada del índice de tags
  private removeFromIndex(entry: CacheEntry): void {
    for (const tag of entry.tags) {
      const keys = this.indexCache.get(tag);
      if (keys) {
        keys.delete(entry.tags.toString()); // Esto necesita ser corregido
      }
    }
  }

  // Limpiar entradas expiradas
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.memoryCache.delete(key);
        this.removeFromIndex(entry);
        this.stats.evictions++;
      }
    }

    this.stats.size = this.memoryCache.size;
    console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
  }

  // Iniciar timer de limpieza
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Actualizar tasa de aciertos
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Persistir a localStorage
  private persistToStorage(): void {
    try {
      const cacheData = Array.from(this.memoryCache.entries())
        .filter(([_, entry]) => entry.priority === 'high') // Solo persistir entradas de alta prioridad
        .map(([key, entry]) => [key, entry]);
      
      localStorage.setItem('advanced_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  // Cargar desde localStorage
  private loadFromPersistence(): void {
    try {
      const stored = localStorage.getItem('advanced_cache');
      if (stored) {
        const cacheData = JSON.parse(stored);
        for (const [key, entry] of cacheData) {
          this.memoryCache.set(key, entry);
          this.addToIndex(key, entry.tags);
        }
        console.log(`Loaded ${cacheData.length} entries from persistence`);
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // Obtener estadísticas
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Limpiar todo el caché
  clear(): void {
    this.memoryCache.clear();
    this.indexCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
    
    if (this.config.persistenceEnabled) {
      localStorage.removeItem('advanced_cache');
    }
  }

  // Destruir servicio
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Instancia singleton
export const advancedCache = new AdvancedCacheService({
  maxSize: 1000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 horas
  cleanupInterval: 30 * 60 * 1000, // 30 minutos
  compressionEnabled: true,
  persistenceEnabled: true
});

// Utilidades específicas para la aplicación
export class MedicalCacheUtils {
  // Generar clave para búsquedas médicas
  static generateMedicalKey(query: string, model: string, medicalKeywords: string[]): string {
    return advancedCache['generateKey']('medical_search', {
      query: query.substring(0, 100), // Limitar longitud
      model,
      keywords: medicalKeywords.sort()
    });
  }

  // Generar clave para análisis de imágenes
  static generateImageAnalysisKey(imageHash: string, imageType: string): string {
    return advancedCache['generateKey']('image_analysis', {
      imageHash,
      imageType
    });
  }

  // Generar clave para reportes
  static generateReportKey(investigationId: string, stepId: number): string {
    return advancedCache['generateKey']('report', {
      investigationId,
      stepId
    });
  }

  // Tags médicos comunes
  static readonly MEDICAL_TAGS = {
    SEARCH: 'medical_search',
    IMAGE_ANALYSIS: 'image_analysis',
    REPORT: 'report',
    INVESTIGATION: 'investigation',
    HIGH_PRIORITY: 'high_priority'
  };
}
