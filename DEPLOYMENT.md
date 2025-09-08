# Guía de Despliegue en Vercel

## Configuración Inicial

### 1. Preparar el Repositorio
```bash
# Asegúrate de que todos los cambios estén en GitHub
git add .
git commit -m "Optimización para Vercel"
git push origin main
```

### 2. Conectar con Vercel

1. **Ir a [vercel.com](https://vercel.com)**
2. **Iniciar sesión** con tu cuenta de GitHub
3. **Importar proyecto** desde GitHub
4. **Seleccionar el repositorio** `Agente-de-investigaci-n-oftalmologia-`

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ir a **Settings > Environment Variables** y agregar:

```
GEMINI_API_KEY = tu_api_key_real_aqui
```

**Obtener API Key:**
1. Ir a [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Iniciar sesión con tu cuenta de Google
3. Crear una nueva API key
4. Copiar la key y pegarla en Vercel

### 4. Configuración del Proyecto

Vercel detectará automáticamente que es una aplicación Vite y usará la configuración de `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

## Optimizaciones Implementadas

### 1. Configuración de Vite Optimizada
- **Minificación:** Terser para compresión máxima
- **Code Splitting:** Chunks separados para vendor, UI y AI
- **Tree Shaking:** Eliminación de código no utilizado
- **Console Removal:** Eliminación de logs en producción

### 2. Headers de Seguridad
- **X-Content-Type-Options:** Prevención de MIME sniffing
- **X-Frame-Options:** Prevención de clickjacking
- **X-XSS-Protection:** Protección contra XSS

### 3. Caching Optimizado
- **Assets estáticos:** Cache de 1 año
- **SPA Routing:** Rewrites para React Router

### 4. Variables de Entorno
- **Compatibilidad:** Soporte para `API_KEY` y `GEMINI_API_KEY`
- **Validación:** Error claro si falta la API key

## Comandos de Despliegue

### Despliegue Automático
```bash
# Push a main branch activa despliegue automático
git push origin main
```

### Despliegue Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

## Verificación Post-Despliegue

### 1. Verificar Funcionamiento
- [ ] La aplicación carga correctamente
- [ ] El formulario de entrada funciona
- [ ] La investigación se ejecuta sin errores
- [ ] Los reportes se generan correctamente
- [ ] Las fuentes se muestran como enlaces

### 2. Verificar Performance
- [ ] Tiempo de carga < 3 segundos
- [ ] Assets optimizados (JS, CSS)
- [ ] Imágenes comprimidas
- [ ] Caching funcionando

### 3. Verificar Seguridad
- [ ] Headers de seguridad activos
- [ ] HTTPS habilitado
- [ ] Variables de entorno protegidas

## Troubleshooting

### Error: "GEMINI_API_KEY no está configurada"
**Solución:** Verificar que la variable de entorno esté configurada en Vercel Dashboard

### Error: "Build failed"
**Solución:** Verificar logs de build en Vercel Dashboard > Functions

### Error: "Module not found"
**Solución:** Verificar que todas las dependencias estén en `package.json`

### Error: "CORS"
**Solución:** La aplicación es SPA, no debería tener problemas de CORS

## Monitoreo

### 1. Analytics de Vercel
- **Visitas:** Dashboard > Analytics
- **Performance:** Core Web Vitals
- **Errores:** Function logs

### 2. Logs
- **Build logs:** Vercel Dashboard > Deployments
- **Runtime logs:** Vercel Dashboard > Functions

## Actualizaciones

### 1. Actualización de Código
```bash
# Hacer cambios
git add .
git commit -m "Descripción del cambio"
git push origin main
# Vercel desplegará automáticamente
```

### 2. Actualización de Variables de Entorno
1. Ir a Vercel Dashboard > Settings > Environment Variables
2. Actualizar el valor
3. Redesplegar la aplicación

### 3. Rollback
1. Ir a Vercel Dashboard > Deployments
2. Seleccionar versión anterior
3. Hacer "Promote to Production"

## Costos

### Plan Gratuito de Vercel
- **Bandwidth:** 100GB/mes
- **Build minutes:** 6000/mes
- **Function executions:** 100GB-hrs/mes
- **Suficiente para:** Aplicación de uso moderado

### Plan Pro (si es necesario)
- **Bandwidth:** 1TB/mes
- **Build minutes:** 6000/mes
- **Function executions:** 1000GB-hrs/mes
- **Precio:** $20/mes

## URLs de Producción

Una vez desplegado, la aplicación estará disponible en:
- **URL principal:** `https://tu-proyecto.vercel.app`
- **URLs de preview:** `https://tu-proyecto-git-branch.vercel.app`

## Soporte

Para problemas específicos de Vercel:
- **Documentación:** [vercel.com/docs](https://vercel.com/docs)
- **Soporte:** Vercel Dashboard > Help
- **Community:** [github.com/vercel/vercel](https://github.com/vercel/vercel)
