import * as aiProvider from './aiProvider.service.js';

/**
 * Call Gemini to generate text or JSON output.
 * Redirected to AI Provider Abstraction layer.
 */
export async function callLLM(prompt, options = {}) {
  const result = await aiProvider.generateText(prompt, options);
  if (options.jsonMode) {
    if (result.parsed) return result.parsed;
    try {
      return JSON.parse(result.text);
    } catch (err) {
      const m = result.text.match(/```json\s*([\s\S]*?)\s*```/) || result.text.match(/```\s*([\s\S]*?)\s*```/);
      if (m) {
        try {
          return JSON.parse(m[1].trim());
        } catch (innerErr) {
          throw new Error(`Failed to parse extracted JSON block: ${innerErr.message}`);
        }
      }
      throw new Error(`Failed to parse response as JSON: ${result.text.slice(0, 150)}...`);
    }
  }
  return result.text;
}
