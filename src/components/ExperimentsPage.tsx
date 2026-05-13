'use client';

import { useState } from 'react';
import type { ExperimentResult } from '@/src/lib/experiments';

interface ExperimentSummary {
  totalExperiments: number;
  modelsTested: string[];
  providersUsed: string[];
  averageResponseTime: number;
  successRate: number;
  averageTokensUsed?: number;
  errors: Array<{ model: string; error: string }>;
}

export default function ExperimentsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [summary, setSummary] = useState<ExperimentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExperiments = async () => {
    setIsRunning(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      // Configuración de experimentos de ejemplo
      const config = {
        models: [
          "gpt-3.5-turbo",
          "gpt-4",
          "llama3.1:8b",
          "mistral:7b",
          "gemini-1.5-flash"
        ],
        prompts: [
          "Explica brevemente qué es el caudal de un río y por qué es importante monitorearlo.",
          "Analiza esta serie de datos de caudal: 10, 12, 15, 18, 16, 14, 11 m³/s. ¿Qué tendencia observas?",
          "Si el caudal actual es 25 m³/s y se esperan 15mm de lluvia en 24h, ¿cuál es el riesgo de inundación? Explica tu razonamiento.",
          "Genera un reporte ejecutivo sobre el estado de una estación de monitoreo de caudales que tiene un valor actual de 8 m³/s, umbral medio en 12 m³/s y alto en 20 m³/s."
        ],
        iterations: 1
      };

      const response = await fetch('/api/experiments/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar experimentos');
      }

      setResults(data.results);
      setSummary(data.summary);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Experimentos con LLMs</h1>
        <p className="text-slate-600">Comparación de modelos de lenguaje para análisis hidrológico</p>
      </div>

      {/* Botón para ejecutar experimentos */}
      <div className="flex justify-center">
        <button
          onClick={runExperiments}
          disabled={isRunning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isRunning ? 'Ejecutando experimentos...' : 'Ejecutar Experimentos'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error:</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Resumen */}
      {summary && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Resumen de Experimentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-slate-600">Experimentos Totales</p>
              <p className="text-2xl font-bold text-slate-900">{summary.totalExperiments}</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-slate-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-green-600">{(summary.successRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-slate-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{summary.averageResponseTime.toFixed(0)}ms</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-slate-900 mb-2">Modelos Probados:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {summary.modelsTested.map(model => (
                  <li key={model} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {model}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-900 mb-2">Proveedores:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                {summary.providersUsed.map(provider => (
                  <li key={provider} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {provider}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {summary.averageTokensUsed && (
            <div className="mt-4">
              <p className="font-medium text-slate-900">Tokens Promedio Usados:</p>
              <p className="text-lg text-slate-700">{summary.averageTokensUsed.toFixed(0)} tokens</p>
            </div>
          )}

          {summary.errors.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-red-900 mb-2">Errores:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {summary.errors.map((err, index) => (
                  <li key={index}>{err.model}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resultados detallados */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Resultados Detallados</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{result.model}</h3>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span>{result.provider}</span>
                    <span>•</span>
                    <span>{result.responseTime}ms</span>
                    {result.tokensUsed && (
                      <>
                        <span>•</span>
                        <span>{result.tokensUsed} tokens</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-2">
                  <p className="text-sm font-medium text-slate-700 mb-1">Prompt:</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{result.prompt}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Respuesta:</p>
                  <div className="text-sm text-slate-800 bg-slate-50 p-2 rounded max-h-32 overflow-y-auto">
                    {result.error ? (
                      <span className="text-red-600">{result.error}</span>
                    ) : (
                      result.response
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}