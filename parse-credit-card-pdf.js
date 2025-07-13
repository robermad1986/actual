const fs = require('fs');
const pdf = require('pdf-parse');

// Parser de PDF para tarjetas de crédito islandesas
async function parseCreditCardPDF() {
    console.log('🏦 Parseando PDF de Tarjeta de Crédito...');

    try {
        // Leer el archivo PDF
        const pdfBuffer = fs.readFileSync('/Users/rober/actual/docs/CreditCardTransactions_1644_21.11.2023_31.07.2025.pdf');

        // Parsear el PDF
        const data = await pdf(pdfBuffer);
        const text = data.text;

        // Dividir en líneas y limpiar
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        console.log('📑 Total de líneas:', lines.length);

        // Encontrar el inicio de las transacciones
        let startIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('DagsetningLýsingGengiErlend upphæðInnlend upphæð') ||
                lines[i].includes('Dagsetning') && lines[i].includes('Lýsing')) {
                startIndex = i + 1;
                console.log('📍 Inicio de transacciones encontrado en línea:', i + 1);
                break;
            }
        }

        if (startIndex === -1) {
            console.log('❌ No se encontró el inicio de las transacciones');
            return [];
        }

        // Parsear transacciones
        const transactions = [];
        let i = startIndex;

        while (i < lines.length) {
            const line = lines[i];

            // Buscar patrón de fecha al inicio de línea (DD.MM.YYYY)
            const dateMatch = line.match(/^(\d{1,2}\.\d{1,2}\.\d{4})/);

            if (dateMatch) {
                const date = dateMatch[1];
                const remainingLine = line.substring(date.length);

                // Verificar si es el final de transacciones (líneas de resumen)
                if (remainingLine.includes('Samtals') ||
                    remainingLine.includes('Skuld') ||
                    remainingLine.includes('Greiðsla') ||
                    remainingLine.includes('Staða')) {
                    console.log('📋 Fin de transacciones detectado en línea:', i + 1);
                    break;
                }

                let merchant = '';
                let amount = '';

                // Patrón 1: Todo en una línea
                // Ejemplo: "12.07.2025Gaeludyr.Is - Sölunóta-5.157 kr."
                const singleLineMatch = remainingLine.match(/^(.+?)-(\d{1,3}(?:\.\d{3})*(?:,\d{2})?) kr\.?$/);

                if (singleLineMatch) {
                    merchant = singleLineMatch[1].trim();
                    amount = '-' + singleLineMatch[2].replace(/\./g, '').replace(/,/g, '.');

                    // Limpiar merchant
                    merchant = merchant.replace(/ - Sölunóta$/, '').trim();

                    transactions.push({
                        date: convertDateFormat(date),
                        merchant: merchant,
                        amount: parseFloat(amount),
                        raw: line
                    });

                    i++;
                } else {
                    // Patrón 2: Multilinea
                    // Línea 1: "12.07.2025Kronan Nordurhellu -"
                    // Línea 2: "Sölunóta"  
                    // Línea 3: "-1.695 kr."

                    merchant = remainingLine.replace(/ -$/, '').trim();

                    // Buscar las siguientes líneas
                    let nextLineIndex = i + 1;
                    let foundAmount = false;

                    // Saltar líneas de "Sölunóta" y buscar el monto
                    while (nextLineIndex < lines.length && nextLineIndex < i + 5) {
                        const nextLine = lines[nextLineIndex];

                        // Verificar si es un monto
                        const amountMatch = nextLine.match(/^-(\d{1,3}(?:\.\d{3})*(?:,\d{2})?) kr\.?$/);
                        if (amountMatch) {
                            amount = '-' + amountMatch[1].replace(/\./g, '').replace(/,/g, '.');

                            transactions.push({
                                date: convertDateFormat(date),
                                merchant: merchant,
                                amount: parseFloat(amount),
                                raw: line + ' | ' + nextLine
                            });

                            foundAmount = true;
                            i = nextLineIndex + 1;
                            break;
                        }

                        nextLineIndex++;
                    }

                    if (!foundAmount) {
                        console.log('⚠️ No se encontró monto para transacción en línea:', i + 1, line);
                        i++;
                    }
                }
            } else {
                i++;
            }
        }

        console.log('💳 Transacciones parseadas:', transactions.length);

        // Mostrar las primeras 10 transacciones
        console.log('\n🎯 Primeras 10 transacciones:');
        transactions.slice(0, 10).forEach((trans, index) => {
            console.log(`${index + 1}. ${trans.date} | ${trans.merchant} | ${trans.amount} kr`);
        });

        // Estadísticas
        const totalAmount = transactions.reduce((sum, trans) => sum + trans.amount, 0);
        console.log('\n📊 Estadísticas:');
        console.log('  - Total transacciones:', transactions.length);
        console.log('  - Suma total:', totalAmount.toFixed(2), 'kr');
        console.log('  - Promedio por transacción:', (totalAmount / transactions.length).toFixed(2), 'kr');

        // Comerciantes más frecuentes
        const merchantCounts = {};
        transactions.forEach(trans => {
            const merchant = trans.merchant.split(' ')[0]; // Primera palabra
            merchantCounts[merchant] = (merchantCounts[merchant] || 0) + 1;
        });

        const topMerchants = Object.entries(merchantCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        console.log('\n🏪 Top 5 comerciantes:');
        topMerchants.forEach(([merchant, count]) => {
            console.log(`  - ${merchant}: ${count} transacciones`);
        });

        // Guardar en formato JSON para testing
        fs.writeFileSync('/Users/rober/actual/pdf-parsed-transactions.json', JSON.stringify(transactions, null, 2));
        console.log('\n💾 Transacciones guardadas en: pdf-parsed-transactions.json');

        return transactions;

    } catch (error) {
        console.error('❌ Error parseando PDF:', error);
        return [];
    }
}

// Convertir fecha de DD.MM.YYYY a YYYY-MM-DD
function convertDateFormat(dateStr) {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Ejecutar el parser
parseCreditCardPDF();
