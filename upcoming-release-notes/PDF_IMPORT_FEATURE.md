# Release Notes: PDF Import for Credit Card Statements

## 🆕 New Feature: PDF Transaction Import

### What's New
Added support for importing credit card transactions directly from PDF statements, providing an alternative to XLSX/CSV imports for users whose banks provide PDF statements more readily than spreadsheet formats.

### Key Benefits
- **Richer Data**: PDF statements often contain more complete transaction history than exported XLSX files
- **Easier Access**: Many banks provide PDF statements more readily than custom export formats
- **Icelandic Support**: Specifically optimized for Icelandic credit card statement formats
- **Robust Parsing**: Handles multiple transaction format variations automatically

### Implementation
- **Desktop App Only**: PDF import requires the Actual desktop application (not available in browser version)
- **File Support**: Supports text-based PDF credit card statements
- **Pattern Recognition**: Automatically detects and parses transaction dates, merchants, and amounts
- **Error Handling**: Comprehensive error messages for unsupported or malformed PDF files

### Usage
1. Open Actual desktop application
2. Navigate to transaction import
3. Select your PDF credit card statement file
4. Enable "Flip amount" checkbox for credit card imports
5. Review and import transactions

### Technical Details
- **Library**: Uses pdf-parse for text extraction
- **Formats Supported**: DD.MM.YYYY date format, Icelandic merchant names, kr. currency
- **Transaction Types**: Handles both single-line and multi-line transaction formats
- **Performance**: Efficiently processes multi-page PDF statements

### Example Compatibility
Successfully tested with Icelandic credit card statements containing:
- Kronan supermarket transactions
- Spotify subscriptions  
- Apple services
- International travel expenses
- Various merchant formats

### Known Limitations
- Desktop application only (requires Node.js environment)
- Optimized for Icelandic credit card format
- Requires text-based PDFs (not scanned images)
- Limited to credit card statements (not checking accounts)

### Future Improvements
- Multi-language support for other countries
- Additional bank format recognition
- Enhanced error recovery for malformed PDFs

This feature addresses the common user request: "mi banco tiene problemas para facilitarme los extractos en XLSX para la tarjeta de crédito, pero me resulta sencillo conseguir PDFs, podemos implementarlo?" (My bank has trouble providing XLSX credit card statements, but I can easily get PDFs, can we implement this?)

---

**Version**: Latest  
**Platform**: Desktop Application  
**Impact**: Enhanced import capabilities for PDF-based banking workflows
