const yahooFinance = require('yahoo-finance');
const brain = require('brain.js');

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

// Función para normalizar los datos
function normalizarDatos(datos, min, max) {
  return datos.map(valor => (valor - min) / (max - min));
}

// Función para desnormalizar el resultado
function desnormalizarResultado(resultado, min, max) {
  return resultado * (max - min) + min;
}

// Función para predecir el valor de cierre en una fecha específica
function predecirValorCierre(datosHistoricos, fechaPrediccion) {
  // Estructurar los datos para la red neuronal
  const conjuntoDatos = datosHistoricos.map(entry => ({
    input: { date: new Date(entry.date).getTime() },
    output: { close: entry.close },
  }));

  // Obtener valores mínimos y máximos
  const valoresCierre = datosHistoricos.map(entry => entry.close);
  const min = Math.min(...valoresCierre);
  const max = Math.max(...valoresCierre);

  // Normalizar los datos
  const conjuntoDatosNormalizado = conjuntoDatos.map(entry => ({
    input: { date: normalizarDatos([entry.input.date], min, max)[0] },
    output: { close: normalizarDatos([entry.output.close], min, max)[0] },
  }));

  // Configuración de la red neuronal
  const configuracionRed = {
    inputSize: 1,
    outputSize: 1,
    hiddenLayers: [3],
  };

  // Crear y entrenar la red neuronal
  const redNeuronal = new brain.NeuralNetwork(configuracionRed);
  redNeuronal.train(conjuntoDatosNormalizado);

  // Realizar la predicción para la fecha específica
  const fechaPrediccionTimestamp = new Date(fechaPrediccion).getTime();
  const entradaPrediccion = normalizarDatos([fechaPrediccionTimestamp], min, max)[0];
  const resultadoPrediccionNormalizado = redNeuronal.run({ date: entradaPrediccion });
  const resultadoPrediccion = desnormalizarResultado(
    resultadoPrediccionNormalizado.close,
    min,
    max
  );

  return resultadoPrediccion;
}

// Ejemplo de uso
async function main() {
  const symbol = 'BMA.BA'; // Cambia el símbolo de acuerdo a la acción que quieras analizar
  const startDate = '2023-01-02';
  const endDate = new Date().toISOString().split('T')[0]; // Fecha actual

  const datosHistoricos = await obtenerDatosHistoricos(symbol, startDate, endDate);

  if (datosHistoricos.length > 0) {
    const fechaPrediccion = '2024-01-10'; // Cambia la fecha según tus necesidades
    const valorPredicho = predecirValorCierre(datosHistoricos, fechaPrediccion);

    console.log(`La predicción para ${fechaPrediccion} es: ${valorPredicho}`);
  } else {
    console.log('No se pudieron obtener datos históricos para la acción especificada.');
  }
}

main();
