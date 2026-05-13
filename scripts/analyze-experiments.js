const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { input: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === '--input' || arg === '-i') && next) {
      out.input = next;
      i++;
    }
  }
  return out;
}

function listFilesByMtime(dir, filterFn) {
  const entries = fs.readdirSync(dir);
  const files = entries
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, stat };
    })
    .filter((e) => e.stat.isFile())
    .filter((e) => (filterFn ? filterFn(e) : true))
    .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());
  return files;
}

function getLatestBenchmarkFile() {
  const dir = path.join(process.cwd(), 'experiments-results');
  if (!fs.existsSync(dir)) return null;
  const files = listFilesByMtime(dir, (e) => e.name.startsWith('benchmark-station-') && e.name.endsWith('.json'));
  return files.length ? files[0].fullPath : null;
}

function mean(nums) {
  if (!nums.length) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function stdev(nums) {
  if (nums.length < 2) return null;
  const m = mean(nums);
  const variance = nums.reduce((s, n) => s + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

function percentile(nums, p) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const weight = idx - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

function extractPromptTags(prompt) {
  const m = /^\[case=([^\]]+)\]\[mode=([^\]]+)\]\s*/.exec(prompt || '');
  return m ? { caseId: m[1], mode: m[2] } : { caseId: null, mode: null };
}

function extractClassificationFromResponse(response) {
  const m = /Clasificacion_actual\s*=\s*([a-z_]+)/i.exec(response || '');
  return m ? m[1].toLowerCase() : null;
}

function buildScenarioIndex(benchmark) {
  const index = new Map();
  for (const s of benchmark?.scenarios || []) {
    index.set(s.id, s);
  }
  return index;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ];
  return lines.join('\n');
}

function round(n, digits = 0) {
  if (n === null || n === undefined) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function summarizeByModel(results, scenarioIndex) {
  const models = new Map();
  for (const r of results) {
    if (!models.has(r.model)) models.set(r.model, []);
    models.get(r.model).push(r);
  }

  const allowed = new Set(['bajo', 'medio', 'alto', 'muy_alto']);
  const summary = [];

  for (const [model, items] of [...models.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const ok = items.filter((x) => !x.error);
    const errors = items.filter((x) => x.error);
    const times = ok.map((x) => x.responseTime).filter((n) => Number.isFinite(n));
    const tokens = ok.map((x) => x.tokensUsed).filter((n) => Number.isFinite(n));

    let classified = 0;
    let classificationOk = 0;
    let classificationParseOk = 0;

    for (const x of ok) {
      const { caseId } = extractPromptTags(x.prompt);
      const scenario = caseId ? scenarioIndex.get(caseId) : null;
      const predicted = extractClassificationFromResponse(x.response);
      if (predicted && allowed.has(predicted)) {
        classificationParseOk++;
        if (scenario?.expectedClassification) {
          classified++;
          if (predicted === scenario.expectedClassification) classificationOk++;
        }
      }
    }

    summary.push({
      model,
      n_total: items.length,
      n_ok: ok.length,
      n_error: errors.length,
      avg_ms: round(mean(times), 0),
      p50_ms: round(percentile(times, 50), 0),
      p95_ms: round(percentile(times, 95), 0),
      sd_ms: round(stdev(times), 0),
      avg_tokens: round(mean(tokens), 0),
      sd_tokens: round(stdev(tokens), 0),
      classification_line_rate: ok.length ? round(classificationParseOk / ok.length, 3) : null,
      classification_accuracy: classified ? round(classificationOk / classified, 3) : null,
    });
  }

  return summary;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inputPath = opts.input || getLatestBenchmarkFile();

  if (!inputPath) {
    console.error('No input file found. Pass --input <file> or run a benchmark first.');
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw);
  const results = Array.isArray(parsed.results) ? parsed.results : [];

  const scenarioIndex = buildScenarioIndex(parsed.benchmark);
  const modelSummary = summarizeByModel(results, scenarioIndex);

  const out = {
    input: inputPath,
    timestamp: new Date().toISOString(),
    summaryByModel: modelSummary,
  };

  const outBase = inputPath.replace(/\.json$/i, '');
  const outJson = `${outBase}.analysis.json`;
  const outCsv = `${outBase}.analysis.csv`;

  fs.writeFileSync(outJson, JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync(outCsv, toCsv(modelSummary), 'utf8');

  console.log(`Wrote: ${outJson}`);
  console.log(`Wrote: ${outCsv}`);
}

main();

