const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuración de experimentos
const config = {
  models: [
    'gpt-3.5-turbo',
    'gpt-4',
    'llama3.1:8b',
    'mistral:7b',
    'gemini-1.5-flash',
  ],
  prompts: [
    'Explica brevemente qué es el caudal de un río y por qué es importante monitorearlo.',
    'Analiza esta serie de datos de caudal: 10, 12, 15, 18, 16, 14, 11 m³/s. ¿Qué tendencia observas?',
    'Si el caudal actual es 25 m³/s y se esperan 15mm de lluvia en 24h, ¿cuál es el riesgo de inundación? Explica tu razonamiento.',
    'Genera un reporte ejecutivo sobre el estado de una estación de monitoreo de caudales que tiene un valor actual de 8 m³/s, umbral medio en 12 m³/s y alto en 20 m³/s.',
  ],
  iterations: 3,
};

const body = JSON.stringify(config);

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/experiments/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

function safeTimestamp(iso) {
  return (iso || new Date().toISOString()).replace(/[:]/g, '-');
}

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode && res.statusCode >= 400) {
      console.error(`HTTP ${res.statusCode}: ${data}`);
      process.exitCode = 1;
      return;
    }

    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));

      const outDir = path.join(process.cwd(), 'experiments-results');
      fs.mkdirSync(outDir, { recursive: true });

      const outFile = `experiments_${safeTimestamp(parsed.timestamp)}.json`;
      const outPath = path.join(outDir, outFile);
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log(`\nSaved results to: ${outPath}`);
    } catch (e) {
      console.error('Invalid JSON response:', data);
      process.exitCode = 1;
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exitCode = 1;
});

req.write(body);
req.end();

