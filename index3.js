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

// Función para predecir el valor de cierre y la señal de compra/venta en una fecha específica
function predecirValorCierre(datosHistoricos, fechaPrediccion) {
  const ventanaTemporal = 5; // Ajusta la cantidad de días anteriores a considerar

  // Estructurar los datos para la red neuronal
  const conjuntoDatos = [];
  for (let i = ventanaTemporal; i < datosHistoricos.length; i++) {
    const entrada = {
      input: {
        date: new Date(datosHistoricos[i].date).getTime(),
        ...Array.from({ length: ventanaTemporal }, (_, j) => ({
          [`close${j + 1}`]: datosHistoricos[i - j - 1].close,
        })),
      },
      output: {
        close: datosHistoricos[i].close,
        signal: obtenerSenal(datosHistoricos[i], datosHistoricos[i - 1]),
      },
    };
    conjuntoDatos.push(entrada);
  }

  // Obtener valores mínimos y máximos
  const valoresCierre = datosHistoricos.map(entry => entry.close);
  const min = Math.min(...valoresCierre);
  const max = Math.max(...valoresCierre);

  // Normalizar los datos
  const conjuntoDatosNormalizado = conjuntoDatos.map(entry => ({
    input: {
      date: normalizarDatos([entry.input.date], min, max)[0],
      ...Object.fromEntries(
        Array.from({ length: ventanaTemporal }, (_, j) => [
          `close${j + 1}`,
          normalizarDatos([entry.input[`close${j + 1}`]], min, max)[0],
        ])
      ),
    },
    output: {
      close: normalizarDatos([entry.output.close], min, max)[0],
      signal: entry.output.signal,
    },
  }));

  // Configuración de la red neuronal
  const configuracionRed = {
    inputSize: 1 + ventanaTemporal, // Tamaño de entrada ajustado
    outputSize: 2, // Salida para close y signal
    hiddenLayers: [8, 8], // Ajustar el tamaño y número de capas ocultas
  };

  // Configuración de entrenamiento
  const configuracionEntrenamiento = {
    learningRate: 0.01, // Ajustar la tasa de aprendizaje
    iterations: 5000, // Ajustar el número de iteraciones
  };

  // Crear y entrenar la red neuronal
  const redNeuronal = new brain.NeuralNetwork(configuracionRed);
  redNeuronal.train(conjuntoDatosNormalizado, configuracionEntrenamiento);

  // Realizar la predicción para la fecha específica
  const fechaPrediccionTimestamp = new Date(fechaPrediccion).getTime();
  const entradaPrediccion = normalizarDatos([fechaPrediccionTimestamp], min, max)[0];
  const datosAnteriores = datosHistoricos.slice(ventanaTemporal * -1);
  for (let j = 0; j < ventanaTemporal; j++) {
    entradaPrediccion[`close${j + 1}`] = normalizarDatos([datosAnteriores[j].close], min, max)[0];
  }
  const resultadoPrediccionNormalizado = redNeuronal.run(entradaPrediccion);
  const resultadoPrediccion = {
    close: desnormalizarResultado(resultadoPrediccionNormalizado.close, min, max),
    signal: resultadoPrediccionNormalizado.signal > 0 ? 'Compra' : 'Venta',
  };

  return resultadoPrediccion;
}

// Función para obtener la señal de compra/venta
function obtenerSenal(actual, anterior) {
  return actual.close > anterior.close ? 1 : -1;
}

// Ejemplo de uso
async function main() {
  const symbol = 'EDN.BA'; // Cambia el símbolo de acuerdo a la acción que quieras analizar
  const startDate = '2023-02-10';
  const endDate = new Date().toISOString().split('T')[0]; // Fecha actual

  const datosHistoricos = await obtenerDatosHistoricos(symbol, startDate, endDate);

  if (datosHistoricos.length > 0) {
    const fechaPrediccion = '2024-01-10'; // Cambia la fecha según tus necesidades
    const { close, signal } = predecirValorCierre(datosHistoricos, fechaPrediccion);

    console.log(`La predicción para ${fechaPrediccion} es: ${close} con señal de ${signal}`);
  } else {
    console.log('No se pudieron obtener datos históricos para la acción especificada.');
  }
}

main();
