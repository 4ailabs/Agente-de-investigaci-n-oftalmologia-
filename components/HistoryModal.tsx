import React from 'react';
import { StoredInvestigation } from '../services/localStorageService';
import { 
  Clock, 
  X, 
  FileText, 
  ArrowUp, 
  Copy, 
  Trash2, 
  FileDown, 
  Download, 
  Upload 
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigations: StoredInvestigation[];
  onLoadInvestigation: (id: string) => void;
  onDeleteInvestigation: (id: string) => void;
  onExportInvestigation: (id: string) => void;
  onCopyInvestigation: (id: string) => void;
  onExportPDF: (id: string) => void;
  onExportSummaryPDF: (id: string) => void;
  currentInvestigationId: string | null;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  investigations,
  onLoadInvestigation,
  onDeleteInvestigation,
  onExportInvestigation,
  onCopyInvestigation,
  onExportPDF,
  onExportSummaryPDF,
  currentInvestigationId
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'active':
        return 'Activa';
      case 'archived':
        return 'Archivada';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Historial de Investigaciones</h2>
                <p className="text-sm text-slate-600">{investigations.length} investigaciones guardadas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {investigations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay investigaciones guardadas</h3>
              <p className="text-slate-600">Las investigaciones se guardarán automáticamente cuando inicies una nueva.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {investigations.map((investigation) => (
                <div
                  key={investigation.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    currentInvestigationId === investigation.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investigation.investigation?.isGenerating ? 'active' : 'completed')}`}>
                          {getStatusText(investigation.investigation?.isGenerating ? 'active' : 'completed')}
                        </span>
                        {currentInvestigationId === investigation.id && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Actual
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {investigation.patientInfo.age} años, {investigation.patientInfo.sex}
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {investigation.patientInfo.symptoms}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(new Date(investigation.createdAt).getTime())}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                        <span>{investigation.investigation.plan.length} pasos</span>
                        <span>•</span>
                        <span>
                          {investigation.investigation.plan.filter(step => step.status === 'completed').length} completados
                        </span>
                        {investigation.investigation.finalReport && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">Reporte final disponible</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {/* Primera fila de botones */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onLoadInvestigation(investigation.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Cargar investigación"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onCopyInvestigation(investigation.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Copiar resumen al portapapeles"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onDeleteInvestigation(investigation.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar investigación"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Segunda fila de botones - Exportar */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onExportPDF(investigation.id)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                          title="Exportar PDF completo"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onExportSummaryPDF(investigation.id)}
                          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                          title="Exportar PDF resumen"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onExportInvestigation(investigation.id)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Descargar archivo JSON"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="space-y-3">
            {/* Leyenda de iconos */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-700">Acciones principales:</div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                    <ArrowUp className="h-3 w-3 text-blue-600" />
                  </div>
                  <span>Cargar</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
                    <Copy className="h-3 w-3 text-green-600" />
                  </div>
                  <span>Copiar</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </div>
                  <span>Eliminar</span>
                </div>
              </div>
              
              <div className="text-xs font-medium text-slate-700">Exportar:</div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center">
                    <FileDown className="h-3 w-3 text-orange-600" />
                  </div>
                  <span>PDF completo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-amber-100 rounded flex items-center justify-center">
                    <FileText className="h-3 w-3 text-amber-600" />
                  </div>
                  <span>PDF resumen</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                    <Download className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>JSON</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Las investigaciones se guardan automáticamente en tu navegador
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
