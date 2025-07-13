const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzePDFContent() {
    console.log('🔍 Analyzing PDF Content Structure...');

    try {
        const pdfPath = '/Users/rober/actual/docs/CreditCardTransactions_1644_21.11.2023_31.07.2025.pdf';

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        console.log('📊 Basic Statistics:');
        console.log('  - Pages:', data.numpages);
        console.log('  - Text length:', data.text.length, 'characters');

        const lines = data.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log('  - Total lines:', lines.length);

        // Look for different patterns
        console.log('\n🔍 Pattern Analysis:');

        // Date patterns
        const datePattern = /^\d{1,2}\.\d{1,2}\.\d{4}/;
        const dateLines = lines.filter(line => datePattern.test(line));
        console.log('  - Lines starting with dates:', dateLines.length);

        // Amount patterns
        const amountPattern = /-?\d{1,3}(?:\.\d{3})*(?:,\d{2})? kr\.?$/;
        const amountLines = lines.filter(line => amountPattern.test(line));
        console.log('  - Lines ending with amounts:', amountLines.length);

        // Check for headers
        console.log('\n📋 Header Analysis:');
        const headers = lines.filter(line =>
            line.includes('Dagsetning') ||
            line.includes('Lýsing') ||
            line.includes('upphæð') ||
            line.includes('DagsetningLýsingGengiErlend') ||
            line.includes('Kreditkortayfirlit')
        );
        console.log('  - Header lines found:', headers.length);
        headers.forEach(header => console.log('    -', header));

        // Look for transaction end markers
        console.log('\n🏁 End Marker Analysis:');
        const endMarkers = lines.filter(line =>
            line.includes('Samtals') ||
            line.includes('Skuld') ||
            line.includes('Greiðsla') ||
            line.includes('Staða') ||
            line.includes('Lágmarksgreiðsla')
        );
        console.log('  - End marker lines found:', endMarkers.length);
        endMarkers.forEach(marker => console.log('    -', marker));

        // Sample of date lines to understand structure
        console.log('\n📝 Sample Date Lines (first 10):');
        dateLines.slice(0, 10).forEach((line, index) => {
            console.log(`  ${index + 1}. ${line}`);
        });

        // Sample of amount lines
        console.log('\n💰 Sample Amount Lines (first 10):');
        amountLines.slice(0, 10).forEach((line, index) => {
            console.log(`  ${index + 1}. ${line}`);
        });

        // Look for patterns with Kronan
        console.log('\n🏪 Kronan Pattern Analysis:');
        const kronanLines = lines.filter(line => line.includes('Kronan'));
        console.log('  - Lines containing "Kronan":', kronanLines.length);
        kronanLines.slice(0, 5).forEach((line, index) => {
            console.log(`  ${index + 1}. ${line}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

analyzePDFContent();
