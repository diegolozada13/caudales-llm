import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export interface ExperimentResult {
  model: string;
  provider: string;
  prompt: string;
  response: string;
  tokensUsed?: number;
  responseTime: number;
  timestamp: string;
  qualityScore?: number;
  error?: string;
}

export interface ExperimentConfig {
  models: string[];
  prompts: string[];
  iterations?: number;
  delayMs?: number;
}

const defaultOllamaUrl = "http://127.0.0.1:11434/v1";
const openaiModel = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

const getModelConfig = (modelName: string) => {
  // Gemini models
  if (modelName.startsWith('gemini-')) {
    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return {
      provider: 'google',
      model: googleProvider(modelName),
    };
  }

  // Ollama models
  if (
    modelName.includes('llama') ||
    modelName.includes('mistral') ||
    modelName.includes('qwen') ||
    modelName.includes('gemma') ||
    modelName.includes('phi')
  ) {
    const openai = createOpenAI({
      baseURL: process.env.OLLAMA_API_URL ? `${process.env.OLLAMA_API_URL}/v1` : defaultOllamaUrl,
      apiKey: "ollama",
    });
    return {
      provider: 'ollama',
      model: openai(modelName),
    };
  }

  // OpenAI models
  const openai = createOpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL || undefined,
    apiKey: process.env.OPENAI_API_KEY || "",
  });
  return {
    provider: 'openai',
    model: openai(modelName),
  };
};

export const runLLMExperiment = async (
  modelName: string,
  prompt: string
): Promise<ExperimentResult> => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const { provider, model } = getModelConfig(modelName);

  try {
    const result = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    const responseTime = Date.now() - startTime;

    return {
      model: modelName,
      provider,
      prompt,
      response: result.text,
      tokensUsed: result.usage?.totalTokens,
      responseTime,
      timestamp,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      model: modelName,
      provider,
      prompt,
      response: '',
      responseTime,
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const runExperimentSuite = async (config: ExperimentConfig): Promise<ExperimentResult[]> => {
  const results: ExperimentResult[] = [];
  const iterations = config.iterations || 1;
  const delayMs = typeof config.delayMs === 'number' ? config.delayMs : 1000;

  for (const model of config.models) {
    for (const prompt of config.prompts) {
      for (let i = 0; i < iterations; i++) {
        console.log(`Running experiment: ${model} - iteration ${i + 1}`);
        const result = await runLLMExperiment(model, prompt);
        results.push(result);

        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
  }

  return results;
};

// Quality scoring function (basic implementation)
export const scoreResponseQuality = (response: string, expectedCriteria: string[]): number => {
  let score = 0;
  const lowerResponse = response.toLowerCase();

  for (const criterion of expectedCriteria) {
    if (lowerResponse.includes(criterion.toLowerCase())) {
      score += 1;
    }
  }

  return score / expectedCriteria.length; // Normalized score 0-1
};

// Export results to JSON
export const exportResultsToJSON = (results: ExperimentResult[], filename: string = 'experiment-results.json') => {
  const json = JSON.stringify(results, null, 2);
  // In a real implementation, you'd write to a file
  // For now, return the JSON string
  return json;
};

// Generate statistical summary
export const generateExperimentSummary = (results: ExperimentResult[]) => {
  const summary = {
    totalExperiments: results.length,
    modelsTested: [...new Set(results.map(r => r.model))],
    providersUsed: [...new Set(results.map(r => r.provider))],
    averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
    successRate: results.filter(r => !r.error).length / results.length,
    averageTokensUsed: results
      .filter(r => r.tokensUsed)
      .reduce((sum, r) => sum + (r.tokensUsed || 0), 0) / results.filter(r => r.tokensUsed).length,
    errors: results.filter(r => r.error).map(r => ({ model: r.model, error: r.error })),
  };

  return summary;
};
