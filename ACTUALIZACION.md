# 🔄 Guía de Actualización de la Aplicación

## 📋 Métodos de Actualización

### 1. **Actualización Automática Completa** (Recomendado)
```bash
./update.sh
```
- ✅ Verifica cambios pendientes
- ✅ Sincroniza con GitHub
- ✅ Instala dependencias
- ✅ Construye la aplicación
- ✅ Muestra resumen completo

### 2. **Actualización Rápida**
```bash
./quick-update.sh
```
- ⚡ Actualización sin confirmaciones
- ⚡ Ideal para cambios menores
- ⚡ Proceso más rápido

### 3. **Actualización Manual**
```bash
# Obtener cambios desde GitHub
git fetch origin
git pull origin main

# Instalar dependencias (si es necesario)
npm install

# Construir la aplicación
npm run build

# Ejecutar en modo desarrollo
npm run dev
```

## 🚀 Despliegue en Vercel

### Despliegue Automático
La aplicación está configurada para desplegarse automáticamente en Vercel cuando haces push a la rama `main`:

```bash
git push origin main
```

### Verificar Despliegue
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Busca el proyecto "Agente-de-investigaci-n-oftalmologia-"
3. Verifica que el último commit esté desplegado

## 🔧 Configuración de GitHub Actions (Opcional)

Si quieres configurar despliegue automático con GitHub Actions, puedes crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📊 Verificación de Estado

### Verificar Sincronización
```bash
# Ver estado del repositorio
git status

# Ver commits recientes
git log --oneline -5

# Verificar diferencias con GitHub
git fetch origin
git log --oneline HEAD..origin/main
```

### Verificar Aplicación
```bash
# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

## 🛠️ Solución de Problemas

### Error: "Working tree is dirty"
```bash
# Guardar cambios pendientes
git add .
git commit -m "Guardar cambios antes de actualizar"

# O descartar cambios
git stash
git pull origin main
git stash pop
```

### Error: "Merge conflicts"
```bash
# Resolver conflictos manualmente
git status
# Editar archivos con conflictos
git add .
git commit -m "Resolver conflictos de merge"
```

### Error: "Dependencies not found"
```bash
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas Importantes

- **Siempre respalda** tu trabajo antes de actualizar
- **Verifica** que la aplicación funcione después de actualizar
- **Revisa** los logs de Vercel si hay problemas de despliegue
- **Mantén** tu rama local sincronizada con `main`

## 🔗 Enlaces Útiles

- [GitHub Repository](https://github.com/4ailabs/Agente-de-investigaci-n-oftalmologia-)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de React](https://react.dev/)
