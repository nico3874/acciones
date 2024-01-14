    const yahooFinance = require('yahoo-finance');
    const { RSI, BollingerBands } = require('technicalindicators');
    const brain = require('brain.js');

    async function obtenerDatosHistoricos(symbol, startDate, endDate) {
    try {
        const datosHistoricos = await yahooFinance.historical({
        symbol: symbol,
        from: startDate,
        to: endDate,
        });
        return datosHistoricos.reverse();
    } catch (error) {
        console.error('Error al obtener datos históricos:', error.message);
        return [];
    }
    }

    function calcularMinMax(datosHistoricos) {
    const valoresCierre = datosHistoricos.map(entry => entry.close);
    const min = Math.min(...valoresCierre);
    const max = Math.max(...valoresCierre);
    return [min, max];
    }

    function normalizarDatos(datos, min, max) {
    return datos.map(valor => (valor - min) / (max - min));
    }

    function desnormalizarResultado(resultado, min, max) {
    return resultado * (max - min) + min;
    }

    function predecirValorCierre(datosHistoricos, fechaPrediccion) {
    const valoresCierre = datosHistoricos.map(entry => entry.close);
    const [min, max] = calcularMinMax(datosHistoricos);

    const conjuntoDatos = datosHistoricos.map(entry => ({
        input: { date: new Date(entry.date).getTime() },
        output: { close: entry.close },
    }));

    const conjuntoDatosNormalizado = conjuntoDatos.map(entry => ({
        input: { date: normalizarDatos([entry.input.date], min, max)[0] },
        output: { close: normalizarDatos([entry.output.close], min, max)[0] },
    }));

    const configuracionRed = {
        inputSize: 1,
        outputSize: 1,
        hiddenLayers: [3],
    };

    const redNeuronal = new brain.NeuralNetwork(configuracionRed);
    redNeuronal.train(conjuntoDatosNormalizado);

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

    function obtenerSenalCompraVenta(datosHistoricos) {
    const cierres = datosHistoricos.map(entry => entry.close);

    const rsi = RSI.calculate({ values: cierres, period: 14 });
    const bollinger = BollingerBands.calculate({ values: cierres, period: 20, stdDev: 2 });

    const ultimaRsi = rsi[rsi.length - 1];
    const ultimaBollinger = bollinger[bollinger.length - 1];

    const senalCompra = ultimaRsi > 70 && ultimaBollinger.upper > cierres[cierres.length - 1];
    const senalVenta = ultimaRsi < 30 && ultimaBollinger.lower < cierres[cierres.length - 1];

    return { senalCompra, senalVenta };
    }

    async function main() {
    const symbol = 'YPFD.BA';
    const startDate = '2023-01-02';
    const endDate = new Date().toISOString().split('T')[0];

    const datosHistoricos = await obtenerDatosHistoricos(symbol, startDate, endDate);

    if (datosHistoricos.length > 0) {
        const fechaPrediccion = '2024-01-10';
        const valorPredicho = predecirValorCierre(datosHistoricos, fechaPrediccion);

        console.log(`La predicción para ${fechaPrediccion} es: ${valorPredicho}`);

        const { senalCompra, senalVenta } = obtenerSenalCompraVenta(datosHistoricos);

        if (senalCompra) {
        console.log('Señal de compra detectada.');
        } else if (senalVenta) {
        console.log('Señal de venta detectada.');
        } else {
        console.log('No hay señales de compra o venta.');
        }
    } else {
        console.log('No se pudieron obtener datos históricos para la acción especificada.');
    }
    }

    main();
