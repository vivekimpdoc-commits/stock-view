// Real-time NSE/BSE Stock Market Simulation Service (with Yahoo Finance Real Data Integration)
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const initialStocks = [
  { ticker: 'NIFTY50', name: 'Nifty 50 Index', yahooSymbol: '^NSEI', price: 22450.00, open: 22400.00, volume: 154020000 },
  { ticker: 'SENSEX', name: 'BSE Sensex Index', yahooSymbol: '^BSESN', price: 73900.00, open: 73800.00, volume: 98040000 },
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', yahooSymbol: 'RELIANCE.NS', price: 2870.00, open: 2860.00, volume: 4520000 },
  { ticker: 'TCS', name: 'Tata Consultancy Services Ltd.', yahooSymbol: 'TCS.NS', price: 3850.00, open: 3840.00, volume: 2120000 },
  { ticker: 'INFOSYS', name: 'Infosys Ltd.', yahooSymbol: 'INFY.NS', price: 1420.00, open: 1435.00, volume: 3800000 },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', yahooSymbol: 'HDFCBANK.NS', price: 1390.00, open: 1395.00, volume: 6710000 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.', yahooSymbol: 'ICICIBANK.NS', price: 1120.00, open: 1115.00, volume: 5430000 }
];

// In-memory stock storage with initial setup
let stocks = initialStocks.map(stock => {
  return {
    ...stock,
    high: stock.price,
    low: stock.price,
    change: stock.price - stock.open,
    changePercent: ((stock.price - stock.open) / stock.open) * 100,
    history: Array.from({ length: 25 }, (_, i) => stock.price - (24 - i) * (Math.random() - 0.48) * (stock.price * 0.001))
  };
});

// Accessor for active stock list
const getStocks = () => stocks;

// Update stock data in-memory from Yahoo Finance
const updateStockDataFromYahoo = async () => {
  try {
    const symbolsToFetch = stocks.map(s => s.yahooSymbol || s.ticker);
    const results = await yahooFinance.quote(symbolsToFetch);
    
    if (!results || results.length === 0) {
      throw new Error('No results returned from Yahoo Finance');
    }

    results.forEach(quote => {
      const stock = stocks.find(s => 
        (s.yahooSymbol && s.yahooSymbol.toUpperCase() === quote.symbol.toUpperCase()) || 
        s.ticker.toUpperCase() === quote.symbol.toUpperCase()
      );
      
      if (stock) {
        const newPrice = quote.regularMarketPrice || stock.price;
        stock.price = parseFloat(newPrice.toFixed(2));
        stock.open = parseFloat((quote.regularMarketPreviousClose || quote.regularMarketOpen || stock.open).toFixed(2));
        stock.high = parseFloat((quote.regularMarketDayHigh || stock.high || newPrice).toFixed(2));
        stock.low = parseFloat((quote.regularMarketDayLow || stock.low || newPrice).toFixed(2));
        stock.volume = quote.regularMarketVolume || stock.volume;
        stock.change = parseFloat((quote.regularMarketChange || (stock.price - stock.open)).toFixed(2));
        stock.changePercent = parseFloat((quote.regularMarketChangePercent || ((stock.price - stock.open) / stock.open * 100)).toFixed(2));
        
        // Track history for sparkline
        stock.history.push(stock.price);
        if (stock.history.length > 25) {
          stock.history.shift();
        }
      }
    });

    console.log(`📈 Successfully fetched and updated ${results.length} stocks from Yahoo Finance at ${new Date().toLocaleTimeString()}`);
    return true;
  } catch (err) {
    console.error('⚠️ Yahoo Finance API fetch failed. Falling back to local simulation tick. Error:', err.message);
    tickSimulation();
    return false;
  }
};

