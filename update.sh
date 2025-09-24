#!/bin/bash

# Script de actualización automática desde GitHub
# Este script sincroniza el repositorio local con GitHub y reconstruye la aplicación

echo "🔄 Iniciando actualización desde GitHub..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio del proyecto."
    exit 1
fi

# 1. Verificar estado del repositorio
print_status "Verificando estado del repositorio..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Hay cambios sin confirmar en el repositorio local."
    echo "¿Deseas guardar los cambios antes de actualizar? (y/n)"
    read -r response
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        git add .
        echo "Ingresa un mensaje de commit:"
        read -r commit_message
        git commit -m "$commit_message"
        print_success "Cambios guardados localmente."
    else
        print_warning "Continuando sin guardar cambios locales..."
    fi
fi

# 2. Obtener cambios desde GitHub
print_status "Obteniendo cambios desde GitHub..."
git fetch origin

# 3. Verificar si hay actualizaciones disponibles
current_branch=$(git branch --show-current)
remote_commits=$(git rev-list HEAD..origin/$current_branch --count)
local_commits=$(git rev-list origin/$current_branch..HEAD --count)

if [ "$remote_commits" -eq 0 ] && [ "$local_commits" -eq 0 ]; then
    print_success "El repositorio local ya está actualizado con GitHub."
else
    print_status "Encontradas $remote_commits actualizaciones en GitHub."
    
    # 4. Hacer pull de los cambios
    print_status "Aplicando cambios desde GitHub..."
    if git pull origin $current_branch; then
        print_success "Cambios aplicados exitosamente desde GitHub."
    else
        print_error "Error al aplicar cambios desde GitHub."
        exit 1
    fi
fi

# 5. Instalar dependencias actualizadas
print_status "Instalando dependencias actualizadas..."
if npm install; then
    print_success "Dependencias instaladas correctamente."
else
    print_error "Error al instalar dependencias."
    exit 1
fi

# 6. Construir la aplicación
print_status "Construyendo la aplicación..."
if npm run build; then
    print_success "Aplicación construida exitosamente."
else
    print_error "Error al construir la aplicación."
    exit 1
fi

# 7. Verificar el estado final
print_status "Verificando estado final..."
echo "📊 Resumen de la actualización:"
echo "   - Rama actual: $current_branch"
echo "   - Último commit: $(git log --oneline -1)"
echo "   - Estado del repositorio: $(git status --porcelain | wc -l) archivos modificados"

print_success "✅ Actualización completada exitosamente!"
echo ""
echo "🚀 Para ejecutar la aplicación en modo desarrollo:"
echo "   npm run dev"
echo ""
echo "🌐 Para desplegar en Vercel:"
echo "   git push origin main"
echo ""
