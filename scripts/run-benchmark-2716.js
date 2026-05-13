const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_MODELS = ['llama3.1:8b', 'gemma2:9b', 'qwen2.5:3b', 'phi3:mini'];

function parseArgs(argv) {
  const out = {
    iterations: 3,
    delayMs: 200,
    models: DEFAULT_MODELS,
    host: '127.0.0.1',
    port: 3000,
    stationId: 2716,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--iterations' && next) {
      out.iterations = Number.parseInt(next, 10);
      i++;
      continue;
    }
    if (arg === '--delay-ms' && next) {
      out.delayMs = Number.parseInt(next, 10);
      i++;
      continue;
    }
    if (arg === '--models' && next) {
      out.models = next.split(',').map((s) => s.trim()).filter(Boolean);
      i++;
      continue;
    }
    if (arg === '--host' && next) {
      out.host = next;
      i++;
      continue;
    }
    if (arg === '--port' && next) {
      out.port = Number.parseInt(next, 10);
      i++;
      continue;
    }
    if (arg === '--station' && next) {
      out.stationId = Number.parseInt(next, 10);
      i++;
      continue;
    }
  }

  if (!Number.isFinite(out.iterations) || out.iterations < 1) out.iterations = 3;
  if (!Number.isFinite(out.delayMs) || out.delayMs < 0) out.delayMs = 200;
  if (!Number.isFinite(out.port) || out.port < 1) out.port = 3000;
  if (!Number.isFinite(out.stationId) || out.stationId < 1) out.stationId = 2716;

  return out;
}

function buildScenarios(stationId) {
  const thresholds = { bajo: 10, medio: 20, alto: 35 };
  const baseDate = '2026-05-13T12:00:00Z';

  return [
    {
      id: 's01_very_low_rising',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 6.0,
      thresholds,
      predictions: [
        { h: 1, value: 7.0, trend: 'sube', risk: 'bajo' },
        { h: 4, value: 9.5, trend: 'sube', risk: 'medio' },
        { h: 24, value: 14.0, trend: 'sube', risk: 'medio' },
      ],
    },
    {
      id: 's02_low_stable',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 9.8,
      thresholds,
      predictions: [
        { h: 1, value: 9.7, trend: 'estable', risk: 'bajo' },
        { h: 4, value: 9.6, trend: 'estable', risk: 'bajo' },
        { h: 24, value: 9.5, trend: 'baja', risk: 'bajo' },
      ],
    },
    {
      id: 's03_medium_rising_cross_medium',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 18.4,
      thresholds,
      predictions: [
        { h: 1, value: 19.1, trend: 'sube', risk: 'medio' },
        { h: 4, value: 21.0, trend: 'sube', risk: 'alto' },
        { h: 24, value: 27.5, trend: 'sube', risk: 'alto' },
      ],
    },
    {
      id: 's04_medium_falling',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 18.4,
      thresholds,
      predictions: [
        { h: 1, value: 17.8, trend: 'baja', risk: 'bajo' },
        { h: 4, value: 16.0, trend: 'baja', risk: 'bajo' },
        { h: 24, value: 12.0, trend: 'baja', risk: 'medio' },
      ],
    },
    {
      id: 's05_high_rising_cross_high',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 33.0,
      thresholds,
      predictions: [
        { h: 1, value: 34.0, trend: 'sube', risk: 'medio' },
        { h: 4, value: 36.5, trend: 'sube', risk: 'alto' },
        { h: 24, value: 45.0, trend: 'sube', risk: 'alto' },
      ],
    },
    {
      id: 's06_above_high_falling',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 40.0,
      thresholds,
      predictions: [
        { h: 1, value: 38.0, trend: 'baja', risk: 'alto' },
        { h: 4, value: 34.0, trend: 'baja', risk: 'medio' },
        { h: 24, value: 28.0, trend: 'baja', risk: 'medio' },
      ],
    },
    {
      id: 's07_boundary_conditions',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 10.0,
      thresholds,
      predictions: [
        { h: 1, value: 10.0, trend: 'estable', risk: 'bajo' },
        { h: 4, value: 20.0, trend: 'sube', risk: 'medio' },
        { h: 24, value: 35.0, trend: 'sube', risk: 'alto' },
      ],
    },
    {
      id: 's08_high_stable',
      stationId,
      variable: 'Caudal',
      timestamp: baseDate,
      current: 22.0,
      thresholds,
      predictions: [
        { h: 1, value: 22.0, trend: 'estable', risk: 'medio' },
        { h: 4, value: 21.8, trend: 'estable', risk: 'medio' },
        { h: 24, value: 22.2, trend: 'estable', risk: 'medio' },
      ],
    },
  ];
}

