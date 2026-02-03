# Instrucciones de Desarrollo - Antigravity

Estas reglas rigen el comportamiento de la IA durante el desarrollo del proyecto TFM Sales Dashboard.

## 1. Modularidad Primero
- **No generar todo el código de una vez.**
- Dividir las respuestas por capas claramente diferenciadas:
    - **Dominio** (Core/Entities)
    - **Infraestructura** (Services/Mappers)
    - **Presentación** (Components/Views)

## 2. Explicación de Decisiones
- Antes de escribir código para componentes complejos, explicar brevemente el **patrón de diseño** o la estrategia a seguir.

## 3. Manejo de Errores
- Implementar capturas de error robustas en la carga de Excel.
- Notificar específicamente si el archivo está corrupto o si **faltan columnas esenciales**.

## 4. Optimización
- Uso obligatorio de **Web Workers** para el procesamiento pesado (Mappers).
- Garantizar que la UI se mantenga fluida (60fps) durante procesos de carga.
