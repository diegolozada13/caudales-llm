# Experimentos con LLMs - Análisis Hidrológico

Este documento describe los experimentos realizados para comparar diferentes modelos de lenguaje (LLMs) en tareas de análisis hidrológico y monitoreo de caudales.

## 🎯 Objetivos de los Experimentos

1. **Comparar rendimiento**: Evaluar la calidad de respuestas entre diferentes LLMs
2. **Analizar eficiencia**: Medir consumo de tokens y tiempos de respuesta
3. **Validar fiabilidad**: Comprobar consistencia en respuestas técnicas
4. **Evaluar costos**: Comparar eficiencia en términos de recursos utilizados

## 🔬 Metodología

### Modelos Evaluados
- **GPT-3.5-turbo** (OpenAI)
- **GPT-4** (OpenAI)
- **Llama 3.1:8B** (Meta, vía Ollama)
- **Mistral 7B** (Mistral AI, vía Ollama)
- **Gemini 1.5 Flash** (Google)

### Tipos de Prompts Evaluados

1. **Explicación básica**: Conceptos fundamentales de hidrología
2. **Análisis de tendencias**: Interpretación de series temporales
3. **Evaluación de riesgo**: Análisis de situaciones de inundación
4. **Generación de reportes**: Creación de informes ejecutivos

### Métricas Capturadas

- ✅ **Tasa de éxito**: Porcentaje de respuestas sin errores
- ⏱️ **Tiempo de respuesta**: Latencia en milisegundos
- 🎫 **Consumo de tokens**: Tokens usados por respuesta
- 📊 **Calidad de respuesta**: Puntuación basada en criterios objetivos

## 🚀 Cómo Ejecutar Experimentos

### Opción 1: Interfaz Web
1. Accede a `/experimentos` en tu aplicación
2. Haz clic en "Ejecutar Experimentos"
3. Espera a que se complete la suite
4. Revisa los resultados y estadísticas

### Opción 2: Script de Línea de Comandos
```bash
# Asegúrate de tener las variables de entorno configuradas
node scripts/run-experiments.js
```

Este script guarda automáticamente un JSON con `results`, `summary` y `timestamp` en `experiments-results/`.

### Opción 2b: Benchmark con escenarios (estación 2716)
```bash
# 8 escenarios × 3 modos × 4 modelos × 5 iteraciones = 480 ejecuciones
node scripts/run-benchmark-2716.js --iterations 5 --delay-ms 200

# Generar CSV/JSON de análisis a partir del último benchmark
node scripts/analyze-experiments.js
```

### Opción 3: API Directa
```bash
curl -X POST http://localhost:3000/api/experiments/run \
  -H "Content-Type: application/json" \
  -d '{
    "models": ["gpt-3.5-turbo", "llama3.1:8b"],
    "prompts": ["Explica qué es el caudal de un río"],
    "iterations": 2
  }'
```

## 📊 Resultados Esperados

### Estructura de Datos Capturados

```json
{
  "results": [
    {
      "model": "gpt-3.5-turbo",
      "provider": "openai",
      "prompt": "...",
      "response": "...",
      "tokensUsed": 150,
      "responseTime": 1200,
      "timestamp": "2024-05-13T10:00:00Z",
      "qualityScore": 0.85
    }
  ],
  "summary": {
    "totalExperiments": 20,
    "modelsTested": ["gpt-3.5-turbo", "gpt-4"],
    "averageResponseTime": 1450,
    "successRate": 0.95,
    "averageTokensUsed": 180
  }
}
```

## 🔍 Análisis Recomendado

### 1. Comparación de Calidad vs. Velocidad
- Graficar tiempo de respuesta vs. calidad de respuesta
- Identificar trade-offs entre modelos

### 2. Análisis de Consumo de Recursos
- Comparar tokens usados por modelo
- Evaluar eficiencia energética (estimada)

### 3. Análisis de Consistencia
- Medir variabilidad en respuestas para el mismo prompt
- Evaluar estabilidad entre iteraciones

### 4. Análisis de Errores
- Categorizar tipos de errores por modelo
- Identificar patrones de fallos

## 📈 Métricas de Evaluación

### Calidad de Respuesta (0-1)
- **1.0**: Respuesta completa, precisa y bien estructurada
- **0.8**: Respuesta buena con algunos detalles menores faltantes
- **0.6**: Respuesta básica pero correcta
- **0.4**: Respuesta incompleta o con errores menores
- **0.2**: Respuesta incorrecta o muy incompleta
- **0.0**: Respuesta ininteligible o completamente errónea

### Criterios de Evaluación por Tipo de Prompt
- **Explicación**: Claridad, precisión técnica, completitud
- **Análisis**: Lógica, interpretación correcta de datos
- **Riesgo**: Razonamiento, consideración de factores
- **Reporte**: Estructura, profesionalismo, utilidad

## 🎯 Conclusiones Esperadas

Los experimentos deberían revelar:

1. **Mejor modelo para cada caso de uso** en hidrología
2. **Trade-offs** entre costo, velocidad y calidad
3. **Viabilidad de modelos locales** (Ollama) vs. APIs en la nube
4. **Limitaciones y fortalezas** de cada enfoque

## 🔧 Configuración de Variables de Entorno

```env
# OpenAI
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-3.5-turbo

# Ollama
OLLAMA_API_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=tu_clave_gemini

# OpenWeather (para contexto adicional)
OPENWEATHER_API_KEY=tu_clave_weather
```

## 📝 Notas para el Documento Final

- Incluir gráficos comparativos de rendimiento
- Discutir implicaciones para sistemas de monitoreo en tiempo real
- Considerar aspectos éticos del uso de LLMs en toma de decisiones críticas
- Proponer futuras líneas de investigación
