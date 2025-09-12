import Tesseract from 'tesseract.js';
import { MedicalDataExtractionService } from './medicalDataExtraction';

export interface CapturedImage {
  id: string;
  file: File;
  preview: string;
  extractedText?: string;
  processedData?: any;
}

export interface DocumentCaptureResult {
  images: CapturedImage[];
  combinedText: string;
  extractedData: any;
  confidence: number;
}

export class DocumentCaptureService {
  private static instance: DocumentCaptureService;
  private worker: Tesseract.Worker | null = null;

  static getInstance(): DocumentCaptureService {
    if (!DocumentCaptureService.instance) {
      DocumentCaptureService.instance = new DocumentCaptureService();
    }
    return DocumentCaptureService.instance;
  }

  async initializeWorker(): Promise<void> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('spa+eng', 1, {
        logger: m => {
          // Solo mostrar logs importantes, no todos los de progreso
          if (m.status === 'recognizing text' && m.progress === 1) {
            console.log('OCR completado');
          }
        }
      });
      await this.worker.load();
      await (this.worker as any).loadLanguage('spa+eng');
      await (this.worker as any).initialize();
    }
  }

  async captureFromCamera(): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.capture = 'environment'; // Usar cámara trasera en móviles
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length === 0) {
          reject(new Error('No se seleccionaron imágenes'));
          return;
        }
        resolve(files);
      };
      
      input.oncancel = () => {
        reject(new Error('Captura cancelada'));
      };
      
      input.click();
    });
  }

  async processImages(files: File[]): Promise<CapturedImage[]> {
    const images: CapturedImage[] = [];
    
    for (const file of files) {
      const image: CapturedImage = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      };
      
      try {
        // Validar tamaño de imagen antes de procesar
        const isValidSize = await this.validateImageSize(file);
        if (!isValidSize) {
          image.extractedText = 'Imagen demasiado pequeña para OCR. Intenta con una imagen más grande y clara.';
          images.push(image);
          continue;
        }

        // Extraer texto usando OCR
        await this.initializeWorker();
        if (this.worker) {
          const { data: { text, confidence } } = await this.worker.recognize(file);
          image.extractedText = text;
          
          // Solo extraer datos médicos si hay texto y no hay error de cuota
          if (text.trim()) {
            try {
              const { structuredData } = await MedicalDataExtractionService.extractFromAudioTranscription(text);
              image.processedData = structuredData;
            } catch (apiError: any) {
              if (apiError.message?.includes('429') || apiError.message?.includes('quota')) {
                image.extractedText = text + '\n\n[Nota: Cuota de API excedida. Los datos se extraerán cuando esté disponible.]';
              } else {
                throw apiError;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error procesando imagen:', error);
        image.extractedText = 'Error al procesar la imagen';
      }
      
      images.push(image);
    }
    
    return images;
  }

  private async validateImageSize(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Validar que la imagen tenga al menos 100x100 píxeles
        const isValid = img.width >= 100 && img.height >= 100;
        resolve(isValid);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  }

  async extractMedicalDataFromImages(images: CapturedImage[]): Promise<DocumentCaptureResult> {
    const combinedText = images
      .map(img => img.extractedText || '')
      .filter(text => text.trim())
      .join('\n\n---\n\n');

    let extractedData = {};
    let confidence = 0;

    if (combinedText.trim()) {
      try {
        const result = await MedicalDataExtractionService.extractFromAudioTranscription(combinedText);
        extractedData = result.structuredData;
        confidence = result.quality.overallQuality || 0;
      } catch (error) {
        console.error('Error extrayendo datos médicos:', error);
      }
    }

    return {
      images,
      combinedText,
      extractedData,
      confidence
    };
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Limpiar URLs de preview para evitar memory leaks
  cleanupImagePreviews(images: CapturedImage[]): void {
    images.forEach(image => {
      if (image.preview.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview);
      }
    });
  }
}

export default DocumentCaptureService;
