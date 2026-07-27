import * as aiProvider from './aiProvider.service.js';

/**
 * Call Gemini to generate text or JSON output.
 * Redirected to AI Provider Abstraction layer.
 */
export async function callLLM(prompt, options = {}) {
  const result = await aiProvider.generateText(prompt, options);
  if (options.jsonMode) {
    return result.parsed || JSON.parse(result.text);
  }
  return result.text;
}
