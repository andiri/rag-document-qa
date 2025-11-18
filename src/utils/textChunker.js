export const chunkText = (text, chunkSize = 800, overlap = 200) => {
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  let currentTokenCount = 0;
  
  for (const sentence of sentences) {
    const sentenceTokenCount = estimateTokens(sentence);
    
    if (currentTokenCount + sentenceTokenCount > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      
      // Create overlap by keeping last part of current chunk
      const words = currentChunk.split(' ');
      const overlapWords = Math.floor(words.length * (overlap / chunkSize));
      currentChunk = words.slice(-overlapWords).join(' ') + ' ';
      currentTokenCount = estimateTokens(currentChunk);
    }
    
    currentChunk += sentence + ' ';
    currentTokenCount += sentenceTokenCount;
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.map((chunk, index) => ({
    id: `chunk_${index}`,
    text: chunk,
    index,
    tokenCount: estimateTokens(chunk)
  }));
};

// Rough token estimation (1 token ≈ 4 characters)
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};
