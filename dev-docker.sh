#!/bin/bash

#####################################################
# Scripts de administración para desarrollo Docker
# Actual Budget Fork
#####################################################

set -e

COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_NAME="actual-dev"

# Funciones de utilidad
log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_warning() {
    echo "⚠️  $1"
}

log_error() {
    echo "❌ $1"
}

# Función para mostrar ayuda
show_help() {
    cat << EOF
🚀 Actual Budget Fork - Scripts de Desarrollo Docker

Uso: ./dev-docker.sh [comando] [opciones]

Comandos disponibles:
  start         Iniciar el entorno de desarrollo completo
  stop          Detener todos los servicios
  restart       Reiniciar todos los servicios
  build         Reconstruir las imágenes Docker
  logs          Mostrar logs de los servicios
  clean         Limpiar contenedores, imágenes y volúmenes
  reset         Resetear completamente el entorno (¡CUIDADO!)
  status        Mostrar estado de los servicios
  shell         Abrir shell en el contenedor de desarrollo
  install       Instalar/reinstalar dependencias
  test          Ejecutar tests en el entorno Docker
  db-reset      Resetear base de datos de desarrollo

Opciones:
  --postgres    Incluir PostgreSQL en los servicios
  --redis       Incluir Redis en los servicios
  --full        Incluir todos los servicios opcionales
  --watch       Mostrar logs en tiempo real
  --force       Forzar operaciones sin confirmación

Ejemplos:
  ./dev-docker.sh start --full
  ./dev-docker.sh logs --watch
  ./dev-docker.sh reset --force
  ./dev-docker.sh shell
EOF
}

# Función para obtener perfiles
get_profiles() {
    profiles=""
    if [[ "$*" == *"--postgres"* ]] || [[ "$*" == *"--full"* ]]; then
        profiles="$profiles --profile postgres"
    fi
    if [[ "$*" == *"--redis"* ]] || [[ "$*" == *"--full"* ]]; then
        profiles="$profiles --profile redis"
    fi
    echo $profiles
}

# Función para confirmar operaciones destructivas
confirm_action() {
    if [[ "$*" == *"--force"* ]]; then
        return 0
    fi
    
    read -p "⚠️  Esta operación es destructiva. ¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operación cancelada"
        exit 0
    fi
}

# Comandos principales
cmd_start() {
    log_info "Iniciando entorno de desarrollo..."
    profiles=$(get_profiles "$@")
    
    # Crear directorios necesarios
    mkdir -p actual-data/server-files actual-data/user-files
    
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles up -d
    log_success "Entorno iniciado"
    log_info "Frontend: http://localhost:3001"
    log_info "Sync Server: http://localhost:5006"
    
    if [[ "$*" == *"--watch"* ]]; then
        cmd_logs "$@"
    fi
}

cmd_stop() {
    log_info "Deteniendo servicios..."
    profiles=$(get_profiles "$@")
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles down
    log_success "Servicios detenidos"
}

cmd_restart() {
    cmd_stop "$@"
    sleep 2
    cmd_start "$@"
}

cmd_build() {
    log_info "Reconstruyendo imágenes..."
    profiles=$(get_profiles "$@")
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles build --no-cache
    log_success "Imágenes reconstruidas"
}

cmd_logs() {
    profiles=$(get_profiles "$@")
    if [[ "$*" == *"--watch"* ]]; then
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles logs -f
    else
        docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles logs
    fi
}

cmd_clean() {
    confirm_action "$@"
    log_info "Limpiando contenedores e imágenes..."
    
    # Detener servicios
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans
    
    # Limpiar imágenes del proyecto
    docker images | grep actual-dev | awk '{print $3}' | xargs -r docker rmi -f
    
    # Limpiar contenedores e imágenes no utilizadas
    docker system prune -f
    
    log_success "Limpieza completada"
}

cmd_reset() {
    confirm_action "$@"
    log_warning "Reseteando entorno completo..."
    
    cmd_clean --force
    
    # Eliminar datos de la aplicación
    if [ -d "actual-data" ]; then
        rm -rf actual-data/
        log_info "Datos de aplicación eliminados"
    fi
    
    # Eliminar node_modules para forzar reinstalación
    if [ -d "node_modules" ]; then
        rm -rf node_modules/
        log_info "node_modules eliminado"
    fi
    
    log_success "Reset completado"
}

cmd_status() {
    log_info "Estado de los servicios:"
    profiles=$(get_profiles "$@")
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles ps
    
    # Mostrar información adicional
    echo
    log_info "Puertos expuestos:"
    docker compose -f $COMPOSE_FILE -p $PROJECT_NAME $profiles ps --format "table {{.Names}}\t{{.Ports}}"
}

cmd_shell() {
    container_name="actual-dev"
    if docker ps | grep -q $container_name; then
        log_info "Abriendo shell en $container_name..."
        docker exec -it $container_name /bin/bash
    else
        log_error "Contenedor $container_name no está ejecutándose"
        log_info "Ejecuta './dev-docker.sh start' primero"
    fi
}

cmd_install() {
    log_info "Reinstalando dependencias..."
    container_name="actual-dev"
    
    if docker ps | grep -q $container_name; then
        docker exec -it $container_name yarn install --immutable
        log_success "Dependencias reinstaladas"
    else
        log_error "Contenedor no está ejecutándose"
        log_info "Ejecuta './dev-docker.sh start' primero"
    fi
}

cmd_test() {
    log_info "Ejecutando tests..."
    container_name="actual-dev"
    
    if docker ps | grep -q $container_name; then
        docker exec -it $container_name yarn test
    else
        log_error "Contenedor no está ejecutándose"
        log_info "Ejecuta './dev-docker.sh start' primero"
    fi
}

cmd_db_reset() {
    confirm_action "$@"
    log_info "Reseteando base de datos..."
    
    if [ -d "actual-data" ]; then
        rm -rf actual-data/
        mkdir -p actual-data/server-files actual-data/user-files
        log_success "Base de datos reseteada"
        
        if docker ps | grep -q "actual-dev"; then
            log_info "Reiniciando servicios..."
            cmd_restart "$@"
        fi
    else
        log_info "No hay datos de base de datos para resetear"
    fi
}

# Procesar comandos
case "$1" in
    start)
        shift
        cmd_start "$@"
        ;;
    stop)
        shift
        cmd_stop "$@"
        ;;
    restart)
        shift
        cmd_restart "$@"
        ;;
    build)
        shift
        cmd_build "$@"
        ;;
    logs)
        shift
        cmd_logs "$@"
        ;;
    clean)
        shift
        cmd_clean "$@"
        ;;
    reset)
        shift
        cmd_reset "$@"
        ;;
    status)
        shift
        cmd_status "$@"
        ;;
    shell)
        shift
        cmd_shell "$@"
        ;;
    install)
        shift
        cmd_install "$@"
        ;;
    test)
        shift
        cmd_test "$@"
        ;;
    db-reset)
        shift
        cmd_db_reset "$@"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando desconocido: $1"
        echo
        show_help
        exit 1
        ;;
esac
