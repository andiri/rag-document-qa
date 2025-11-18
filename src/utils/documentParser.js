import * as pdfjsLib from 'pdfjs-dist';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const parseDocument = async (file) => {
  const fileType = file.name.split('.').pop().toLowerCase();
  
  try {
    if (fileType === 'pdf') {
      return await parsePDF(file);
    } else if (fileType === 'txt' || fileType === 'md') {
      return await parseText(file);
    } else {
      throw new Error('Unsupported file type. Please upload PDF, TXT, or MD files.');
    }
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
};

const parsePDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return {
    text: fullText,
    metadata: {
      fileName: file.name,
      fileType: 'pdf',
      pages: pdf.numPages,
      uploadedAt: new Date().toISOString()
    }
  };
};

const parseText = async (file) => {
  const text = await file.text();
  return {
    text,
    metadata: {
      fileName: file.name,
      fileType: file.name.split('.').pop().toLowerCase(),
      uploadedAt: new Date().toISOString()
    }
  };
};
