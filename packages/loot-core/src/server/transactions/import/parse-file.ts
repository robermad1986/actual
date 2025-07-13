// @ts-strict-ignore
import { parse as csv2json } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';

import * as fs from '../../../platform/server/fs';
// Force compilation refresh for XLSX multi-bank support
import { looselyParseAmount } from '../../../shared/util';

import { ofx2json } from './ofx2json';
import { qif2json } from './qif2json';
import { xmlCAMT2json } from './xmlcamt2json';

type ParseError = { message: string; internal: string };
export type ParseFileResult = {
  errors?: ParseError[];
  transactions?: unknown[];
};

export type ParseFileOptions = {
  hasHeaderRow?: boolean;
  delimiter?: string;
  fallbackMissingPayeeToMemo?: boolean;
  skipLines?: number;
  importNotes?: boolean;
};

export async function parseFile(
  filepath: string,
  options: ParseFileOptions = {},
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();
  const m = filepath.match(/\.[^.]*$/);

  if (m) {
    const ext = m[0];

    switch (ext.toLowerCase()) {
      case '.qif':
        return parseQIF(filepath, options);
      case '.csv':
      case '.tsv':
        return parseCSV(filepath, options);
      case '.ofx':
      case '.qfx':
        return parseOFX(filepath, options);
      case '.xml':
        return parseCAMT(filepath, options);
      case '.xlsx':
        return parseXLSX(filepath, options);
      case '.pdf':
        return parsePDF(filepath, options);
      default:
    }
  }

  errors.push({
    message: 'Invalid file type',
    internal: '',
  });
  return { errors, transactions: [] };
}

async function parseCSV(
  filepath: string,
  options: ParseFileOptions,
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();
  let contents = await fs.readFile(filepath);

  if (options.skipLines > 0) {
    const lines = contents.split(/\r?\n/);
    contents = lines.slice(options.skipLines).join('\r\n');
  }

  let data;
  try {
    data = csv2json(contents, {
      columns: options?.hasHeaderRow,
      bom: true,
      delimiter: options?.delimiter || ',',
      // eslint-disable-next-line actual/typography
      quote: '"',
      trim: true,
      relax_column_count: true,
      skip_empty_lines: true,
    });
  } catch (err) {
    errors.push({
      message: 'Failed parsing: ' + err.message,
      internal: err.message,
    });
    return { errors, transactions: [] };
  }

  return { errors, transactions: data };
}

async function parseQIF(
  filepath: string,
  options: ParseFileOptions = {},
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();
  const contents = await fs.readFile(filepath);

  let data;
  try {
    data = qif2json(contents);
  } catch (err) {
    errors.push({
      message: 'Failed parsing: doesn’t look like a valid QIF file.',
      internal: err.stack,
    });
    return { errors, transactions: [] };
  }

  return {
    errors: [],
    transactions: data.transactions
      .map(trans => ({
        amount: trans.amount != null ? looselyParseAmount(trans.amount) : null,
        date: trans.date,
        payee_name: trans.payee,
        imported_payee: trans.payee,
        notes: options.importNotes ? trans.memo || null : null,
      }))
      .filter(trans => trans.date != null && trans.amount != null),
  };
}

async function parseOFX(
  filepath: string,
  options: ParseFileOptions,
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();
  const contents = await fs.readFile(filepath);

  let data;
  try {
    data = await ofx2json(contents);
  } catch (err) {
    errors.push({
      message: 'Failed importing file',
      internal: err.stack,
    });
    return { errors };
  }

  // Banks don't always implement the OFX standard properly
  // If no payee is available try and fallback to memo
  const useMemoFallback = options.fallbackMissingPayeeToMemo;

  return {
    errors,
    transactions: data.transactions.map(trans => {
      return {
        amount: trans.amount,
        imported_id: trans.fitId,
        date: trans.date,
        payee_name: trans.name || (useMemoFallback ? trans.memo : null),
        imported_payee: trans.name || (useMemoFallback ? trans.memo : null),
        notes: options.importNotes ? trans.memo || null : null, //memo used for payee
      };
    }),
  };
}

async function parseCAMT(
  filepath: string,
  options: ParseFileOptions = {},
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();
  const contents = await fs.readFile(filepath);

  let data;
  try {
    data = await xmlCAMT2json(contents);
  } catch (err) {
    console.error(err);
    errors.push({
      message: 'Failed importing file',
      internal: err.stack,
    });
    return { errors };
  }

  return {
    errors,
    transactions: data.map(trans => ({
      ...trans,
      notes: options.importNotes ? trans.notes : null,
    })),
  };
}

