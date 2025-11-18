import { useState } from 'react';
import DocumentUploader from './components/DocumentUploader';
import ChatInterface from './components/ChatInterface';
import DocumentInfo from './components/DocumentInfo';
import ConversationHistory from './components/ConversationHistory';
import { parseDocument } from './utils/documentParser';
import { chunkText } from './utils/textChunker';
import { createEmbedding, createEmbeddings } from './services/embeddingService';
import { searchSimilarChunks } from './services/vectorSearch';
import { rerankResults } from './services/reranker';
import { generateAnswer } from './services/gptService';

function App() {
  const [document, setDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [error, setError] = useState(null);

  const handleDocumentUpload = async (file) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Step 1: Parse document
      const parsed = await parseDocument(file);
      
      // Step 2: Chunk text
      const chunks = chunkText(parsed.text);
      
      // Step 3: Create embeddings for all chunks
      const chunkTexts = chunks.map(c => c.text);
      const embeddings = await createEmbeddings(chunkTexts);
      
      // Step 4: Combine chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        ...chunk,
        embedding: embeddings[idx]
      }));
      
      setDocument({
        ...parsed,
        chunks: chunksWithEmbeddings
      });
      
      setConversationHistory([]);
    } catch (err) {
      console.error('Error processing document:', err);
      setError(err.message || 'Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitQuestion = async (question) => {
    if (!document || !document.chunks) return;
    
    setIsAnswering(true);
    setError(null);
    
    try {
      // Step 1: Create embedding for the question
      const questionEmbedding = await createEmbedding(question);
      
      // Step 2: Search for similar chunks
      const similarChunks = searchSimilarChunks(
        questionEmbedding,
        document.chunks,
        5
      );
      
      // Step 3: Rerank results
      const rerankedChunks = rerankResults(question, similarChunks);
      
      // Step 4: Generate answer using GPT
      const { answer } = await generateAnswer(
        question,
        rerankedChunks.slice(0, 3)
      );
      
      // Step 5: Add to conversation history
      const newEntry = {
        question,
        answer,
        sources: rerankedChunks.slice(0, 3),
        timestamp: new Date().toLocaleTimeString()
      };
      
      setConversationHistory(prev => [...prev, newEntry]);
    } catch (err) {
      console.error('Error answering question:', err);
      setError(err.message || 'Failed to generate answer. Please try again.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleRemoveDocument = () => {
    setDocument(null);
    setConversationHistory([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            RAG Document Q&A
          </h1>
          <p className="text-gray-600">
            Upload documents and ask questions powered by AI
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!document ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Upload Your Document
              </h2>
              <DocumentUploader
                onDocumentUpload={handleDocumentUpload}
                isProcessing={isProcessing}
              />
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works:</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-blue-600">1</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Upload</h4>
                    <p className="text-sm text-gray-600">Upload your PDF, TXT, or MD document</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-blue-600">2</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Process</h4>
                    <p className="text-sm text-gray-600">AI analyzes and indexes your content</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-blue-600">3</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Ask</h4>
                    <p className="text-sm text-gray-600">Get accurate answers from your document</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Info */}
              <DocumentInfo
                document={document}
                onRemove={handleRemoveDocument}
              />

              {/* Chat Interface */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <ChatInterface
                  onSubmitQuestion={handleSubmitQuestion}
                  isLoading={isAnswering}
                  disabled={!document}
                />
              </div>

              {/* Conversation History */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Conversation
                </h2>
                <ConversationHistory history={conversationHistory} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-600 text-sm">
          <p>Powered by OpenAI GPT-4 and Embeddings API</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
