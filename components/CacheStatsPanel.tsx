import React, { useState, useEffect } from 'react';
import { advancedCache, CacheStats } from '../services/advancedCacheService';

interface CacheStatsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const CacheStatsPanel: React.FC<CacheStatsPanelProps> = ({ isVisible, onClose }) => {
  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
    memoryUsage: 0
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats(advancedCache.getStats());
    };

    // Actualizar estadísticas cada 5 segundos
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Actualizar inmediatamente

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  const getHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHitRateStatus = (rate: number): string => {
    if (rate >= 0.8) return 'Excelente';
    if (rate >= 0.6) return 'Buena';
    if (rate >= 0.4) return 'Regular';
    return 'Necesita mejora';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl border-2 border-slate-200 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-slate-800">Rendimiento de Caché</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              <svg 
                className={`w-4 h-4 text-slate-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
              title="Cerrar"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Content */}
        <div className="p-4">
          {/* Hit Rate - Principal métrica */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Tasa de Aciertos</span>
              <span className={`text-lg font-bold ${getHitRateColor(stats.hitRate)}`}>
                {formatPercentage(stats.hitRate)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.hitRate >= 0.8 ? 'bg-green-500' : 
                  stats.hitRate >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.hitRate * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {getHitRateStatus(stats.hitRate)}
            </p>
          </div>

          {/* Estadísticas básicas */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.hits}</div>
              <div className="text-xs text-slate-500">Aciertos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.misses}</div>
              <div className="text-xs text-slate-500">Fallos</div>
            </div>
          </div>

          {/* Estadísticas expandidas */}
          {isExpanded && (
            <div className="space-y-3 border-t border-slate-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Entradas en Caché</span>
                <span className="font-semibold text-slate-800">{stats.size}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Memoria Usada</span>
                <span className="font-semibold text-slate-800">{formatBytes(stats.memoryUsage)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Evicciones</span>
                <span className="font-semibold text-slate-800">{stats.evictions}</span>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => {
                advancedCache.clear();
                setStats(advancedCache.getStats());
              }}
              className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded hover:bg-red-200 transition-colors"
            >
              Limpiar Caché
            </button>
            <button
              onClick={() => setStats(advancedCache.getStats())}
              className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        {/* Footer con información adicional */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 rounded-b-lg">
          <p className="text-xs text-slate-500 text-center">
            Optimización automática activa
          </p>
        </div>
      </div>
    </div>
  );
};

export default CacheStatsPanel;