// Simulate one second tick of market movement (Simulation Fallback)
const tickSimulation = () => {
  let stockHoldingsChangeSum = 0;
  let stockCount = 0;

  // 1. Simulate individual component stocks first
  stocks.forEach(stock => {
    if (stock.ticker === 'NIFTY50' || stock.ticker === 'SENSEX') return; // Handled separately

    const oldPrice = stock.price;
    const drift = 0.0001; 
    const volatility = 0.0015;
    const randomShock = (Math.random() - 0.49) * 2;
    
    const percentageReturn = drift + volatility * randomShock;
    const priceChange = oldPrice * percentageReturn;
    
    let newPrice = oldPrice + priceChange;
    newPrice = parseFloat(newPrice.toFixed(2));
    
    if (newPrice < 1.0) newPrice = 1.0;

    stockHoldingsChangeSum += percentageReturn;
    stockCount++;

    // Update stock details
    stock.price = newPrice;
    stock.change = parseFloat((newPrice - stock.open).toFixed(2));
    stock.changePercent = parseFloat(((newPrice - stock.open) / stock.open * 100).toFixed(2));
    
    if (newPrice > stock.high) stock.high = newPrice;
    if (newPrice < stock.low) stock.low = newPrice;
    
    const volumeTraded = Math.floor(Math.random() * 8000) + 200;
    stock.volume += volumeTraded;

    // Track history for sparkline
    stock.history.push(newPrice);
    if (stock.history.length > 25) {
      stock.history.shift();
    }
  });

  // 2. Correlate indices (NIFTY50 & SENSEX)
  const avgStockChangeFactor = stockHoldingsChangeSum / stockCount;
  
  stocks.forEach(indexStock => {
    if (indexStock.ticker !== 'NIFTY50' && indexStock.ticker !== 'SENSEX') return;

    const oldPrice = indexStock.price;
    const indexSpecificDrift = (Math.random() - 0.48) * 0.0005;
    const indexChangeFactor = avgStockChangeFactor + indexSpecificDrift;
    
    let newPrice = oldPrice * (1 + indexChangeFactor);
    newPrice = parseFloat(newPrice.toFixed(2));

    indexStock.price = newPrice;
    indexStock.change = parseFloat((newPrice - indexStock.open).toFixed(2));
    indexStock.changePercent = parseFloat(((newPrice - indexStock.open) / indexStock.open * 100).toFixed(2));

    if (newPrice > indexStock.high) indexStock.high = newPrice;
    if (newPrice < indexStock.low) indexStock.low = newPrice;
    indexStock.volume += Math.floor(Math.random() * 25000) + 5000;

    indexStock.history.push(newPrice);
    if (indexStock.history.length > 25) {
      indexStock.history.shift();
    }
  });
};

// Initialize WebSocket event dispatchers
const initStockSimulator = (io) => {
  // Do initial fetch immediately
  updateStockDataFromYahoo().then(() => {
    io.emit('stock-updates', stocks);
  });

  // Run update every 5000ms (5 seconds)
  setInterval(async () => {
    await updateStockDataFromYahoo();
    io.emit('stock-updates', stocks);
  }, 5000);

  // Set up connection event
  io.on('connection', (socket) => {
    console.log(`📡 New WebSocket connection established (ID: ${socket.id})`);
    
    // Instantly transmit latest snapshot upon joining
    socket.emit('stock-updates', stocks);

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket client disconnected (ID: ${socket.id})`);
    });
  });
};

// Add new dynamic custom stock
const addNewStock = (ticker, name, price) => {
  const uppercaseTicker = ticker.toUpperCase();
  
  // Check if it already exists
  if (stocks.find(s => s.ticker === uppercaseTicker)) {
    throw new Error(`Stock ticker '${uppercaseTicker}' already exists in the market.`);
  }

  // Deduce Yahoo symbol:
  // Default to NSE symbol (.NS) unless it's a known US symbol or already has a dot
  let yahooSymbol = uppercaseTicker;
  if (!yahooSymbol.includes('.') && !yahooSymbol.startsWith('^')) {
    const usTickers = ['AAPL', 'TSLA', 'MSFT', 'GOOG', 'AMZN', 'NFLX', 'NVDA', 'META', 'BTC-USD', 'ETH-USD'];
    if (!usTickers.includes(uppercaseTicker)) {
      yahooSymbol = `${uppercaseTicker}.NS`;
    }
  }

  const newStock = {
    ticker: uppercaseTicker,
    name: name,
    yahooSymbol: yahooSymbol,
    price: price,
    open: price,
    volume: 0,
    high: price,
    low: price,
    change: 0,
    changePercent: 0,
    history: Array.from({ length: 25 }, () => price)
  };

  stocks.push(newStock);

  // Trigger an immediate Yahoo Finance update for the new symbol
  updateStockDataFromYahoo();

  return newStock;
};

module.exports = {
  initStockSimulator,
  getStocks,
  addNewStock
};
