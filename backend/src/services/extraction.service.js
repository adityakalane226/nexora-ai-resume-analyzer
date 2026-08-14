const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * service handling binary document parsing and plain text extraction
 */
class ExtractionService {
  /**
   * main text extraction dispatcher
   * @param {string} filepath absolute or relative path to uploaded file
   * @returns {promise<string>} extracted plain text string
   */
  static async extractText(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Target file not found at path: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);

    if (fileBuffer.length === 0) {
      const err = new Error('The uploaded file is empty.');
      err.statusCode = 400;
      err.errorCode = 'EMPTY_FILE';
      throw err;
    }

    let extractedText = '';

    if (ext === '.pdf') {
      extractedText = await this.extractFromPdf(fileBuffer);
    } else if (ext === '.docx' || ext === '.doc') {
      extractedText = await this.extractFromDocx(fileBuffer);
    } else {
      const err = new Error(`Unsupported extension for text extraction: ${ext}`);
      err.statusCode = 400;
      err.errorCode = 'UNSUPPORTED_EXTENSION';
      throw err;
    }

    // clean whitespace and normalize extracted text
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (!cleanedText || cleanedText.length < 10) {
      const err = new Error('Could not extract readable text from document. File may be corrupted, image-only, or encrypted.');
      err.statusCode = 400;
      err.errorCode = 'TEXT_EXTRACTION_FAILED';
      throw err;
    }

    return cleanedText;
  }

  /**
   * pdf parsing via pdf-parse
   */
  static async extractFromPdf(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (err) {
      const error = new Error(`Failed to parse PDF document: ${err.message}`);
      error.statusCode = 400;
      error.errorCode = 'CORRUPTED_PDF';
      throw error;
    }
  }

  /**
   * docx parsing via mammoth
   */
  static async extractFromDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      const error = new Error(`Failed to parse DOCX document: ${err.message}`);
      error.statusCode = 400;
      error.errorCode = 'CORRUPTED_DOCX';
      throw error;
    }
  }
}

module.exports = ExtractionService;
