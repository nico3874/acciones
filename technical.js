const yahooFinance = require('yahoo-finance');
const TechnicalIndicators = require('technicalindicators');

// Función para obtener datos históricos desde Yahoo Finance
async function obtenerDatosHistoricos(symbol, startDate, endDate) {
  try {
    const datosHistoricos = await yahooFinance.historical({
      symbol: symbol,
      from: startDate,
      to: endDate,
    });
    return datosHistoricos.reverse(); // Invertir el array para tener los datos en orden cronológico ascendente
  } catch (error) {
    console.error('Error al obtener datos históricos:', error.message);
    return [];
  }
}

// Función para determinar si es un buen día para comprar
function esBuenDiaParaComprar(cierreActual, bollingerBand, mediaMovilCorta, mediaMovilLarga) {
  return cierreActual < bollingerBand.lower && mediaMovilCorta > mediaMovilLarga;
}

// Función para determinar si es un buen día para vender
function esBuenDiaParaVender(cierreActual, bollingerBand, mediaMovilCorta, mediaMovilLarga) {
  return cierreActual > bollingerBand.upper || mediaMovilCorta < mediaMovilLarga;
}

// Ejemplo de uso
async function main() {
  const symbol = 'BBAR.BA'; // Cambia el símbolo de acuerdo a la acción que quieras analizar
  const startDate = '2023-01-02';
  const endDate = new Date().toISOString().split('T')[0]; // Fecha actual

  const datosHistoricos = await obtenerDatosHistoricos(symbol, startDate, endDate);

  if (datosHistoricos.length > 0) {
    // Calcular Bandas de Bollinger
    const closes = datosHistoricos.map(entry => entry.close);
    const bollingerBand = TechnicalIndicators.BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2, // Número de desviaciones estándar para las bandas
    });

    // Calcular medias móviles
    const mediaMovilCorta = TechnicalIndicators.SMA.calculate({ period: 50, values: closes });
    const mediaMovilLarga = TechnicalIndicators.SMA.calculate({ period: 200, values: closes });

    // Obtener el precio de cierre actual
    const cierreActual = datosHistoricos[0].close;

    // Verificar si es un buen día para comprar
    if (esBuenDiaParaComprar(cierreActual, bollingerBand[0], mediaMovilCorta[0], mediaMovilLarga[0])) {
      console.log(`Es un buen día para comprar. Precio de venta objetivo: Según la valoración del mercado.`);
    }
    // Verificar si es un buen día para vender
    else if (esBuenDiaParaVender(cierreActual, bollingerBand[0], mediaMovilCorta[0], mediaMovilLarga[0])) {
      console.log(`Es un buen día para vender. Precio de venta objetivo: Según la valoración del mercado.`);
    } else {
      console.log('No es un buen día para comprar ni vender.');
    }
  } else {
    console.log('No se pudieron obtener datos históricos para la acción especificada.');
  }
}

main();
