# Sistema de Tipografía - Agente de Investigación Oftalmológica

## Jerarquía de Tamaños Armonizada

### Títulos Principales
- **H1 - Títulos de Página**: `text-xl lg:text-2xl font-bold`
- **H2 - Títulos de Sección**: `text-lg lg:text-xl font-semibold`
- **H3 - Subtítulos**: `text-base lg:text-lg font-medium`
- **H4 - Títulos Menores**: `text-base font-semibold`

### Texto de Contenido
- **Párrafos**: `text-sm leading-6`
- **Listas**: `text-sm space-y-1`
- **Texto Destacado**: `text-sm font-medium`
- **Texto Secundario**: `text-xs text-slate-500`

### Elementos de Interfaz
- **Botones Principales**: `text-sm font-semibold`
- **Botones Secundarios**: `text-sm font-medium`
- **Enlaces**: `text-sm hover:underline`
- **Etiquetas**: `text-xs font-medium`

### Elementos Visuales
- **Círculos de Métricas**: `w-12 h-12 text-sm font-semibold`
- **Indicadores Pequeños**: `w-6 h-6 text-xs font-semibold`
- **Badges**: `text-xs font-medium`

## Principios de Diseño

1. **Consistencia**: Todos los elementos del mismo tipo usan la misma clase de tamaño
2. **Escalabilidad**: Responsive design con `lg:` breakpoint para pantallas grandes
3. **Legibilidad**: Tamaños mínimos que garanticen lectura cómoda en móvil
4. **Jerarquía Visual**: Clara diferenciación entre niveles de importancia

## Aplicación en Componentes

- ✅ `App.tsx` - Armonizado
- ✅ `Header.tsx` - Armonizado
- ✅ `Footer.tsx` - Ya consistente
- ✅ `EnhancedReportDisplay.tsx` - Armonizado
- ✅ `Spinner.tsx` - Armonizado
- ✅ Métricas visuales - Corregidas

## Notas de Implementación

- Eliminación de tamaños excesivos (`text-2xl+`) en favor de escalado responsivo
- Unificación de tamaños de fuente entre componentes similares  
- Corrección de elementos visuales deformados (círculos de métricas)
- Mantenimiento de accesibilidad con tamaños mínimos adecuados