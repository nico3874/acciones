const yahooFinance = require('yahoo-finance');

// Función para obtener la lista de símbolos del panel Merval
async function obtenerSimbolosMerval() {
  try {
    const panelMerval = await yahooFinance.quote('^MERV');
    const simbolos = panelMerval.components.map(componente => componente.symbol);
    return simbolos;
  } catch (error) {
    console.error('Error al obtener símbolos del panel Merval:', error.message);
    return [];
  }
}

// Ejemplo de uso
async function main() {
  const simbolosMerval = await obtenerSimbolosMerval();
  console.log('Símbolos del panel Merval:', simbolosMerval);
}

main();


const acciones = ['ALUA.BA', 'BBAR.BA', 'BMA.BA', 'BYMA.BA', 'CEPU.BA', 'COME,BA', 'CRES.BA', 'CVH.BA', 'EDN.BA', 'GGAL.BA', 'HARG.BA', 'LOMA.BA', 'MIRG.BA', 'PAMP.BA', 'SUPV.BA', 'TECO2.BA', 'TGNO4.BA', 'TGSU2.BA', 'TRAN.BA', 'TXAR.BA', 'VALO.BA', 'YPFD.BA']