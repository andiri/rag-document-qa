const DocumentInfo = ({ document, onRemove }) => {
  if (!document) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{document.metadata.fileName}</h3>
            <div className="flex gap-4 text-sm text-gray-600 mt-1">
              <span>Type: {document.metadata.fileType.toUpperCase()}</span>
              {document.metadata.pages && <span>Pages: {document.metadata.pages}</span>}
              <span>Chunks: {document.chunks?.length || 0}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default DocumentInfo;
