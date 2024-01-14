const technicalIndicators = require('technicalindicators');

// Función para obtener datos históricos desde Yahoo Finance
async function obtenerDatosHistoricos(symbol, startDate, endDate) {
  try {
    const yahooFinance = require('yahoo-finance');
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
function esBuenDiaParaComprar(datosHistoricos) {
  const cierres = datosHistoricos.map(entry => entry.close);

  // Calcular medias móviles
  const sma20 = new technicalIndicators.SMA({ period: 20, values: cierres });
  const sma50 = new technicalIndicators.SMA({ period: 50, values: cierres });

  // Calcular el RSI
  const rsi = new technicalIndicators.RSI({ period: 14, values: cierres });

  // Obtener los últimos valores de los indicadores
  const ultimaSMA20 = sma20.getResult()[sma20.getResult().length - 1];
  const ultimaSMA50 = sma50.getResult()[sma50.getResult().length - 1];
  const ultimoRSI = rsi.getResult()[rsi.getResult().length - 1];

  // Condiciones para determinar si es un buen día para comprar
  const cruzaronMediasMoviles = ultimaSMA20 > ultimaSMA50;
  const rsiBajo = ultimoRSI < 30;

  return cruzaronMediasMoviles && rsiBajo;
}

// Función para calcular el precio de venta objetivo
function calcularPrecioVentaObjetivo(cierreActual, porcentajeGanancia) {
  const gananciaDecimal = porcentajeGanancia / 100;
  const precioVentaObjetivo = cierreActual * (1 + gananciaDecimal);
  return precioVentaObjetivo.toFixed(2);
}

// Ejemplo de uso
async function main() {
  const symbol = 'BBAR.BA'; // Cambia el símbolo de acuerdo a la acción que quieras analizar
  const startDate = '2023-01-02';
  const endDate = new Date().toISOString().split('T')[0]; // Fecha actual

  const datosHistoricos = await obtenerDatosHistoricos(symbol, startDate, endDate);

  if (datosHistoricos.length > 0) {
    const cierreActual = datosHistoricos[0].close;
    const buenDiaParaComprar = esBuenDiaParaComprar(datosHistoricos);

    if (buenDiaParaComprar) {
      const porcentajeGananciaObjetivo = 5; // Ajusta según tus objetivos
      const precioVentaObjetivo = calcularPrecioVentaObjetivo(cierreActual, porcentajeGananciaObjetivo);
      console.log(`Es un buen día para comprar. Precio de venta objetivo: $${precioVentaObjetivo}`);
    } else {
      console.log('No es un buen día para comprar.');
    }
  } else {
    console.log('No se pudieron obtener datos históricos para la acción especificada.');
  }
}

main();