async function parseXLSX(
  filepath: string,
  options: ParseFileOptions = {},
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();

  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filepath, null); // null means read as buffer

    // Parse the XLSX file with cellDates option to convert Excel date numbers to JS Dates
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true, // Convert Excel date serial numbers to JavaScript Date objects
      cellNF: true     // Include number format information
    });

    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row detection
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Return array of arrays
      raw: true, // Keep raw values including Date objects
      defval: null // Use null for empty cells
    });

    if (rawData.length === 0) {
      return { errors: [], transactions: [] };
    }

    // DEBUG: Log the first few rows to understand the structure
    console.log('XLSX Debug - First 10 rows:', rawData.slice(0, 10));
    console.log('XLSX Debug - Sheet name:', sheetName);

    // Detect if this is a credit card statement
    const isCreditCardSheet = sheetName.toLowerCase().includes('kreditkort') ||
      sheetName.toLowerCase().includes('credit');

    console.log('XLSX Debug - Is Credit Card Sheet:', isCreditCardSheet);

    // Look for the transaction header row - support multiple bank formats
    let headerRowIndex = -1;
    let dataStartIndex = -1;

    // Look for headers with financial terms (supports both Icelandic and English banks)
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      console.log(`XLSX Debug - Checking row ${i} for headers:`, row);

      if (Array.isArray(row)) {
        // Check each cell individually for debugging
        row.forEach((cell, cellIndex) => {
          if (typeof cell === 'string') {
            const lowerCell = cell.toLowerCase();
            console.log(`XLSX Debug - Cell ${cellIndex}: "${cell}" -> "${lowerCell}"`);

            const matches = [
              lowerCell.includes('created at') && 'created at',
              lowerCell.includes('description') && 'description',
              lowerCell.includes('amount') && 'amount',
              lowerCell.includes('balance') && 'balance',
              lowerCell.includes('type') && 'type'
            ].filter(Boolean);

            if (matches.length > 0) {
              console.log(`XLSX Debug - Cell "${cell}" matches:`, matches);
            }
          }
        });

        const hasFinancialTerms = row.some(cell =>
          typeof cell === 'string' && (
            // Arion Banki (Icelandic) terms
            cell.includes('Dagsetning') ||
            cell.includes('dagsetning') ||
            cell.includes('Texti') ||
            cell.includes('texti') ||
            cell.includes('Fjárhæð') ||
            cell.includes('fjárhæð') ||
            cell.includes('Upphæð') ||
            cell.includes('upphæð') ||
            cell.includes('Vaxtadagsetning') ||
            cell.includes('vaxtadagsetning') ||
            cell.includes('Skýring') ||
            cell.includes('skýring') ||
            cell.includes('Nafn viðtakanda eða greiðanda') ||
            cell.includes('nafn viðtakanda eða greiðanda') ||
            // Savings account (English) terms - use toLowerCase for all comparisons
            cell.toLowerCase().includes('created at') ||
            cell.toLowerCase().includes('description') ||
            cell.toLowerCase().includes('amount') ||
            cell.toLowerCase().includes('balance') ||
            cell.toLowerCase().includes('type') ||
            // Credit card specific terms (Icelandic)
            cell.includes('Lýsing') ||
            cell.includes('lýsing') ||
            cell.includes('Innlend upphæð') ||
            cell.includes('innlend upphæð') ||
            cell.includes('Erlend upphæð') ||
            cell.includes('erlend upphæð') ||
            cell.includes('Gengi') ||
            cell.includes('gengi') ||
            cell.includes('Heimildarnúmer') ||
            cell.includes('heimildarnúmer') ||
            cell.includes('Lýsing færslu') ||
            cell.includes('lýsing færslu') ||
            // Credit card terms (English)
            cell.toLowerCase().includes('merchant') ||
            cell.toLowerCase().includes('purchase') ||
            cell.toLowerCase().includes('card number') ||
            cell.toLowerCase().includes('authorization') ||
            cell.toLowerCase().includes('posting date') ||
            cell.toLowerCase().includes('transaction date') ||
            cell.toLowerCase().includes('charge') ||
            cell.toLowerCase().includes('credit') ||
            cell.toLowerCase().includes('debit') ||
            // Generic financial terms
            cell.toLowerCase().includes('date') ||
            cell.toLowerCase().includes('transaction') ||
            cell.toLowerCase().includes('payment') ||
            cell.toLowerCase().includes('reference')
          )
        );

        console.log(`XLSX Debug - Row ${i} hasFinancialTerms:`, hasFinancialTerms);

        if (hasFinancialTerms) {
          headerRowIndex = i;
          dataStartIndex = i + 1;
          console.log('XLSX Debug - Found header row at index:', i, 'Headers:', row);
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      // Enhanced debugging for header detection failure
      console.log('XLSX Debug - Header detection failed. Analyzing file structure:');
      console.log('XLSX Debug - Total rows:', rawData.length);

      for (let i = 0; i < Math.min(20, rawData.length); i++) {
        const row = rawData[i];
        if (Array.isArray(row) && row.length > 2) {
          console.log(`XLSX Debug - Row ${i}:`, row);

          // Check each cell for header patterns
          const hasHeaderPattern = row.some(cell => {
            if (cell && typeof cell === 'string') {
              const lowerCell = cell.toLowerCase();
              const isHeader = lowerCell.includes('created at') ||
                lowerCell.includes('description') ||
                lowerCell.includes('amount') ||
                lowerCell.includes('dagsetning') ||
                lowerCell.includes('upphæð');
              if (isHeader) {
                console.log(`XLSX Debug - Found header pattern "${cell}" in row ${i}`);
              }
              return isHeader;
            }
            return false;
          });

          if (hasHeaderPattern) {
            console.log(`XLSX Debug - Row ${i} has header patterns but failed main detection logic`);
          }
        }
      }

      errors.push({
        message: 'Could not find transaction header row in XLSX file. Please check the file format.',
        internal: 'Header row with date/amount columns not found',
      });
      return { errors, transactions: [] };
    }

    // Extract headers and data
    const headers = rawData[headerRowIndex] as string[];
    const dataRows = rawData.slice(dataStartIndex);

    console.log('XLSX Debug - Headers found:', headers);
    console.log('XLSX Debug - First 3 data rows:', dataRows.slice(0, 3));

    // Convert to objects using headers as keys (like CSV parser does)
    const transactions = dataRows
      .filter((row: unknown): row is any[] =>
        Array.isArray(row) && row.some(cell => cell !== null && cell !== ''))
      .map((row: any[], index: number) => {
        const transaction: any = {};

        headers.forEach((header, colIndex) => {
          if (header && header.trim()) {
            const cellValue = row[colIndex];
            const headerKey = header.trim();

            // Handle different date formats and data types
            if (cellValue instanceof Date) {
              // Excel Date objects (Arion Banki) - convert to YYYY-MM-DD format
              transaction[headerKey] = cellValue.toISOString().split('T')[0];
            } else if (typeof cellValue === 'string' && cellValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
              // DD.MM.YYYY string format (Savings account) - convert to YYYY-MM-DD
              const [day, month, year] = cellValue.split('.');
              transaction[headerKey] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
              // All other values - store as-is
              transaction[headerKey] = cellValue;
            }
          }
        });

        // Debug first few transactions
        if (index < 3) {
          console.log(`XLSX Debug - Transaction ${index}:`, transaction);
        }

        return transaction;
      })
      .filter(trans => Object.keys(trans).length > 0); // Only include non-empty transactions

    console.log('XLSX Debug - Total transactions parsed:', transactions.length);

    return { errors, transactions };

  } catch (err) {
    console.error('XLSX Parsing Error:', err);
    errors.push({
      message: 'Failed parsing XLSX file: ' + err.message,
      internal: err.stack || err.message,
    });
    return { errors, transactions: [] };
  }
}

