import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateAnswer = async (question, context, conversationHistory = []) => {
  try {
    const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
Always base your answers on the context provided. If the context doesn't contain enough information to answer the question, say so clearly.
Cite specific parts of the context when possible.`;

    const contextText = context.map((chunk, idx) => 
      `[Source ${idx + 1}]\n${chunk.text}`
    ).join('\n\n');

    const userPrompt = `Context:\n${contextText}\n\nQuestion: ${question}\n\nPlease provide a detailed answer based on the context above.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userPrompt }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      answer: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    console.error('Error generating answer:', error);
    throw error;
  }
};
