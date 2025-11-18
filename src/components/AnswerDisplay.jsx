const AnswerDisplay = ({ answer, sources, timestamp }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Answer</h3>
            <span className="text-xs text-gray-500">{timestamp}</span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {answer}
          </div>
          
          {sources && sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Sources:</h4>
              <div className="space-y-2">
                {sources.map((source, idx) => (
                  <div key={idx} className="text-xs bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">Source {idx + 1}</span>
                      <span className="text-gray-500">
                        Relevance: {(source.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-3">{source.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerDisplay;
