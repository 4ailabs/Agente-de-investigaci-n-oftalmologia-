// Performance Configuration - Optimización de rendimiento
// Configuración centralizada para todas las optimizaciones de la aplicación

export interface PerformanceConfig {
  cache: {
    maxSize: number;
    defaultTTL: number;
    cleanupInterval: number;
    compressionEnabled: boolean;
    persistenceEnabled: boolean;
    preloadEnabled: boolean;
  };
  rendering: {
    enableDebouncing: boolean;
    enableMemoization: boolean;
    enableVirtualization: boolean;
    maxRenders: number;
    debounceDelay: number;
  };
  network: {
    enablePreloading: boolean;
    enablePrefetching: boolean;
    maxConcurrentRequests: number;
    requestTimeout: number;
    retryAttempts: number;
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    metricsInterval: number;
  };
}

export const defaultPerformanceConfig: PerformanceConfig = {
  cache: {
    maxSize: 1000, // Máximo 1000 entradas en caché
    defaultTTL: 24 * 60 * 60 * 1000, // 24 horas
    cleanupInterval: 30 * 60 * 1000, // 30 minutos
    compressionEnabled: true,
    persistenceEnabled: true,
    preloadEnabled: true
  },
  rendering: {
    enableDebouncing: true,
    enableMemoization: true,
    enableVirtualization: false,
    maxRenders: 100,
    debounceDelay: 300
  },
  network: {
    enablePreloading: true,
    enablePrefetching: true,
    maxConcurrentRequests: 5,
    requestTimeout: 30000, // 30 segundos
    retryAttempts: 3
  },
  monitoring: {
    enableMetrics: true,
    enableLogging: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    metricsInterval: 5000 // 5 segundos
  }
};

// Configuración específica para diferentes entornos
export const getPerformanceConfig = (): PerformanceConfig => {
  const baseConfig = { ...defaultPerformanceConfig };
  
  // Configuración para desarrollo
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      cache: {
        ...baseConfig.cache,
        maxSize: 500, // Menor caché en desarrollo
        cleanupInterval: 5 * 60 * 1000 // Limpieza más frecuente
      },
      monitoring: {
        ...baseConfig.monitoring,
        enableLogging: true,
        logLevel: 'debug'
      }
    };
  }
  
  // Configuración para producción
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      cache: {
        ...baseConfig.cache,
        maxSize: 2000, // Mayor caché en producción
        cleanupInterval: 60 * 60 * 1000 // Limpieza cada hora
      },
      monitoring: {
        ...baseConfig.monitoring,
        enableLogging: false,
        logLevel: 'error'
      }
    };
  }
  
  return baseConfig;
};

// Configuración específica para componentes médicos
export const medicalComponentConfig: Partial<PerformanceConfig> = {
  cache: {
    maxSize: 1500,
    defaultTTL: 48 * 60 * 60 * 1000, // 48 horas para datos médicos
    cleanupInterval: 60 * 60 * 1000, // 1 hora
    compressionEnabled: true,
    persistenceEnabled: true,
    preloadEnabled: true
  },
  rendering: {
    enableDebouncing: true,
    enableMemoization: true,
    enableVirtualization: false,
    maxRenders: 50, // Menos renders para componentes médicos
    debounceDelay: 500 // Más delay para operaciones médicas
  },
  network: {
    enablePreloading: true,
    enablePrefetching: true,
    maxConcurrentRequests: 3, // Menos requests concurrentes
    requestTimeout: 45000, // Más tiempo para APIs médicas
    retryAttempts: 5 // Más reintentos para operaciones críticas
  }
};

// Configuración para análisis de imágenes
export const imageAnalysisConfig: Partial<PerformanceConfig> = {
  cache: {
    maxSize: 2000,
    defaultTTL: 7 * 24 * 60 * 60 * 1000, // 7 días para análisis de imágenes
    cleanupInterval: 2 * 60 * 60 * 1000, // 2 horas
    compressionEnabled: true,
    persistenceEnabled: true,
    preloadEnabled: false // No preload para imágenes
  },
  rendering: {
    enableDebouncing: true,
    enableMemoization: true,
    enableVirtualization: true, // Virtualización para listas de imágenes
    maxRenders: 25,
    debounceDelay: 1000 // Más delay para procesamiento de imágenes
  },
  network: {
    enablePreloading: false,
    enablePrefetching: false,
    maxConcurrentRequests: 2, // Solo 2 análisis concurrentes
    requestTimeout: 60000, // 1 minuto para análisis de imágenes
    retryAttempts: 2
  }
};

// Configuración para investigación clínica
export const researchConfig: Partial<PerformanceConfig> = {
  cache: {
    maxSize: 3000,
    defaultTTL: 72 * 60 * 60 * 1000, // 3 días para investigaciones
    cleanupInterval: 4 * 60 * 60 * 1000, // 4 horas
    compressionEnabled: true,
    persistenceEnabled: true,
    preloadEnabled: true
  },
  rendering: {
    enableDebouncing: true,
    enableMemoization: true,
    enableVirtualization: false,
    maxRenders: 75,
    debounceDelay: 400
  },
  network: {
    enablePreloading: true,
    enablePrefetching: true,
    maxConcurrentRequests: 4,
    requestTimeout: 40000,
    retryAttempts: 4
  }
};

// Utilidades para aplicar configuración
export const applyPerformanceConfig = (config: PerformanceConfig) => {
  // Aplicar configuración al sistema de caché
  if (typeof window !== 'undefined') {
    // Configurar localStorage para persistencia
    if (config.cache.persistenceEnabled) {
      localStorage.setItem('performance_config', JSON.stringify(config));
    }
    
    // Configurar monitoreo de rendimiento
    if (config.monitoring.enableMetrics) {
      // Registrar métricas de rendimiento
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (config.monitoring.enableLogging) {
            console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }
  
  return config;
};

// Obtener configuración optimizada para el entorno actual
export const getOptimizedConfig = (): PerformanceConfig => {
  const baseConfig = getPerformanceConfig();
  return applyPerformanceConfig(baseConfig);
};
