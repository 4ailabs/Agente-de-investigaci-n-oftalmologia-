// PDF Service for Medical Reports
// Genera reportes PDF profesionales para investigaciones oftalmológicas

import jsPDF from 'jspdf';
import { StoredInvestigation } from './localStorageService';

export class PDFService {
  private static readonly FONT_SIZE = {
    TITLE: 18,
    SUBTITLE: 14,
    BODY: 11,
    SMALL: 9
  };

  private static readonly MARGINS = {
    TOP: 20,
    BOTTOM: 20,
    LEFT: 20,
    RIGHT: 20
  };

  private static readonly COLORS = {
    PRIMARY: '#1e40af', // blue-800
    SECONDARY: '#374151', // gray-700
    ACCENT: '#059669', // emerald-600
    TEXT: '#111827' // gray-900
  };

  // Generar PDF de investigación completa
  static async generateInvestigationPDF(investigation: StoredInvestigation): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.MARGINS.TOP;

    // Configurar fuente
    doc.setFont('helvetica');

    // Header con logo y título
    yPosition = this.addHeader(doc, yPosition, investigation);

    // Información del paciente
    yPosition = this.addPatientInfo(doc, yPosition, investigation);

    // Plan de investigación
    yPosition = this.addInvestigationPlan(doc, yPosition, investigation);

    // Reporte final (si existe)
    if (investigation.investigation.finalReport) {
      yPosition = this.addFinalReport(doc, yPosition, investigation);
    }

    // Footer
    this.addFooter(doc, investigation);