async function parsePDF(
  filepath: string,
  options: ParseFileOptions = {},
): Promise<ParseFileResult> {
  const errors = Array<ParseError>();

  try {
    console.log('PDF Debug - Starting PDF parsing for:', filepath);

    // Read the PDF file as a buffer
    const buffer = await fs.readFile(filepath, null); // null means read as buffer

    // Parse the PDF to extract text
    const data = await pdfParse(buffer);
    const text = data.text;

    console.log('PDF Debug - Extracted text length:', text.length, 'characters');

    // Split into lines and clean
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('PDF Debug - Total lines:', lines.length);

    // Find the start of transactions by looking for credit card headers
    let startIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for Icelandic credit card headers
      if (line.includes('DagsetningLýsingGengiErlend upphæðInnlend upphæð') ||
        line.includes('Kreditkortayfirlit') ||
        (line.includes('Dagsetning') && line.includes('Lýsing') && line.includes('upphæð'))) {
        startIndex = i + 1;
        console.log('PDF Debug - Transaction start found at line:', i + 1);
        break;
      }
    }

    if (startIndex === -1) {
      errors.push({
        message: 'Could not find credit card transaction section in PDF. Please check if this is a valid credit card statement.',
        internal: 'No credit card headers found in PDF text',
      });
      return { errors, transactions: [] };
    }

    // Parse transactions
    const transactions = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = lines[i];

      // Look for date pattern at start of line (DD.MM.YYYY)
      const dateMatch = line.match(/^(\d{1,2}\.\d{1,2}\.\d{4})/);

      if (dateMatch) {
        const date = dateMatch[1];
        const remainingLine = line.substring(date.length);

        // Check if this is the end of transactions (summary lines)
        if (remainingLine.includes('Samtals') ||
          remainingLine.includes('Skuld') ||
          remainingLine.includes('Greiðsla') ||
          remainingLine.includes('Staða') ||
          remainingLine.includes('Lágmarksgreiðsla')) {
          console.log('PDF Debug - End of transactions detected at line:', i + 1);
          break;
        }

        let merchant = '';
        let amount = '';

        // Pattern 1: Everything in one line (complete transaction)
        // Example: "12.07.2025Gaeludyr.Is - Sölunóta-5.157 kr."
        // Or embedded amounts: "20.05.2025Innborgun - Innborgun200.000 kr."
        let singleLineMatch = remainingLine.match(/^(.+?)-(\d{1,3}(?:\.\d{3})*(?:,\d{2})?) kr\.?$/);

        // If no match, try pattern with embedded amounts
        if (!singleLineMatch) {
          singleLineMatch = remainingLine.match(/^(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?) kr\.?$/);
        }

        if (singleLineMatch) {
          merchant = singleLineMatch[1].trim();
          amount = '-' + singleLineMatch[2].replace(/\./g, '').replace(',', '.');

          // Clean merchant name
          merchant = merchant.replace(/ - Sölunóta$/, '').replace(/ -$/, '').trim();

          transactions.push({
            date: convertPDFDateFormat(date),
            payee_name: merchant,
            imported_payee: merchant,
            amount: parseFloat(amount),
            notes: 'Imported from PDF'
          });

          i++;
        } else {
          // Pattern 2: Multi-line format
          // Line 1: "12.07.2025Kronan Nordurhellu -" (ends with " -")
          // Line 2+: Continue looking for amount line

          merchant = remainingLine.replace(/ -$/, '').trim();

          // Look for amount in following lines (more flexible search)
          let nextLineIndex = i + 1;
          let foundAmount = false;

          // Look for amount within next 10 lines (increased from 5)
          while (nextLineIndex < lines.length && nextLineIndex < i + 10) {
            const nextLine = lines[nextLineIndex];

            // Check if this line contains an amount pattern
            const amountMatch = nextLine.match(/^-(\d{1,3}(?:\.\d{3})*(?:,\d{2})?) kr\.?$/);
            if (amountMatch) {
              amount = '-' + amountMatch[1].replace(/\./g, '').replace(',', '.');

              transactions.push({
                date: convertPDFDateFormat(date),
                payee_name: merchant,
                imported_payee: merchant,
                amount: parseFloat(amount),
                notes: 'Imported from PDF'
              });

              foundAmount = true;
              i = nextLineIndex + 1;
              break;
            }

            // If this line also starts with a date, we missed the amount for previous transaction
            // Skip this transaction and let the next iteration handle the new date line
            if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(nextLine)) {
              console.log('PDF Debug - Found new date before amount, skipping transaction:', line);
              i = nextLineIndex;
              foundAmount = true; // Set to true to exit the loop
              break;
            }

            nextLineIndex++;
          }

          if (!foundAmount) {
            console.log('PDF Debug - No amount found for transaction at line:', i + 1, line);
            i++;
          }
        }
      } else {
        i++;
      }
    }

    console.log('PDF Debug - Total transactions parsed:', transactions.length);

    if (transactions.length === 0) {
      errors.push({
        message: 'No transactions found in PDF. Please check if this is a valid credit card statement with transaction data.',
        internal: 'Zero transactions parsed from PDF',
      });
    }

    return { errors, transactions };

  } catch (err) {
    console.error('PDF Parsing Error:', err);
    errors.push({
      message: 'Failed parsing PDF file: ' + err.message,
      internal: err.stack || err.message,
    });
    return { errors, transactions: [] };
  }
}

// Convert date from DD.MM.YYYY to YYYY-MM-DD format
function convertPDFDateFormat(dateStr: string): string {
  const [day, month, year] = dateStr.split('.');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
