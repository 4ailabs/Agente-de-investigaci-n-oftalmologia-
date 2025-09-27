import { useEffect, useCallback, useRef } from 'react';
import { advancedCache, MedicalCacheUtils } from '../services/advancedCacheService';

interface PerformanceMetrics {
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  componentRenders: number;
}

interface OptimizationConfig {
  enableDebouncing: boolean;
  enableMemoization: boolean;
  enableVirtualization: boolean;
  enablePreloading: boolean;
  debounceDelay: number;
  maxRenders: number;
}

export const usePerformanceOptimization = (
  componentName: string,
  config: Partial<OptimizationConfig> = {}
) => {
  const defaultConfig: OptimizationConfig = {
    enableDebouncing: true,
    enableMemoization: true,
    enableVirtualization: false,
    enablePreloading: true,
    debounceDelay: 300,
    maxRenders: 100
  };

  const finalConfig = { ...defaultConfig, ...config };
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Medir tiempo de renderizado
  const measureRenderTime = useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    lastRenderTime.current = now;
    return renderTime;
  }, []);

  // Debounce para funciones costosas
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = finalConfig.debounceDelay
  ): T => {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }, [finalConfig.debounceDelay]);

  // Throttle para funciones que se ejecutan frecuentemente
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number = 1000
  ): T => {
    let inThrottle: boolean;
    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }, []);

  // Preload de datos críticos
  const preloadCriticalData = useCallback(async () => {
    if (!finalConfig.enablePreloading) return;

    try {
      // Preload de configuraciones médicas comunes
      const commonMedicalTerms = [
        'retinopatía diabética',
        'glaucoma',
        'catarata',
        'degeneración macular',
        'desprendimiento de retina'
      ];

      for (const term of commonMedicalTerms) {
        const cacheKey = MedicalCacheUtils.generateMedicalKey(
          term, 
          'gemini-1.5-pro', 
          ['oftalmología', 'diagnóstico']
        );
        
        // Verificar si ya está en caché
        if (!advancedCache.get(cacheKey)) {
          // Marcar para preload (no ejecutar inmediatamente)
          console.log(`Preloading data for: ${term}`);
        }
      }
    } catch (error) {
      console.warn('Error preloading critical data:', error);
    }
  }, [finalConfig.enablePreloading]);

  // Optimizar re-renders excesivos
  const optimizeRenders = useCallback(() => {
    renderCount.current++;
    
    if (renderCount.current > finalConfig.maxRenders) {
      console.warn(`Component ${componentName} has rendered ${renderCount.current} times. Consider optimization.`);
      
      // Sugerir optimizaciones
      const suggestions = [];
      if (!finalConfig.enableMemoization) {
        suggestions.push('Enable memoization with React.memo or useMemo');
      }
      if (!finalConfig.enableDebouncing) {
        suggestions.push('Enable debouncing for expensive operations');
      }
      
      if (suggestions.length > 0) {
        console.warn('Optimization suggestions:', suggestions);
      }
    }
  }, [componentName, finalConfig]);

  // Monitorear rendimiento
  const monitorPerformance = useCallback(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`);
          }
        });
      });

      performanceObserver.current.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }, []);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (performanceObserver.current) {
      performanceObserver.current.disconnect();
      performanceObserver.current = null;
    }
  }, []);

  // Hook principal
  useEffect(() => {
    const renderTime = measureRenderTime();
    optimizeRenders();

    // Log de rendimiento en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`Component ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }

    return () => {
      cleanup();
    };
  }, [componentName, measureRenderTime, optimizeRenders, cleanup]);

  // Inicializar monitoreo
  useEffect(() => {
    monitorPerformance();
    preloadCriticalData();

    return cleanup;
  }, [monitorPerformance, preloadCriticalData, cleanup]);

  // Obtener métricas actuales
  const getMetrics = useCallback((): PerformanceMetrics => {
    const cacheStats = advancedCache.getStats();
    
    return {
      renderTime: measureRenderTime(),
      cacheHitRate: cacheStats.hitRate,
      memoryUsage: cacheStats.memoryUsage,
      componentRenders: renderCount.current
    };
  }, [measureRenderTime]);

  // Optimizar caché para el componente
  const optimizeCache = useCallback((key: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const cacheKey = `${componentName}:${key}`;
    advancedCache.set(cacheKey, data, {
      priority,
      tags: [componentName, 'component_cache']
    });
  }, [componentName]);

  // Obtener datos del caché optimizado
  const getCachedData = useCallback((key: string) => {
    const cacheKey = `${componentName}:${key}`;
    return advancedCache.get(cacheKey);
  }, [componentName]);

  return {
    debounce,
    throttle,
    getMetrics,
    optimizeCache,
    getCachedData,
    preloadCriticalData
  };
};

// Hook específico para componentes de investigación médica
export const useMedicalResearchOptimization = () => {
  const { debounce, throttle, optimizeCache, getCachedData } = usePerformanceOptimization(
    'MedicalResearch',
    {
      enableDebouncing: true,
      enableMemoization: true,
      enablePreloading: true,
      debounceDelay: 500, // Más delay para operaciones médicas
      maxRenders: 50
    }
  );

  // Optimizar búsquedas médicas
  const optimizeMedicalSearch = useCallback((query: string, results: any) => {
    const medicalKeywords = query.toLowerCase().split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5); // Limitar a 5 palabras clave más relevantes

    optimizeCache(`search:${query}`, results, 'high');
  }, [optimizeCache]);

  // Optimizar análisis de imágenes
  const optimizeImageAnalysis = useCallback((imageHash: string, analysis: any) => {
    optimizeCache(`image:${imageHash}`, analysis, 'high');
  }, [optimizeCache]);

  return {
    debounce,
    throttle,
    optimizeMedicalSearch,
    optimizeImageAnalysis,
    getCachedData
  };
};
