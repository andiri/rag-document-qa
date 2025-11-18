// Calculate cosine similarity between two vectors
export const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
};

// Search for top K similar chunks
export const searchSimilarChunks = (queryEmbedding, documentChunks, topK = 5) => {
  const results = documentChunks.map(chunk => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  // Sort by similarity (descending) and return top K
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
};