    // Descargar archivo
    const fileName = `Investigacion_Oftalmologica_${investigation.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Agregar header del documento
  private static addHeader(doc: jsPDF, yPosition: number, investigation: StoredInvestigation): number {
    // Logo/Icono (simulado con texto)
    doc.setFontSize(this.FONT_SIZE.TITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('🔍', this.MARGINS.LEFT, yPosition);
    
    // Título principal
    doc.setFontSize(this.FONT_SIZE.TITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('Agente de Investigación Clínica de Oftalmología', this.MARGINS.LEFT + 10, yPosition);
    
    yPosition += 8;

    // Subtítulo
    doc.setFontSize(this.FONT_SIZE.SUBTITLE);
    doc.setTextColor(this.COLORS.SECONDARY);
    doc.text('Reporte de Investigación Médica', this.MARGINS.LEFT + 10, yPosition);
    
    yPosition += 10;

    // Línea separadora
    doc.setDrawColor(this.COLORS.PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(this.MARGINS.LEFT, yPosition, doc.internal.pageSize.width - this.MARGINS.RIGHT, yPosition);
    
    yPosition += 15;

    return yPosition;
  }

  // Agregar información del paciente
  private static addPatientInfo(doc: jsPDF, yPosition: number, investigation: StoredInvestigation): number {
    doc.setFontSize(this.FONT_SIZE.SUBTITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('INFORMACIÓN DEL PACIENTE', this.MARGINS.LEFT, yPosition);
    yPosition += 8;

    doc.setFontSize(this.FONT_SIZE.BODY);
    doc.setTextColor(this.COLORS.TEXT);
    
    // Datos básicos
    doc.text(`Edad: ${investigation.patientInfo.age} años`, this.MARGINS.LEFT, yPosition);
    doc.text(`Sexo: ${investigation.patientInfo.sex}`, this.MARGINS.LEFT + 60, yPosition);
    yPosition += 6;

    doc.text(`Fecha de Investigación: ${new Date(investigation.createdAt).toLocaleDateString('es-ES')}`, this.MARGINS.LEFT, yPosition);
    yPosition += 6;

    // Síntomas
    doc.text('Síntomas Reportados:', this.MARGINS.LEFT, yPosition);
    yPosition += 6;

    const symptoms = investigation.patientInfo.symptoms;
    const splitSymptoms = doc.splitTextToSize(symptoms, doc.internal.pageSize.width - this.MARGINS.LEFT - this.MARGINS.RIGHT);
    doc.text(splitSymptoms, this.MARGINS.LEFT + 10, yPosition);
    yPosition += splitSymptoms.length * 5 + 10;

    return yPosition;
  }

  // Agregar plan de investigación
  private static addInvestigationPlan(doc: jsPDF, yPosition: number, investigation: StoredInvestigation): number {
    // Verificar si hay espacio para la sección
    if (yPosition > doc.internal.pageSize.height - 100) {
      doc.addPage();
      yPosition = this.MARGINS.TOP;
    }

    doc.setFontSize(this.FONT_SIZE.SUBTITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('PLAN DE INVESTIGACIÓN', this.MARGINS.LEFT, yPosition);
    yPosition += 8;

    if (investigation.investigation.plan && investigation.investigation.plan.length > 0) {
      investigation.investigation.plan.forEach((step: any, index: number) => {
        // Verificar si hay espacio para el paso
        if (yPosition > doc.internal.pageSize.height - 30) {
          doc.addPage();
          yPosition = this.MARGINS.TOP;
        }

        doc.setFontSize(this.FONT_SIZE.BODY);
        doc.setTextColor(this.COLORS.TEXT);
        
        // Número y estado del paso
        const status = step.status === 'completed' ? '✓' : step.status === 'in-progress' ? '⏳' : '○';
        doc.text(`${index + 1}. ${status}`, this.MARGINS.LEFT, yPosition);
        
        // Título del paso
        const stepTitle = step.title || 'Paso sin título';
        const splitTitle = doc.splitTextToSize(stepTitle, doc.internal.pageSize.width - this.MARGINS.LEFT - this.MARGINS.RIGHT - 20);
        doc.text(splitTitle, this.MARGINS.LEFT + 15, yPosition);
        yPosition += splitTitle.length * 5 + 3;

        // Descripción del paso (si existe)
        if (step.description) {
          doc.setFontSize(this.FONT_SIZE.SMALL);
          doc.setTextColor(this.COLORS.SECONDARY);
          const splitDesc = doc.splitTextToSize(step.description, doc.internal.pageSize.width - this.MARGINS.LEFT - this.MARGINS.RIGHT - 20);
          doc.text(splitDesc, this.MARGINS.LEFT + 15, yPosition);
          yPosition += splitDesc.length * 4 + 5;
        }

        yPosition += 3;
      });
    } else {
      doc.setFontSize(this.FONT_SIZE.BODY);
      doc.setTextColor(this.COLORS.SECONDARY);
      doc.text('No hay pasos de investigación registrados.', this.MARGINS.LEFT, yPosition);
      yPosition += 10;
    }

    yPosition += 10;
    return yPosition;
  }

  // Agregar reporte final
  private static addFinalReport(doc: jsPDF, yPosition: number, investigation: StoredInvestigation): number {
    // Verificar si hay espacio para la sección
    if (yPosition > doc.internal.pageSize.height - 100) {
      doc.addPage();
      yPosition = this.MARGINS.TOP;
    }

    doc.setFontSize(this.FONT_SIZE.SUBTITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('REPORTE FINAL', this.MARGINS.LEFT, yPosition);
    yPosition += 8;

    doc.setFontSize(this.FONT_SIZE.BODY);
    doc.setTextColor(this.COLORS.TEXT);

    // Procesar el reporte final
    const report = investigation.investigation.finalReport;
    
    // Limpiar el texto del reporte (remover markdown básico)
    const cleanReport = report
      .replace(/#{1,6}\s*/g, '') // Remover headers markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remover italic markdown
      .replace(/```[\s\S]*?```/g, '') // Remover code blocks
      .replace(/`(.*?)`/g, '$1') // Remover inline code
      .replace(/\n{3,}/g, '\n\n') // Limitar saltos de línea múltiples
      .trim();

    // Dividir el reporte en párrafos
    const paragraphs = cleanReport.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      // Verificar si hay espacio para el párrafo
      if (yPosition > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPosition = this.MARGINS.TOP;
      }

      if (paragraph.trim()) {
        const splitParagraph = doc.splitTextToSize(paragraph.trim(), doc.internal.pageSize.width - this.MARGINS.LEFT - this.MARGINS.RIGHT);
        doc.text(splitParagraph, this.MARGINS.LEFT, yPosition);
        yPosition += splitParagraph.length * 5 + 5;
      }
    });

    yPosition += 10;
    return yPosition;
  }

  // Agregar footer del documento
  private static addFooter(doc: jsPDF, investigation: StoredInvestigation): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea separadora
      doc.setDrawColor(this.COLORS.PRIMARY);
      doc.setLineWidth(0.3);
      doc.line(this.MARGINS.LEFT, doc.internal.pageSize.height - 25, doc.internal.pageSize.width - this.MARGINS.RIGHT, doc.internal.pageSize.height - 25);
      
      // Texto del footer
      doc.setFontSize(this.FONT_SIZE.SMALL);
      doc.setTextColor(this.COLORS.SECONDARY);
      
      // Información de la página
      doc.text(`Página ${i} de ${pageCount}`, this.MARGINS.LEFT, doc.internal.pageSize.height - 15);
      
      // Información de la investigación
      doc.text(`ID: ${investigation.id}`, doc.internal.pageSize.width - this.MARGINS.RIGHT - 30, doc.internal.pageSize.height - 15);
      
      // Marca de agua
      doc.setFontSize(this.FONT_SIZE.SMALL);
      doc.setTextColor('#e5e7eb'); // gray-200
      doc.text('Generado por 4ailabs - Agente de Investigación Clínica de Oftalmología', 
        doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
  }

  // Generar PDF de resumen ejecutivo
  static async generateSummaryPDF(investigation: StoredInvestigation): Promise<void> {
    const doc = new jsPDF();
    let yPosition = this.MARGINS.TOP;

    // Header
    yPosition = this.addHeader(doc, yPosition, investigation);

    // Información del paciente (resumida)
    doc.setFontSize(this.FONT_SIZE.SUBTITLE);
    doc.setTextColor(this.COLORS.PRIMARY);
    doc.text('RESUMEN EJECUTIVO', this.MARGINS.LEFT, yPosition);
    yPosition += 8;

    doc.setFontSize(this.FONT_SIZE.BODY);
    doc.setTextColor(this.COLORS.TEXT);
    doc.text(`Paciente: ${investigation.patientInfo.age} años, ${investigation.patientInfo.sex}`, this.MARGINS.LEFT, yPosition);
    yPosition += 6;
    doc.text(`Fecha: ${new Date(investigation.createdAt).toLocaleDateString('es-ES')}`, this.MARGINS.LEFT, yPosition);
    yPosition += 6;
    doc.text(`Síntomas: ${investigation.patientInfo.symptoms}`, this.MARGINS.LEFT, yPosition);
    yPosition += 15;

    // Solo conclusiones principales del reporte final
    if (investigation.investigation.finalReport) {
      doc.setFontSize(this.FONT_SIZE.SUBTITLE);
      doc.setTextColor(this.COLORS.PRIMARY);
      doc.text('CONCLUSIONES PRINCIPALES', this.MARGINS.LEFT, yPosition);
      yPosition += 8;

      // Extraer solo las primeras líneas del reporte
      const report = investigation.investigation.finalReport;
      const firstLines = report.split('\n').slice(0, 20).join('\n');
      const cleanReport = firstLines
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .trim();

      doc.setFontSize(this.FONT_SIZE.BODY);
      doc.setTextColor(this.COLORS.TEXT);
      const splitReport = doc.splitTextToSize(cleanReport, doc.internal.pageSize.width - this.MARGINS.LEFT - this.MARGINS.RIGHT);
      doc.text(splitReport, this.MARGINS.LEFT, yPosition);
    }

    // Footer
    this.addFooter(doc, investigation);

    // Descargar archivo
    const fileName = `Resumen_Oftalmologico_${investigation.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}
