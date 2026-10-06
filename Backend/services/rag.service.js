import VectorEmbedding from '../models/VectorEmbedding.js';
import { generateEmbedding, cosineSimilarity } from './vector.service.js';

export async function addDocumentToVectorStore({ refModel, refId, textChunk, tenantId }) {
  const embedding = await generateEmbedding(textChunk);
  const vectorDoc = new VectorEmbedding({
    refModel,
    refId,
    textChunk,
    embedding,
    tenantId
  });
  await vectorDoc.save();
  return vectorDoc;
}

export async function queryVectorStore({ query, tenantId, limit = 5 }) {
  const queryVector = await generateEmbedding(query);
  
  // Find all vector embeddings in tenant scope
  const vectors = await VectorEmbedding.find({ tenantId });
  
  // Compute cosine similarity manually
  const results = vectors.map(v => {
    const score = cosineSimilarity(queryVector, v.embedding);
    return {
      score,
      refModel: v.refModel,
      refId: v.refId,
      textChunk: v.textChunk
    };
  });

  // Sort and limit results
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
