import pdfParse from 'pdf-parse';

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
  const data = await pdfParse(Buffer.from(arrayBuffer));
  return {
    text: data.text,
    metadata: {
      fileName: file.name,
      fileType: 'pdf',
      pages: data.numpages,
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
