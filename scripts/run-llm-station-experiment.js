const http = require('http');
const fs = require('fs');
const path = require('path');

const body = JSON.stringify({
  models: ['llama3.1:8b', 'gemma2:9b', 'qwen2.5:3b', 'phi3:mini'],
  prompts: [
    'Estación: 2716. Variable: Caudal. Valor actual: 18.4 m³/s. Fecha/hora: 2026-05-13T12:00:00Z. Umbrales: bajo 10, medio 20, alto 35. Predicciones: +1h: 19.1 m³/s, tendencia sube, riesgo medio. +4h: 21.0 m³/s, tendencia sube, riesgo alto. +24h: 27.5 m³/s, tendencia sube, riesgo alto. Explica brevemente el estado general y la evolución reciente del caudal. Usa un tono claro y directo en español.',
    'Estación: 2716. Variable: Caudal. Valor actual: 18.4 m³/s. Fecha/hora: 2026-05-13T12:00:00Z. Umbrales: bajo 10, medio 20, alto 35. Predicciones: +1h: 19.1 m³/s, tendencia sube, riesgo medio. +4h: 21.0 m³/s, tendencia sube, riesgo alto. +24h: 27.5 m³/s, tendencia sube, riesgo alto. Explica el riesgo actual del caudal respecto a los umbrales, y qué debería vigilar el operador. Mantén la respuesta en español y en un párrafo corto.',
    'Estación: 2716. Variable: Caudal. Valor actual: 18.4 m³/s. Fecha/hora: 2026-05-13T12:00:00Z. Umbrales: bajo 10, medio 20, alto 35. Predicciones: +1h: 19.1 m³/s, tendencia sube, riesgo medio. +4h: 21.0 m³/s, tendencia sube, riesgo alto. +24h: 27.5 m³/s, tendencia sube, riesgo alto. Explica la predicción +1h en detalle: qué significa para la tendencia y si el caudal va a subir, bajar o mantenerse. Responde en español de forma clara.'
  ],
  iterations: 1
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/experiments/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));

      const timestampSafe = (parsed.timestamp || new Date().toISOString()).replace(/[:]/g, '-');
      const stationMatch =
        typeof parsed?.results?.[0]?.prompt === 'string'
          ? parsed.results[0].prompt.match(/:\s*(\d{3,})\b/)
          : null;
      const stationId = stationMatch?.[1] || 'unknown';

      const outDir = path.join(process.cwd(), 'experiments-results');
      fs.mkdirSync(outDir, { recursive: true });

      const outFile = `station-${stationId}_${timestampSafe}.json`;
      const outPath = path.join(outDir, outFile);
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log(`\nSaved results to: ${outPath}`);
    } catch (e) {
      console.error('Invalid JSON response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(body);
req.end();