function classificationFor(current, thresholds) {
  if (current < thresholds.bajo) return 'bajo';
  if (current < thresholds.medio) return 'medio';
  if (current < thresholds.alto) return 'alto';
  return 'muy_alto';
}

function buildPrompt(scenario, mode) {
  const predictionText = scenario.predictions
    .map((p) => `+${p.h}h: ${p.value} m³/s, tendencia ${p.trend}, riesgo ${p.risk}`)
    .join('. ');

  const base =
    `Estación: ${scenario.stationId}. ` +
    `Variable: ${scenario.variable}. ` +
    `Valor actual: ${scenario.current} m³/s. ` +
    `Fecha/hora: ${scenario.timestamp}. ` +
    `Umbrales: bajo ${scenario.thresholds.bajo}, medio ${scenario.thresholds.medio}, alto ${scenario.thresholds.alto}. ` +
    `Predicciones: ${predictionText}.`;

  const rules =
    `Reglas de clasificación por umbrales (usa exactamente estas reglas): ` +
    `bajo si valor < ${scenario.thresholds.bajo}; ` +
    `medio si ${scenario.thresholds.bajo} <= valor < ${scenario.thresholds.medio}; ` +
    `alto si ${scenario.thresholds.medio} <= valor < ${scenario.thresholds.alto}; ` +
    `muy_alto si valor >= ${scenario.thresholds.alto}.`;

  const suffix =
    `Termina SIEMPRE con una línea final exactamente así: ` +
    `Clasificacion_actual=<bajo|medio|alto|muy_alto>`;

  if (mode === 'general') {
    return `[case=${scenario.id}][mode=general] ${base} ${rules} ` +
      `Explica brevemente el estado general y la evolución reciente del caudal. ` +
      `Usa un tono claro y directo en español. ${suffix}`;
  }

  if (mode === 'riesgo') {
    return `[case=${scenario.id}][mode=riesgo] ${base} ${rules} ` +
      `Explica el riesgo actual del caudal respecto a los umbrales, y qué debería vigilar el operador. ` +
      `Mantén la respuesta en español y en un párrafo corto. ${suffix}`;
  }

  return `[case=${scenario.id}][mode=prediccion] ${base} ${rules} ` +
    `Explica la predicción +1h en detalle: qué significa para la tendencia y si el caudal va a subir, bajar o mantenerse. ` +
    `Responde en español de forma clara. ${suffix}`;
}

function safeTimestamp(iso) {
  return (iso || new Date().toISOString()).replace(/[:]/g, '-');
}

function writeOutputFile(payload) {
  const outDir = path.join(process.cwd(), 'experiments-results');
  fs.mkdirSync(outDir, { recursive: true });

  const stationId = payload?.benchmark?.stationId || 'unknown';
  const outFile = `benchmark-station-${stationId}_${safeTimestamp(payload.timestamp)}.json`;
  const outPath = path.join(outDir, outFile);
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  return outPath;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const scenarios = buildScenarios(opts.stationId);
  const modes = ['general', 'riesgo', 'prediccion'];
  const prompts = [];
  for (const scenario of scenarios) {
    for (const mode of modes) {
      prompts.push(buildPrompt(scenario, mode));
    }
  }

  const requestBody = JSON.stringify({
    models: opts.models,
    prompts,
    iterations: opts.iterations,
    delayMs: opts.delayMs,
  });

  const options = {
    hostname: opts.host,
    port: opts.port,
    path: '/api/experiments/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);

        if (res.statusCode && res.statusCode >= 400) {
          console.error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed, null, 2)}`);
          process.exitCode = 1;
          return;
        }

        const enriched = {
          benchmark: {
            stationId: opts.stationId,
            models: opts.models,
            iterations: opts.iterations,
            delayMs: opts.delayMs,
            scenarios: scenarios.map((s) => ({
              id: s.id,
              current: s.current,
              thresholds: s.thresholds,
              expectedClassification: classificationFor(s.current, s.thresholds),
            })),
            modes,
          },
          ...parsed,
        };

        console.log(JSON.stringify(enriched.summary, null, 2));
        const outPath = writeOutputFile(enriched);
        console.log(`Saved results to: ${outPath}`);
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

  req.write(requestBody);
  req.end();
}

main();
