# 🔄 PRÁCTICA ESTÁNDAR: NAVEGACIÓN ENTRE PLANES

**Fecha:** 29 de junio de 2025  
**Estado:** ACTIVO  
**Aplicable a:** Todos los planes de desarrollo y refactorización

## 🎯 OBJETIVO

Establecer una **práctica estándar consistente** para la navegación entre planes de desarrollo, ensuring que:

- Siempre sepamos cuál es el próximo paso
- No se pierdan tareas o fases en progreso
- Los nuevos desarrolladores puedan seguir el flujo
- El workflow esté documentado y versionado

## 📋 FORMATO ESTÁNDAR

### **Sección Obligatoria en Todos los Planes**

```markdown
## 🔄 NAVEGACIÓN DEL WORKFLOW

### **📋 PRÓXIMO PASO INMEDIATO**

➡️ [NOMBRE_DEL_PLAN_SIGUIENTE](./ARCHIVO_PLAN.md)

Descripción breve de por qué ese es el siguiente paso.

### **🔄 WORKFLOW DE RETORNO**

Una vez completado, regresar a: [PLAN_PRINCIPAL](./ARCHIVO.md#seccion)

### **📚 REFERENCIAS RELACIONADAS**

- [Plan A](./plan-a.md) - Descripción
- [Plan B](./plan-b.md) - Descripción

### **🚨 IMPORTANTE: [INSTRUCCIONES ESPECÍFICAS]**

Cualquier precaución o instrucción crítica específica del plan.
```

## 🔧 IMPLEMENTACIÓN

### **1. Planes Principales**

Los planes principales (como `REFACTORIZACION_APP_COMPLETADA.md`) deben:

- **Identificar** claramente el próximo subplan a ejecutar
- **Especificar** dónde continuar después del subplan
- **Documentar** todo el workflow completo

### **2. Subplanes**

Los subplanes (como `PLAN_ONBOARDING_MODULAR_DETALLADO.md`) deben:

- **Referenciar** el plan principal que los inició
- **Especificar** exactamente dónde regresar al completarse
- **Incluir** precauciones sobre no continuar con otros desarrollos

### **3. Navegación Bidireccional**

Todos los enlaces deben ser **bidireccionales**:

```markdown
# Plan A → Plan B

Plan A: ➡️ [Ir a Plan B](./plan-b.md)

# Plan B → Plan A

Plan B: ⬅️ [Regresar a Plan A](./plan-a.md#seccion-especifica)
```

## ✅ CHECKLIST DE VALIDACIÓN

Antes de considerar un plan completo, verificar:

- [ ] **Navegación definida**: Próximo paso claramente especificado
- [ ] **Retorno documentado**: Dónde continuar después
- [ ] **Enlaces funcionando**: Todos los links apuntan a archivos/secciones existentes
- [ ] **Contexto incluido**: Por qué ese es el siguiente paso
- [ ] **Precauciones documentadas**: Instrucciones específicas incluidas

## 🚀 BENEFICIOS

### **Para Desarrolladores**

1. **Claridad**: Siempre saben qué hacer después
2. **Eficiencia**: No pierden tiempo decidiendo prioridades
3. **Confianza**: Workflow documentado y validado

### **Para el Proyecto**

1. **Continuidad**: No se pierden tareas en progreso
2. **Onboarding**: Nuevos desarrolladores siguen el flujo establecido
3. **Mantenimiento**: Workflow versionado y documentado
4. **Calidad**: Menos errores por saltos de contexto

### **Para el Equipo**

1. **Coordinación**: Todos siguendo el mismo workflow
2. **Transparencia**: Estado y próximos pasos visibles
3. **Escalabilidad**: Práctica que escala con el equipo

## 📖 EJEMPLOS DE IMPLEMENTACIÓN

### **Ejemplo: Plan Principal**

```markdown
## 🔄 NAVEGACIÓN DEL WORKFLOW

### **📋 PRÓXIMO PASO INMEDIATO**

➡️ [PLAN DE ONBOARDING MODULAR](./PLAN_ONBOARDING_MODULAR_DETALLADO.md)

Este subplan debe ejecutarse inmediatamente para modularizar
la lógica de onboarding antes de continuar con la API.

### **🔄 WORKFLOW DE RETORNO**

Una vez completado el onboarding, regresar a: [MEDIANO PLAZO](#mediano-plazo)
```

### **Ejemplo: Subplan**

```markdown
## 🔄 NAVEGACIÓN DEL WORKFLOW

### **📋 ORIGEN DE ESTE PLAN**

Iniciado desde: [REFACTORIZACIÓN PRINCIPAL](./REFACTORIZACION_APP_COMPLETADA.md)

### **🔄 WORKFLOW DE RETORNO**

Al completar: [REFACTORIZACIÓN PRINCIPAL - MEDIANO PLAZO](./REFACTORIZACION_APP_COMPLETADA.md#mediano-plazo)

### **🚨 IMPORTANTE: NO CONTINUAR CON OTROS DESARROLLOS**

No iniciar nuevas features hasta completar el workflow establecido.
```

## 🔄 MANTENIMIENTO

### **Actualización de Enlaces**

Cuando se cambien nombres de archivos o secciones:

1. **Buscar** todas las referencias al archivo/sección
2. **Actualizar** todos los enlaces afectados
3. **Validar** que los enlaces funcionan
4. **Documentar** el cambio en el changelog

### **Revisión Periódica**

- **Mensual**: Validar que todos los enlaces funcionan
- **Por release**: Verificar que el workflow está actualizado
- **Por refactorización**: Actualizar navegación según nuevos planes

## 🎯 CONCLUSIÓN

Esta práctica de navegación explícita entre planes es **crítica para el éxito del proyecto** y debe ser:

1. **Adoptada** en todos los nuevos planes
2. **Aplicada retroactivamente** a planes existentes
3. **Validada** antes de cada fase
4. **Mantenida** actualizada en cada iteración

**La navegación clara es la base de un workflow eficiente y escalable.** 🚀
