# RAG Document Q&A Application

A powerful document search and question-answering web application built with React and OpenAI's GPT-4, featuring Retrieval-Augmented Generation (RAG) capabilities.

## Features

### Core RAG Pipeline
- **Document Embedding**: Automatically chunks and vectorizes uploaded documents using OpenAI Embeddings API
- **Vector Search**: Performs similarity-based search using cosine similarity
- **Reranking**: Intelligently reorders search results based on relevance
- **LLM Generation**: Generates accurate answers using GPT-4 with retrieved context
- **Source Tracking**: Shows which document sections were used to generate answers

### User Interface
- 📄 Document upload support (PDF, TXT, MD)
- 💬 Interactive chat interface
- 📊 Conversation history with expandable sources
- 📱 Responsive design (mobile & desktop)
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **AI/ML**: OpenAI GPT-4 & text-embedding-3-small
- **Document Processing**: pdf-parse
- **HTTP Client**: Axios
- **Deployment**: Vercel

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rag-document-qa
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

5. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. **Upload a Document**
   - Click the upload area or drag and drop a PDF, TXT, or MD file
   - Maximum file size: 10MB
   - The document will be automatically processed and indexed

2. **Ask Questions**
   - Type your question in the input field
   - Click "Ask" or press Enter
   - The AI will search relevant sections and generate an answer

3. **View Sources**
   - Each answer includes source references
   - Click "View sources" to see the exact document sections used
   - Relevance scores show how well each source matches your question

## Project Structure

```
rag-document-qa/
├── src/
│   ├── components/
│   │   ├── DocumentUploader.jsx    # File upload component
│   │   ├── ChatInterface.jsx       # Question input interface
│   │   ├── DocumentInfo.jsx        # Document metadata display
│   │   └── ConversationHistory.jsx # Chat history display
│   ├── services/
│   │   ├── embeddingService.js     # OpenAI embeddings integration
│   │   ├── vectorSearch.js         # Similarity search logic
│   │   ├── reranker.js            # Result reranking
│   │   └── gptService.js          # GPT-4 integration
│   ├── utils/
│   │   ├── documentParser.js      # Document parsing (PDF/TXT/MD)
│   │   └── textChunker.js         # Text chunking with overlap
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # Application entry point
│   └── index.css                  # Global styles
├── public/
├── .env.example                   # Environment variables template
├── vercel.json                    # Vercel deployment config
└── package.json
```

## RAG Pipeline Details

### 1. Document Processing
- Documents are parsed based on file type
- Text is split into chunks of 800 tokens with 200-token overlap
- Each chunk is embedded using OpenAI's text-embedding-3-small model

### 2. Query Processing
- User questions are embedded using the same model
- Cosine similarity is calculated between query and all document chunks
- Top 5 most similar chunks are retrieved

### 3. Reranking
- Results are reranked based on:
  - Original similarity score
  - Exact term matches
  - Chunk length (more context = slight boost)

### 4. Answer Generation
- Top 3 reranked chunks are sent to GPT-4 as context
- GPT-4 generates a comprehensive answer
- Sources are displayed with relevance scores

## Configuration

### Chunking Strategy
Adjust in `src/utils/textChunker.js`:
```javascript
chunkText(text, chunkSize = 800, overlap = 200)
```

### Search Parameters
Modify in `src/App.jsx`:
```javascript
// Number of chunks to retrieve
searchSimilarChunks(questionEmbedding, document.chunks, 5)

// Number of chunks to send to GPT
rerankedChunks.slice(0, 3)
```

### GPT Model
Change in `src/services/gptService.js`:
```javascript
model: 'gpt-4'  // or 'gpt-4-turbo', 'gpt-3.5-turbo'
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_OPENAI_API_KEY` with your OpenAI API key

### Alternative: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy automatically on push

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for embeddings and GPT-4 | Yes |

## Limitations & Considerations

- **API Costs**: Each query uses OpenAI API (embeddings + GPT-4)
- **File Size**: Limited to 10MB per document
- **Browser Storage**: Documents are processed in-memory (not persisted)
- **Rate Limits**: Subject to OpenAI API rate limits
- **Security**: API key is exposed in browser (use backend proxy for production)

## Future Enhancements

- [ ] Backend API for secure API key management
- [ ] Persistent vector storage (Pinecone, Weaviate, etc.)
- [ ] Multi-document support
- [ ] Hybrid search (keyword + vector)
- [ ] User authentication
- [ ] Answer feedback collection
- [ ] Export conversation history
- [ ] Support for more file types (DOCX, HTML, etc.)

## Troubleshooting

### "Failed to process document"
- Check if your OpenAI API key is valid
- Ensure the document is not corrupted
- Try a smaller file

### "Failed to generate answer"
- Verify your OpenAI API key has GPT-4 access
- Check your API usage limits
- Ensure you have sufficient credits

### Slow performance
- Large documents take longer to process
- Consider reducing chunk size or number of chunks
- Use GPT-3.5-turbo for faster responses

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
