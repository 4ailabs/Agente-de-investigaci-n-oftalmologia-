# Agente de Investigación Clínica de IA - Oftalmología

Una aplicación web que utiliza Google Gemini para realizar investigaciones clínicas paso a paso en oftalmología, generando reportes médicos basados en evidencia.

##  Características

### 🔬 **Investigación Médica Avanzada**
- **Protocolo de 3 Fases**: Planificación → Ejecución → Síntesis
- **Validación Automática de Fuentes**: Scoring de autoridad médica (0-100 puntos)
- **Detección de Contradicciones**: Análisis automático de inconsistencias
- **Priorización de Evidencia**: Jerarquía basada en estándares médicos

### 🛡️ **Garantías de Calidad**
- **Disclaimers Médicos Obligatorios**: Advertencias legales y médicas
- **Filtrado de Fuentes**: Eliminación automática de fuentes no confiables
- **Evaluación de Evidencia**: Clasificación GRADE simplificada
- **Supervisión Médica**: Requerimiento de validación profesional

### 🧠 **Context Engineering Inteligente**
- **Gestión de Contexto**: Control automático de límites (8000 tokens)
- **Memoria Médica**: Persistencia de información del paciente
- **Resolución de Errores**: Estrategias automáticas de recuperación
- **Optimización de Prompts**: Templates especializados por fase

###  **Funcionalidades de Usuario**
- **Navegación Intuitiva**: Panel de control con indicadores de estado
- **Copiado Inteligente**: Exportación de pasos individuales y reportes completos
- **Fuentes Interactivas**: Enlaces directos a referencias médicas
- **Responsive Design**: Funciona en todos los dispositivos

###  **Métricas y Monitoreo**
- **Calidad en Tiempo Real**: Evaluación continua de fuentes
- **Consistencia**: Detección automática de contradicciones
- **Completitud**: Cobertura de aspectos clínicos relevantes
- **Trazabilidad**: Seguimiento completo de fuentes utilizadas

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript + Vite
- **IA**: Google Gemini API con búsqueda web
- **Estilos**: Tailwind CSS
- **Despliegue**: Vercel

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- Cuenta de Google con acceso a Gemini API

##  Ejecutar Localmente

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd Agente-de-investigaci-n-oftalmologia-
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   GEMINI_API_KEY=tu_api_key_aqui
   ```
   
   **Obtener API Key:**
   - Ve a [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Inicia sesión con tu cuenta de Google
   - Crea una nueva API key
   - Copia la key al archivo `.env`

4. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   La aplicación estará disponible en `http://localhost:5173`

##  Desplegar en Vercel

