const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzeCreditCardPDF() {
    console.log('📄 Analizando PDF de Tarjeta de Crédito...');

    try {
        // Leer el archivo PDF
        const pdfBuffer = fs.readFileSync('/Users/rober/actual/docs/CreditCardTransactions_1644_21.11.2023_31.07.2025.pdf');

        // Parsear el PDF
        const data = await pdf(pdfBuffer);

        console.log('📊 Información del PDF:');
        console.log('  - Número de páginas:', data.numpages);
        console.log('  - Información:', data.info);
        console.log('  - Metadata:', data.metadata);

        // Obtener el texto completo
        const text = data.text;
        console.log('\n📝 Longitud del texto extraído:', text.length, 'caracteres');

        // Dividir en líneas para análisis
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        console.log('📑 Número de líneas:', lines.length);

        // Mostrar las primeras 50 líneas para entender la estructura
        console.log('\n🔍 Primeras 50 líneas del PDF:');
        lines.slice(0, 50).forEach((line, index) => {
            console.log(`${(index + 1).toString().padStart(3, ' ')}: ${line.trim()}`);
        });

        // Buscar patrones de transacciones
        console.log('\n💳 Análisis de patrones de transacciones...');

        // Buscar líneas que contengan fechas (formato DD.MM.YYYY o DD/MM/YYYY)
        const datePattern = /(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{4})/;
        const possibleTransactionLines = lines.filter(line => datePattern.test(line));

        console.log('📅 Líneas con fechas encontradas:', possibleTransactionLines.length);

        if (possibleTransactionLines.length > 0) {
            console.log('\n🎯 Ejemplos de líneas con fechas (primeras 10):');
            possibleTransactionLines.slice(0, 10).forEach((line, index) => {
                console.log(`${index + 1}: ${line.trim()}`);
            });
        }

        // Buscar patrones de cantidades (números con decimales o comas)
        const amountPattern = /-?\d{1,3}(?:[.,]\d{3})*[.,]?\d{0,2}/;
        const amountLines = lines.filter(line => amountPattern.test(line));

        console.log('\n💰 Líneas con cantidades encontradas:', amountLines.length);

        if (amountLines.length > 0) {
            console.log('\n💵 Ejemplos de líneas con cantidades (primeras 10):');
            amountLines.slice(0, 10).forEach((line, index) => {
                console.log(`${index + 1}: ${line.trim()}`);
            });
        }

        // Buscar palabras clave islandesas relacionadas con tarjetas de crédito
        const keywords = ['Kreditkort', 'kreditkort', 'Dagsetning', 'dagsetning', 'Upphæð', 'upphæð', 'Lýsing', 'lýsing'];

        console.log('\n🔑 Búsqueda de palabras clave islandesas:');
        keywords.forEach(keyword => {
            const count = (text.match(new RegExp(keyword, 'g')) || []).length;
            if (count > 0) {
                console.log(`  - "${keyword}": ${count} ocurrencias`);
            }
        });

        // Buscar secciones del PDF
        const sections = [];
        lines.forEach((line, index) => {
            if (line.includes('Kreditkort') || line.includes('KREDITKORT') ||
                line.includes('Yfirlit') || line.includes('YFIRLIT') ||
                line.includes('Hreyfingar') || line.includes('HREYFINGAR')) {
                sections.push({
                    line: index + 1,
                    content: line.trim()
                });
            }
        });

        console.log('\n📋 Secciones importantes encontradas:');
        sections.forEach(section => {
            console.log(`  Línea ${section.line}: ${section.content}`);
        });

        // Guardar el texto completo para análisis posterior
        fs.writeFileSync('/Users/rober/actual/pdf-text-analysis.txt', text);
        console.log('\n💾 Texto completo guardado en: pdf-text-analysis.txt');

        // Guardar líneas estructuradas para análisis
        const structuredData = {
            info: data.info,
            metadata: data.metadata,
            totalPages: data.numpages,
            totalLines: lines.length,
            lines: lines,
            transactionLines: possibleTransactionLines,
            amountLines: amountLines,
            sections: sections
        };

        fs.writeFileSync('/Users/rober/actual/pdf-structured-analysis.json', JSON.stringify(structuredData, null, 2));
        console.log('💾 Análisis estructurado guardado en: pdf-structured-analysis.json');

    } catch (error) {
        console.error('❌ Error analizando PDF:', error);
    }
}

analyzeCreditCardPDF();
