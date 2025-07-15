#!/bin/bash

#####################################################
# Script de configuración inicial para desarrollo Docker
# Actual Budget Fork
#####################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${BLUE}🚀 $1${NC}"
    echo "========================================"
}

# Función para verificar dependencias
check_dependencies() {
    log_header "Verificando dependencias"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        echo "Instala Docker desde: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_success "Docker encontrado: $(docker --version)"
    
    # Verificar Docker Compose
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose no está disponible"
        echo "Asegúrate de tener Docker Compose v2+"
        exit 1
    fi
    log_success "Docker Compose encontrado: $(docker compose version)"
    
    # Verificar que Docker esté corriendo
    if ! docker info &> /dev/null; then
        log_error "Docker no está corriendo"
        echo "Inicia Docker Desktop o el daemon de Docker"
        exit 1
    fi
    log_success "Docker daemon está corriendo"
    
    # Verificar Node.js (opcional para desarrollo local)
    if command -v node &> /dev/null; then
        log_success "Node.js encontrado: $(node --version)"
    else
        log_warning "Node.js no encontrado (solo necesario para desarrollo local)"
    fi
    
    # Verificar Yarn (opcional)
    if command -v yarn &> /dev/null; then
        log_success "Yarn encontrado: $(yarn --version)"
    else
        log_warning "Yarn no encontrado (solo necesario para desarrollo local)"
    fi
}

# Función para configurar archivos
setup_files() {
    log_header "Configurando archivos de desarrollo"
    
    # Copiar .env.example a .env.local si no existe
    if [ ! -f ".env.local" ]; then
        cp .env.example .env.local
        log_success "Archivo .env.local creado desde .env.example"
        log_info "Puedes editar .env.local para personalizar la configuración"
    else
        log_info "Archivo .env.local ya existe"
    fi
    
    # Hacer ejecutables los scripts
    chmod +x dev-docker.sh
    chmod +x bin/docker-start-dev
    log_success "Permisos de ejecución configurados"
    
    # Crear directorio de datos si no existe
    mkdir -p actual-data/server-files
    mkdir -p actual-data/user-files
    log_success "Directorios de datos creados"
    
    # Crear directorio .vscode si no existe
    mkdir -p .vscode
    log_success "Directorio .vscode verificado"
}

# Función para verificar puertos
check_ports() {
    log_header "Verificando puertos disponibles"
    
    ports=(3001 5006 9229)
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            log_warning "Puerto $port está ocupado"
            echo "  Proceso: $(lsof -i :$port | tail -n1 | awk '{print $1, $2}')"
        else
            log_success "Puerto $port disponible"
        fi
    done
}

# Función para configurar Git hooks (opcional)
setup_git_hooks() {
    log_header "Configurando Git hooks"
    
    if [ -d ".git" ]; then
        # Asegurar que el directorio esté marcado como safe
        git config --local --add safe.directory "$(pwd)"
        log_success "Directorio Git configurado como seguro"
        
        # Instalar hooks si husky está disponible
        if [ -f "package.json" ] && grep -q "husky" package.json; then
            if command -v yarn &> /dev/null; then
                yarn prepare 2>/dev/null || true
                log_success "Git hooks instalados"
            fi
        fi
    else
        log_warning "No es un repositorio Git"
    fi
}

# Función para construir imágenes iniciales
build_images() {
    log_header "Construyendo imágenes Docker"
    
    echo "Esto puede tomar varios minutos la primera vez..."
    
    if docker compose -f docker-compose.dev.yml build --no-cache; then
        log_success "Imágenes Docker construidas exitosamente"
    else
        log_error "Error construyendo imágenes Docker"
        exit 1
    fi
}

# Función para hacer prueba inicial
test_setup() {
    log_header "Probando configuración"
    
    log_info "Iniciando servicios..."
    if ./dev-docker.sh start; then
        log_success "Servicios iniciados correctamente"
        
        # Esperar un momento para que los servicios se estabilicen
        sleep 10
        
        # Verificar que los servicios estén respondiendo
        if curl -f http://localhost:5006/health &> /dev/null; then
            log_success "Sync server respondiendo en puerto 5006"
        else
            log_warning "Sync server no responde aún (puede necesitar más tiempo)"
        fi
        
        if curl -f http://localhost:3001 &> /dev/null; then
            log_success "Frontend respondiendo en puerto 3001"
        else
            log_warning "Frontend no responde aún (puede necesitar más tiempo)"
        fi
        
        # Mostrar estado
        ./dev-docker.sh status
        
        log_info "Deteniendo servicios de prueba..."
        ./dev-docker.sh stop
        
    else
        log_error "Error iniciando servicios"
        exit 1
    fi
}

# Función para mostrar información final
show_final_info() {
    log_header "Configuración completada"
    
    cat << EOF

🎉 ¡Tu entorno de desarrollo Docker está listo!

📋 Próximos pasos:

1. Iniciar desarrollo:
   ./dev-docker.sh start --full --watch

2. Acceder a la aplicación:
   • Frontend: http://localhost:3001
   • Sync Server: http://localhost:5006

3. En VS Code:
   • Ctrl+Shift+P -> "Tasks: Run Task"
   • Seleccionar: "Docker: Start Development Environment"

4. Ver logs en tiempo real:
   ./dev-docker.sh logs --watch

5. Abrir shell en contenedor:
   ./dev-docker.sh shell

📚 Documentación completa: DOCKER_DEVELOPMENT.md

🔧 Comandos útiles:
   ./dev-docker.sh help    # Ver todos los comandos
   ./dev-docker.sh status  # Ver estado de servicios
   ./dev-docker.sh reset   # Resetear entorno completamente

EOF

    log_success "¡Happy coding! 🚀"
}

# Función principal
main() {
    echo "🐳 Configuración de Desarrollo Docker - Actual Budget Fork"
    echo "========================================================"
    echo
    
    # Verificar si estamos en el directorio correcto
    if [ ! -f "package.json" ] || ! grep -q "actual" package.json; then
        log_error "Este script debe ejecutarse desde el directorio raíz del proyecto Actual"
        exit 1
    fi
    
    # Procesar argumentos
    SKIP_DEPS=false
    SKIP_BUILD=false
    SKIP_TEST=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-test)
                SKIP_TEST=true
                shift
                ;;
            --help|-h)
                cat << EOF
Uso: $0 [opciones]

Opciones:
  --skip-deps   Omitir verificación de dependencias
  --skip-build  Omitir construcción de imágenes Docker
  --skip-test   Omitir prueba inicial del entorno
  --help        Mostrar esta ayuda

EOF
                exit 0
                ;;
            *)
                log_error "Opción desconocida: $1"
                exit 1
                ;;
        esac
    done
    
    # Ejecutar pasos de configuración
    if [ "$SKIP_DEPS" = false ]; then
        check_dependencies
        echo
    fi
    
    setup_files
    echo
    
    check_ports
    echo
    
    setup_git_hooks
    echo
    
    if [ "$SKIP_BUILD" = false ]; then
        build_images
        echo
    fi
    
    if [ "$SKIP_TEST" = false ]; then
        test_setup
        echo
    fi
    
    show_final_info
}

# Ejecutar función principal
main "$@"