1. **Subir a GitHub**
   ```bash
   git add .
   git commit -m "Preparar para despliegue en Vercel"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub
   - Importa el repositorio
   - Configura la variable de entorno `GEMINI_API_KEY` en el dashboard de Vercel

3. **Desplegar**
   Vercel detectará automáticamente que es una aplicación Vite y la desplegará.

## 📁 Estructura del Proyecto

```
├── components/              # Componentes React
│   ├── Header.tsx          # Encabezado de la aplicación
│   ├── Footer.tsx          # Pie de página con créditos
│   ├── ExplanationModal.tsx # Modal explicativo del funcionamiento
│   └── ...                 # Otros componentes
├── services/               # Servicios
│   └── geminiService.ts    # Integración con Google Gemini API
├── medicalValidation.ts    # Validación médica y detección de contradicciones
├── contextOptimization.ts  # Optimizaciones de context engineering
├── medicalAccuracyAnalysis.md # Análisis de precisión médica
├── types.ts               # Definiciones de tipos TypeScript
├── constants.ts           # Prompts y configuraciones
├── App.tsx               # Componente principal
├── index.tsx             # Punto de entrada
└── vite.config.ts        # Configuración de Vite
```

##  Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Previsualizar build de producción

## 📝 Guía de Uso

### 🔬 **Proceso de Investigación Clínica**

La aplicación sigue un protocolo médico riguroso de 3 fases para garantizar investigaciones serias y precisas:

#### **Fase 1: Planificación**
1. **Ingresar Datos del Paciente**
   - Edad, sexo, síntomas principales
   - Antecedentes médicos relevantes
   - Características específicas del caso

2. **Generación Automática del Plan**
   - El sistema analiza la consulta
   - Crea un plan de investigación paso a paso
   - Prioriza fuentes de evidencia médica de alta calidad

#### **Fase 2: Ejecución**
3. **Ejecutar Pasos Secuencialmente**
   - Cada paso se ejecuta individualmente
   - Búsqueda automática en fuentes médicas autorizadas
   - Validación de calidad de evidencia en tiempo real
   - Detección automática de contradicciones

4. **Navegación entre Pasos**
   - Ver resultados de pasos completados
   - Copiar contenido de pasos individuales
   - Seguimiento del progreso en tiempo real

#### **Fase 3: Síntesis**
5. **Generar Reporte Clínico Final**
   - Síntesis clínica con diagnóstico más probable
   - Tabla de diagnósticos diferenciales estructurada
   - Análisis fisiopatológico detallado
   - Plan de acción con recomendaciones específicas

### 🛡️ **Garantías de Calidad Médica**

#### **Validación Automática de Fuentes**
- **Scoring de Autoridad**: Evaluación automática de calidad (0-100 puntos)
- **Fuentes Prioritarias**: Cochrane Library, PubMed, Guías Clínicas (AAO, ESCRS)
- **Filtrado Inteligente**: Eliminación automática de fuentes no confiables
- **Indicadores de Calidad**: Identificación de evidencia revisada por pares

#### **Detección de Contradicciones**
- **Análisis Automático**: Detección de información contradictoria entre fuentes
- **Resolución de Conflictos**: Priorización de evidencia de mayor calidad
- **Alertas de Consistencia**: Notificaciones sobre inconsistencias detectadas

#### **Disclaimers Médicos Obligatorios**
- ⚠️ **Advertencia de IA**: Clarificación de que es generado por inteligencia artificial
- 👨‍⚕️ **Supervisión Médica**: Requerimiento de validación por médico calificado
-  **No Diagnóstico**: Aclaración de que no constituye diagnóstico definitivo
-  **Calidad de Evidencia**: Información sobre limitaciones de las fuentes

###  **Funcionalidades Avanzadas**

#### **Sistema de Copiado Inteligente**
- **Copiar Pasos Individuales**: Incluye título, resultado y fuentes
- **Copiar Reporte Completo**: Exportación en formato Markdown
- **Formato Estructurado**: Mantiene estructura médica profesional

#### **Interfaz de Usuario Optimizada**
- **Panel de Control**: Navegación clara entre pasos de investigación
- **Indicadores de Estado**: Visualización del progreso y estado de cada paso
- **Fuentes Interactivas**: Enlaces directos a referencias médicas
- **Responsive Design**: Funciona en dispositivos móviles y escritorio

###  **Métricas de Calidad**

La aplicación implementa métricas automáticas para garantizar la seriedad de las investigaciones:

- **Porcentaje de Fuentes de Alta Calidad**: Objetivo >80%
- **Detección de Contradicciones**: 100% automática
- **Inclusión de Disclaimers**: 100% obligatorio
- **Validación de Evidencia**: 100% de fuentes evaluadas

### 🔍 **Protocolo de Fuentes Médicas**

El sistema prioriza automáticamente las fuentes en este orden:

1. **Revisiones Sistemáticas y Metaanálisis** (Cochrane Library, PubMed)
2. **Ensayos Clínicos Registrados** (ClinicalTrials.gov)
3. **Guías de Práctica Clínica** (AAO, ESCRS)
4. **Revistas Médicas Revisadas por Pares** (Lancet, JAMA Ophthalmology, NEJM)
5. **Bases de Datos de Autoridad** (UpToDate, Medscape)

###  **Flujo de Trabajo Recomendado**

1. **Preparación**: Reúne toda la información clínica disponible
2. **Ingreso de Datos**: Completa todos los campos del formulario inicial
3. **Ejecución**: Deja que el sistema ejecute todos los pasos automáticamente
4. **Revisión**: Examina cada paso y sus fuentes
5. **Validación**: Consulta con especialistas médicos antes de aplicar recomendaciones
6. **Aplicación**: Utiliza el reporte como guía complementaria al juicio clínico

### 🧠 **Context Engineering Avanzado**

La aplicación implementa técnicas avanzadas de context engineering para garantizar investigaciones médicas de alta calidad:

#### **Gestión Inteligente de Contexto**
- **Límites de Contexto**: Control automático del tamaño del contexto (8000 tokens)
- **Resumen Inteligente**: Mantiene solo información crítica y relevante
- **Priorización de Información**: Conserva pasos con alta confianza o recientes

#### **Memoria Médica Persistente**
- **Perfil del Paciente**: Mantiene información demográfica y clínica
- **Diagnósticos de Trabajo**: Actualiza probabilidades basadas en evidencia
- **Calidad de Evidencia**: Evalúa y clasifica fuentes automáticamente

#### **Detección y Resolución de Errores**
- **Detección Automática**: Identifica inconsistencias en la información
- **Estrategias de Recuperación**: Respuestas automáticas a errores comunes
- **Validación de Fuentes**: Verificación continua de confiabilidad

###  **Configuración Avanzada**

#### **Variables de Entorno**
```bash
# .env
GEMINI_API_KEY=tu_api_key_aqui
```

#### **Personalización de Validación**
- **Umbral de Calidad**: Ajustable según necesidades
- **Fuentes Personalizadas**: Agregar dominios de confianza
- **Criterios de Filtrado**: Modificar parámetros de validación

### 📈 **Monitoreo y Métricas**

La aplicación proporciona métricas en tiempo real para evaluar la calidad de las investigaciones:

- **Calidad de Fuentes**: Porcentaje de fuentes de alta autoridad
- **Consistencia**: Detección de contradicciones entre pasos
- **Completitud**: Cobertura de aspectos clínicos relevantes
- **Actualización**: Frescura de la información utilizada

## 🆕 **Mejoras Implementadas**

### **Validación Médica Avanzada**
-  **Sistema de Scoring**: Evaluación automática de autoridad de fuentes (0-100 puntos)
-  **Detección de Contradicciones**: Análisis automático de inconsistencias entre fuentes
-  **Filtrado Inteligente**: Eliminación automática de fuentes no confiables
-  **Disclaimers Obligatorios**: Advertencias legales y médicas en todos los reportes

### **Context Engineering Optimizado**
-  **Gestión de Contexto**: Control automático de límites de contexto
-  **Memoria Médica**: Persistencia de información del paciente
-  **Resolución de Errores**: Estrategias automáticas de recuperación
-  **Prompts Especializados**: Templates optimizados por fase de investigación

### **Interfaz de Usuario Mejorada**
-  **Disclaimers Visuales**: Alertas médicas prominentes en reportes
-  **Navegación Optimizada**: Panel de control con indicadores de estado
-  **Copiado Inteligente**: Exportación estructurada de contenido
-  **Responsive Design**: Funciona perfectamente en todos los dispositivos

### **Garantías de Calidad**
-  **Protocolo de Fuentes**: Jerarquía automática basada en evidencia médica
-  **Métricas en Tiempo Real**: Evaluación continua de calidad
-  **Trazabilidad Completa**: Seguimiento de todas las fuentes utilizadas
-  **Validación Profesional**: Requerimiento de supervisión médica

## ⚠️ **Importante**

Esta aplicación está diseñada como una **herramienta de apoyo** para profesionales médicos y **NO reemplaza** el juicio clínico profesional. Todas las recomendaciones deben ser validadas por un médico calificado antes de su aplicación en pacientes reales.

## 📞 **Soporte**

Para preguntas técnicas o sugerencias de mejora, contacta al equipo de desarrollo en [4 ailabs](https://4ailabs.com).
