// obtener_datos.js

const fs = require('fs');
const axios = require('axios');

const ALPHA_VANTAGE_API_KEY = 'TU_CLAVE_API_DE_ALPHA_VANTAGE'; // Reemplaza con tu propia clave API

async function obtenerDatosHistoricos() {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=O0X4B1D5ZHLA4VK6`
    );

    const data = response.data['Time Series (Daily)'];

    const datos = Object.entries(data)
      .map(([fecha, valores]) => [parseFloat(valores['1. open']), parseFloat(valores['2. high']), parseFloat(valores['3. low']), parseFloat(valores['5. volume']), parseFloat(valores['4. close'])])
      .reverse();

    return datos;
  } catch (error) {
    console.error('Error al obtener datos históricos:', error);
    throw error;
  }
}

function normalizarDatos(datos, minimos, maximos) {
  const datosNormalizados = datos.map(valores =>
    valores.map((valor, i) => (valor - minimos[i]) / (maximos[i] - minimos[i]))
  );

  return datosNormalizados;
}

function guardarDatosLocal(datosNormalizados) {
  const datosString = datosNormalizados.map(valores => valores.join(',')).join('\n');
  fs.writeFileSync('datos_normalizados.csv', datosString);
  console.log('Datos normalizados guardados en "datos_normalizados.csv".');
}

// Obtener datos históricos
obtenerDatosHistoricos().then(datos => {
  const minimos = datos.reduce((min, valores) => valores.map((valor, i) => Math.min(valor, min[i])), Array.from({ length: datos[0].length }, () => Infinity));
  const maximos = datos.reduce((max, valores) => valores.map((valor, i) => Math.max(valor, max[i])), Array.from({ length: datos[0].length }, () => -Infinity));

  // Normalizar y guardar datos localmente
  const datosNormalizados = normalizarDatos(datos, minimos, maximos);
  guardarDatosLocal(datosNormalizados);
});
