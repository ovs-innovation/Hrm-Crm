import VectorEmbedding from '../models/VectorEmbedding.js';

// Cosine similarity computation
function cosineSimilarity(vecA, vecB) {
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

// Generate simple mock embeddings (768 dimensions) based on string hash for local RAG support
function generateSimpleHashEmbedding(text) {
  const embedding = new Array(768).fill(0);
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const index = (charCode * (i + 1)) % 768;
    embedding[index] = (embedding[index] + charCode) / 255;
  }
  // Normalize vector
  let sumSq = 0;
  for (let val of embedding) sumSq += val * val;
  const norm = Math.sqrt(sumSq) || 1;
  return embedding.map(val => val / norm);
}

export async function addDocumentToVectorStore({ refModel, refId, textChunk, tenantId }) {
  const embedding = generateSimpleHashEmbedding(textChunk);
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
  const queryVector = generateSimpleHashEmbedding(query);
  
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
