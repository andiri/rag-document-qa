const ConversationHistory = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm mt-2">Upload a document and ask questions to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index} className="space-y-3">
          {/* Question */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 bg-gray-100 rounded-lg p-4">
              <p className="text-gray-800">{item.question}</p>
              <span className="text-xs text-gray-500 mt-2 block">{item.timestamp}</span>
            </div>
          </div>

          {/* Answer */}
          <div className="flex items-start gap-3 ml-11">
            <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
              
              {item.sources && item.sources.length > 0 && (
                <details className="mt-3 pt-3 border-t border-blue-200">
                  <summary className="text-sm font-medium text-blue-700 cursor-pointer hover:text-blue-800">
                    View {item.sources.length} source{item.sources.length > 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 space-y-2">
                    {item.sources.map((source, idx) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border border-blue-200">
                        <div className="font-medium text-gray-700 mb-1">
                          Source {idx + 1} ({(source.similarity * 100).toFixed(1)}% match)
                        </div>
                        <p className="text-gray-600 line-clamp-2">{source.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationHistory;
