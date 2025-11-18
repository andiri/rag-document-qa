# Quick Start Guide

Get your RAG Document Q&A application running in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Setup Steps

### 1. Install Dependencies

```bash
cd rag-document-qa
npm install
```

### 2. Configure OpenAI API Key

Open the `.env` file and add your OpenAI API key:

```bash
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

⚠️ **Important**: Make sure your API key has access to:
- `text-embedding-3-small` model
- `gpt-4` model (or change to `gpt-3.5-turbo` in `src/services/gptService.js`)

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## First Test

1. **Upload a document**:
   - Click the upload area
   - Select a PDF, TXT, or MD file (max 10MB)
   - Wait for processing (you'll see a spinner)

2. **Ask a question**:
   - Type a question about your document
   - Click "Ask" or press Enter
   - View the AI-generated answer with sources

## Example Documents to Try

Create a test file `test.txt`:

```
Artificial Intelligence (AI) is transforming the world. Machine learning, 
a subset of AI, enables computers to learn from data without explicit 
programming. Deep learning uses neural networks with multiple layers to 
process complex patterns. Natural Language Processing (NLP) allows machines 
to understand and generate human language. Computer vision enables machines 
to interpret visual information from the world.
```

Example questions:
- "What is machine learning?"
- "How does deep learning work?"
- "What can NLP do?"

## Troubleshooting

### "Failed to process document"

**Solution**: Check your OpenAI API key in `.env` file

### "Failed to generate answer"

**Possible causes**:
1. API key doesn't have GPT-4 access → Use GPT-3.5-turbo instead
2. Insufficient API credits → Check your OpenAI account
3. Rate limit exceeded → Wait a moment and try again

**To use GPT-3.5-turbo**: Edit `src/services/gptService.js`:
```javascript
model: 'gpt-3.5-turbo'  // Change from 'gpt-4'
```

### Port 5173 already in use

```bash
# Kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
- Customize the UI in `src/App.jsx`
- Adjust RAG parameters in `src/utils/textChunker.js`

## API Costs

Approximate costs per query:
- Embeddings: ~$0.0001 per 1000 tokens
- GPT-4: ~$0.03 per 1000 tokens
- GPT-3.5-turbo: ~$0.002 per 1000 tokens

A typical query with a medium document:
- Document processing: $0.01-0.05 (one-time)
- Each question: $0.01-0.05 (GPT-4) or $0.001-0.005 (GPT-3.5)

## Support

Having issues? Check:
1. Browser console for errors (F12)
2. Terminal for server errors
3. OpenAI API status: https://status.openai.com/

## Happy Building! 🚀
