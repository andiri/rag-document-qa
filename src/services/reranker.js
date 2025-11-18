// Simple reranking based on multiple factors
export const rerankResults = (query, searchResults) => {
  const reranked = searchResults.map(result => {
    let score = result.similarity;
    
    // Boost score if query terms appear in the chunk
    const queryTerms = query.toLowerCase().split(/\s+/);
    const chunkText = result.text.toLowerCase();
    
    const termMatches = queryTerms.filter(term => 
      chunkText.includes(term)
    ).length;
    
    const termBoost = (termMatches / queryTerms.length) * 0.2;
    score += termBoost;
    
    // Slight boost for longer chunks (more context)
    const lengthBoost = Math.min(result.text.length / 2000, 0.1);
    score += lengthBoost;
    
    return {
      ...result,
      rerankScore: score
    };
  });
  
  return reranked.sort((a, b) => b.rerankScore - a.rerankScore);
};
