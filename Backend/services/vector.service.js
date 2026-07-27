import * as aiProvider from './aiProvider.service.js';

/**
 * Generate embedding vector for a given text.
 * Routed through AI Provider Abstraction layer.
 */
export async function generateEmbedding(text) {
  return aiProvider.getEmbedding(text);
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search local documents using vector similarity.
 * @param {string} query The user question.
 * @param {Array<{id: string, text: string, title: string, embedding: number[]}>} docs Array of document chunks.
 * @param {number} topK Number of results to return.
 * @returns {Promise<Array>} Sorted matches with similarity scores.
 */
export async function searchVectorDatabase(query, docs, topK = 3) {
  if (!docs || docs.length === 0) return [];
  
  const queryEmbedding = await generateEmbedding(query);
  
  const results = docs.map(doc => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding || []);
    return { ...doc, similarity };
  });
  
  // Sort descending by similarity
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}
