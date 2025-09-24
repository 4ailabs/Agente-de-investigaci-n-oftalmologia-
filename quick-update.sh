#!/bin/bash

# Script de actualización rápida
# Para actualizaciones simples sin confirmaciones

echo "🔄 Actualización rápida desde GitHub..."

# Obtener cambios
git fetch origin
git pull origin main

# Instalar dependencias si es necesario
if [ -f "package-lock.json" ] && [ "package-lock.json" -nt "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Construir aplicación
echo "🔨 Construyendo aplicación..."
npm run build

echo "✅ Actualización rápida completada!"
