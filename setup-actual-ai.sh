#!/bin/bash

# ==========================================
# ACTUAL AI - SCRIPT DE CONFIGURACIÓN
# ==========================================

set -e

echo "🤖 Configurando Actual AI para categorización automática de transacciones"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Por favor instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Por favor instálalo primero."
    exit 1
fi

success "Docker y Docker Compose están disponibles"

# Verificar archivo de configuración
if [ ! -f ".env.ai" ]; then
    log "Creando archivo de configuración .env.ai desde plantilla..."
    cp .env.ai.example .env.ai
    warning "⚠️  IMPORTANTE: Necesitas editar .env.ai con tus configuraciones"
    echo ""
    echo "Configuraciones mínimas requeridas:"
    echo "  1. ACTUAL_BUDGET_ID - ID de tu presupuesto"
    echo "  2. ACTUAL_PASSWORD - Contraseña de Actual (si tienes)"
    echo "  3. Al menos un proveedor de IA (OpenAI recomendado):"
    echo "     - OPENAI_API_KEY=sk-tu-clave-aqui"
    echo "     - LLM_PROVIDER=openai"
    echo ""
    echo "Abre .env.ai en tu editor y configura estos valores."
    read -p "Presiona ENTER cuando hayas configurado .env.ai..."
fi

# Verificar configuraciones mínimas
if [ -f ".env.ai" ]; then
    log "Verificando configuración..."
    
    # Cargar variables
    source .env.ai
    
    # Verificar Budget ID
    if [ -z "$ACTUAL_BUDGET_ID" ]; then
        error "ACTUAL_BUDGET_ID no está configurado en .env.ai"
        echo "Ve a Actual Budget → Settings → Show advanced settings → Sync ID"
        exit 1
    fi
    
    # Verificar proveedor de IA
    if [ -z "$LLM_PROVIDER" ]; then
        error "LLM_PROVIDER no está configurado en .env.ai"
        exit 1
    fi
    
    case $LLM_PROVIDER in
        "openai")
            if [ -z "$OPENAI_API_KEY" ]; then
                error "OPENAI_API_KEY requerido para el proveedor OpenAI"
                exit 1
            fi
            ;;
        "anthropic")
            if [ -z "$ANTHROPIC_API_KEY" ]; then
                error "ANTHROPIC_API_KEY requerido para el proveedor Anthropic"
                exit 1
            fi
            ;;
        "google-generative-ai")
            if [ -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
                error "GOOGLE_GENERATIVE_AI_API_KEY requerido para el proveedor Google"
                exit 1
            fi
            ;;
        "groq")
            if [ -z "$GROQ_API_KEY" ]; then
                error "GROQ_API_KEY requerido para el proveedor Groq"
                exit 1
            fi
            ;;
        "openrouter")
            if [ -z "$OPENROUTER_API_KEY" ]; then
                error "OPENROUTER_API_KEY requerido para el proveedor OpenRouter"
                exit 1
            fi
            ;;
        "ollama")
            log "Verificando que Ollama esté disponible..."
            ;;
        *)
            error "Proveedor de IA no reconocido: $LLM_PROVIDER"
            exit 1
            ;;
    esac
    
    success "Configuración verificada correctamente"
fi

# Crear directorios necesarios
log "Creando directorios necesarios..."
mkdir -p logs/actual-ai
mkdir -p sql
success "Directorios creados"

# Crear archivo SQL de inicialización
log "Creando script de inicialización de base de datos..."
cat > sql/init.sql << 'EOF'
-- Analytics database initialization for Actual AI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transaction analytics table
CREATE TABLE IF NOT EXISTS transaction_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(255) NOT NULL,
    budget_id VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    original_category VARCHAR(255),
    ai_suggested_category VARCHAR(255),
    confidence_score DECIMAL(3,2),
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI processing logs
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id VARCHAR(255) NOT NULL,
    batch_size INTEGER,
    processed_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    avg_confidence DECIMAL(3,2),
    total_processing_time_ms INTEGER,
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    features_used JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_transaction_id ON transaction_analytics(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_budget_id ON transaction_analytics(budget_id);
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_created_at ON transaction_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_budget_id ON ai_processing_logs(budget_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);
EOF

success "Script de base de datos creado"

# Mostrar opciones de ejecución
echo ""
echo "==========================================="
echo "🚀 ACTUAL AI CONFIGURADO CORRECTAMENTE"
echo "==========================================="
echo ""
echo "Opciones disponibles:"
echo ""
echo "1. Setup básico (solo Actual + AI):"
echo "   docker-compose -f docker-compose.full.yml up actual-dev actual-ai"
echo ""
echo "2. Setup con cache Redis:"
echo "   docker-compose -f docker-compose.full.yml --profile with-cache up"
echo ""
echo "3. Setup completo con analytics:"
echo "   docker-compose -f docker-compose.full.yml --profile with-analytics up"
echo ""
echo "4. Setup con Ollama local:"
echo "   docker-compose -f docker-compose.full.yml --profile with-local-ai up"
echo ""
echo "5. Setup completo (todo incluido):"
echo "   docker-compose -f docker-compose.full.yml --profile with-cache --profile with-analytics --profile with-local-ai up"
echo ""

# Preguntar qué configuración quiere el usuario
echo "¿Qué configuración quieres usar?"
echo "1) Básico (Actual + AI)"
echo "2) Con cache Redis"
echo "3) Con analytics PostgreSQL"
echo "4) Con Ollama local"
echo "5) Completo (todo)"
echo ""

read -p "Elige una opción (1-5): " choice

case $choice in
    1)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml up -d actual-dev actual-ai"
        ;;
    2)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml --profile with-cache up -d"
        ;;
    3)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml --profile with-analytics up -d"
        ;;
    4)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml --profile with-local-ai up -d"
        ;;
    5)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml --profile with-cache --profile with-analytics --profile with-local-ai up -d"
        ;;
    *)
        COMPOSE_COMMAND="docker-compose -f docker-compose.full.yml up -d actual-dev actual-ai"
        ;;
esac

log "Iniciando servicios..."
eval $COMPOSE_COMMAND

# Esperar a que los servicios estén listos
log "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
log "Verificando estado de los servicios..."
docker-compose -f docker-compose.full.yml ps

echo ""
success "🎉 ¡Actual AI está funcionando!"
echo ""
echo "Servicios disponibles:"
echo "  • Actual Budget: http://localhost:3001"
echo "  • Actual API: http://localhost:5006"
echo "  • Logs de AI: docker-compose -f docker-compose.full.yml logs actual-ai"
echo ""
echo "Para ver los logs en tiempo real:"
echo "  docker-compose -f docker-compose.full.yml logs -f actual-ai"
echo ""
echo "Para parar los servicios:"
echo "  docker-compose -f docker-compose.full.yml down"
echo ""

# Mostrar primeros logs de AI
log "Primeros logs de Actual AI:"
docker-compose -f docker-compose.full.yml logs --tail=20 actual-ai || true
