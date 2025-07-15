# 🐳 Actual Budget Fork - Guía de Desarrollo Docker Full-Stack

Esta guía explica cómo configurar y usar el entorno de desarrollo Docker full-stack para tu fork de Actual Budget.

## 📋 Tabla de Contenidos

- [Pre-requisitos](#pre-requisitos)
- [Configuración Inicial](#configuración-inicial)
- [Arquitectura del Entorno](#arquitectura-del-entorno)
- [Comandos Principales](#comandos-principales)
- [Flujo de Desarrollo](#flujo-de-desarrollo)
- [Debugging](#debugging)
- [Solución de Problemas](#solución-de-problemas)
- [Configuración Avanzada](#configuración-avanzada)

## 🔧 Pre-requisitos

### Software Requerido

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **VS Code** (recomendado)
- **Git**

### Verificar Instalación

```bash
docker --version
docker compose version
```

## 🚀 Configuración Inicial

### 1. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env.local

# Editar según tus necesidades
code .env.local
```

### 2. Configurar Permisos

```bash
# Hacer ejecutables los scripts
chmod +x dev-docker.sh
chmod +x bin/docker-start-dev
```

### 3. Iniciar Entorno por Primera Vez

```bash
# Opción 1: Script completo
./dev-docker.sh start --full --watch

# Opción 2: VS Code Task
# Ctrl+Shift+P -> "Tasks: Run Task" -> "Docker: Start Development Environment"
```

## 🏗️ Arquitectura del Entorno

### Servicios Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network: actual-network           │
├─────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │   actual-dev    │    │  actual-server   │              │
│  │  (Development)  │    │  (Sync Server)   │              │
│  │                 │    │                  │              │
│  │  Frontend:3001  │◄──►│  API:5006        │              │
│  │  Debug:9229     │    │  Health Check    │              │
│  └─────────────────┘    └──────────────────┘              │
│                                                            │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │    postgres     │    │      redis       │              │
│  │  (Optional)     │    │   (Optional)     │              │
│  │                 │    │                  │              │
│  │  Port:5432      │    │  Port:6379       │              │
│  └─────────────────┘    └──────────────────┘              │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

### Puertos Expuestos

- **3001**: Frontend Vite Development Server
- **5006**: Sync Server API
- **9229**: Node.js Debug Port
- **5432**: PostgreSQL (opcional)
- **6379**: Redis (opcional)

### Volúmenes

- **Código fuente**: Bind mount completo para hot-reload
- **actual-data**: Persistencia de datos de la aplicación
- **node_modules**: Volúmenes optimizados para dependencies

## 🛠️ Comandos Principales

### Gestión del Entorno

```bash
# Iniciar entorno completo
./dev-docker.sh start --full

# Iniciar solo servicios básicos
./dev-docker.sh start

# Detener todos los servicios
./dev-docker.sh stop

# Reiniciar entorno
./dev-docker.sh restart
```

### Development & Build

```bash
# Reconstruir imágenes
./dev-docker.sh build

# Ver logs en tiempo real
./dev-docker.sh logs --watch

# Abrir shell en contenedor
./dev-docker.sh shell

# Ejecutar tests
./dev-docker.sh test
```

### Mantenimiento

```bash
# Ver estado de servicios
./dev-docker.sh status

# Limpiar contenedores e imágenes
./dev-docker.sh clean

# Reset completo (¡DESTRUCTIVO!)
./dev-docker.sh reset --force

# Resetear solo base de datos
./dev-docker.sh db-reset
```

## 💻 Flujo de Desarrollo

### Desarrollo Típico

1. **Iniciar entorno**:

   ```bash
   ./dev-docker.sh start --full --watch
   ```

2. **Acceder a la aplicación**:

   - Frontend: http://localhost:3001
   - Sync Server: http://localhost:5006

3. **Hacer cambios en el código**:

   - Los cambios se reflejan automáticamente (hot-reload)
   - Ver logs en tiempo real

4. **Ejecutar tests**:

   ```bash
   ./dev-docker.sh test
   ```

5. **Debugging** (opcional):
   - Conectar debugger a puerto 9229
   - Usar VS Code debugger

### Usando VS Code

1. **Abrir Command Palette**: `Ctrl+Shift+P`
2. **Buscar**: "Tasks: Run Task"
3. **Seleccionar**:
   - "Docker: Start Development Environment"
   - "Docker: View Logs"
   - "Docker: Open Shell"

## 🐛 Debugging

### Node.js Debugging

El contenedor expone el puerto 9229 para debugging:

```json
// .vscode/launch.json
{
  "name": "Attach to Docker",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}"
}
```

### Browser Debugging

- **DevTools**: Habilitadas por defecto
- **React DevTools**: Disponible en desarrollo
- **Source Maps**: Configurados automáticamente

### Logs Debugging

```bash
# Ver logs de servicio específico
docker logs actual-dev -f

# Ver logs de todos los servicios
./dev-docker.sh logs --watch

# Ver logs históricos
docker compose -f docker-compose.dev.yml logs --since 1h
```

## 🔧 Solución de Problemas

### Problema: Puertos Ocupados

```bash
# Verificar qué está usando el puerto
lsof -i :3001
lsof -i :5006

# Detener servicios conflictivos
./dev-docker.sh stop
```

### Problema: Dependencias Desactualizadas

```bash
# Reinstalar dependencias en contenedor
./dev-docker.sh shell
yarn install --immutable

# O desde fuera del contenedor
./dev-docker.sh install
```

### Problema: Base de Datos Corrupta

```bash
# Resetear base de datos
./dev-docker.sh db-reset

# O reset completo
./dev-docker.sh reset --force
```

### Problema: Imágenes Desactualizadas

```bash
# Reconstruir desde cero
./dev-docker.sh build

# Limpiar y reconstruir
./dev-docker.sh clean
./dev-docker.sh build
```

### Problema: Permisos

```bash
# En sistemas Unix, asegurar permisos correctos
sudo chown -R $USER:$USER actual-data/
chmod -R 755 actual-data/
```

## ⚙️ Configuración Avanzada

### Usar PostgreSQL en lugar de SQLite

1. **Habilitar PostgreSQL**:

   ```bash
   ./dev-docker.sh start --postgres
   ```

2. **Configurar variable de entorno**:
   ```bash
   # En .env.local
   DATABASE_URL=postgresql://actual:actual123@postgres:5432/actual_dev
   ```

### Usar Redis para Caching

```bash
# Habilitar Redis
./dev-docker.sh start --redis

# En .env.local
REDIS_URL=redis://redis:6379
```

### Configuración de Performance

```bash
# En .env.local
CHOKIDAR_USEPOLLING=true  # Para mejor file watching
NODE_OPTIONS=--max-old-space-size=4096  # Más memoria para Node.js
```

### Configuración de Networking

```yaml
# En docker-compose.dev.yml, personalizar red
networks:
  actual-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 📁 Estructura de Archivos

```
actual/
├── .vscode/
│   ├── tasks.json              # Tareas de VS Code
│   └── extensions.json         # Extensiones recomendadas
├── bin/
│   └── docker-start-dev        # Script de inicio para contenedor
├── .env.example                # Variables de entorno ejemplo
├── .dockerignore              # Archivos excluidos de Docker
├── Dockerfile.dev             # Dockerfile para desarrollo
├── docker-compose.dev.yml     # Configuración Docker Compose
├── dev-docker.sh              # Script de administración principal
└── DOCKER_DEVELOPMENT.md      # Esta documentación
```

## 🤝 Contribución

### Hacer Cambios al Entorno

1. **Modificar configuración Docker**:

   - Editar `docker-compose.dev.yml`
   - Actualizar `Dockerfile.dev`

2. **Probar cambios**:

   ```bash
   ./dev-docker.sh build
   ./dev-docker.sh start --full
   ```

3. **Documentar cambios**:
   - Actualizar esta documentación
   - Actualizar `.env.example`

## 📚 Referencias

- [Documentación oficial Actual Budget](https://actualbudget.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VS Code Docker Extension](https://code.visualstudio.com/docs/containers/overview)

---

¿Necesitas ayuda? Revisa los logs, consulta esta documentación o abre un issue en el repositorio.

**Última actualización**: Julio 2025
