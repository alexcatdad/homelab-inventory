import { writable, get } from 'svelte/store';
import { CreateMLCEngine, hasModelInCache, prebuiltAppConfig, type MLCEngine, type InitProgressReport } from '@mlc-ai/web-llm';

// Model configuration - 1B model for fast browser-based inference
// Note: 3B model was too slow (~2+ min per inference in WebGPU)
export const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
export const MODEL_SIZE = '~720MB';

// Use local model in development, CDN in production
const USE_LOCAL_MODEL = import.meta.env.DEV;
const LOCAL_MODEL_BASE = `/models/${MODEL_ID}/`;

// Engine state
export const llmEngine = writable<MLCEngine | null>(null);
export const llmStatus = writable<'idle' | 'loading' | 'ready' | 'error'>('idle');
export const llmProgress = writable<{ text: string; progress: number }>({ text: '', progress: 0 });
export const llmError = writable<string | null>(null);

// Check if model is already cached
export async function isModelCached(): Promise<boolean> {
  try {
    return await hasModelInCache(MODEL_ID);
  } catch {
    return false;
  }
}

// Check WebGPU support
export function isWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}

// Initialize the LLM engine
export async function initializeLLM(): Promise<boolean> {
  // Check WebGPU support first
  if (!isWebGPUSupported()) {
    llmStatus.set('error');
    llmError.set('WebGPU is not supported in this browser. Please use Chrome, Edge, or another WebGPU-enabled browser.');
    return false;
  }

  // Already initialized?
  if (get(llmStatus) === 'ready' && get(llmEngine)) {
    return true;
  }

  // Already loading?
  if (get(llmStatus) === 'loading') {
    return false;
  }

  llmStatus.set('loading');
  llmError.set(null);
  llmProgress.set({ text: 'Initializing...', progress: 0 });

  try {
    // Build config with local model path in development
    const engineConfig: Parameters<typeof CreateMLCEngine>[1] = {
      initProgressCallback: (report: InitProgressReport) => {
        llmProgress.set({
          text: report.text,
          progress: report.progress
        });
      }
    };

    if (USE_LOCAL_MODEL) {
      // Override model URL to use local files
      const modelRecord = prebuiltAppConfig.model_list.find(m => m.model_id === MODEL_ID);
      if (modelRecord) {
        engineConfig.appConfig = {
          model_list: [{
            ...modelRecord,
            model: LOCAL_MODEL_BASE,
          }]
        };
      }
    }

    const engine = await CreateMLCEngine(MODEL_ID, engineConfig);

    llmEngine.set(engine);
    llmStatus.set('ready');
    llmProgress.set({ text: 'Ready', progress: 1 });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to initialize LLM';
    llmStatus.set('error');
    llmError.set(errorMessage);
    llmProgress.set({ text: 'Error', progress: 0 });
    return false;
  }
}

// Reset engine state (for retrying after error)
export function resetLLM(): void {
  const engine = get(llmEngine);
  if (engine) {
    engine.unload();
  }
  llmEngine.set(null);
  llmStatus.set('idle');
  llmError.set(null);
  llmProgress.set({ text: '', progress: 0 });
}
