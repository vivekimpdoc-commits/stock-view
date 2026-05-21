// Real-time NSE/BSE Stock Market Simulation Service
// Simulates high-frequency realistic stock prices using a Random Walk with Drift

const initialStocks = [
  { ticker: 'NIFTY50', name: 'Nifty 50 Index', price: 22450.00, open: 22400.00, volume: 154020000 },
  { ticker: 'SENSEX', name: 'BSE Sensex Index', price: 73900.00, open: 73800.00, volume: 98040000 },
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2870.00, open: 2860.00, volume: 4520000 },
  { ticker: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3850.00, open: 3840.00, volume: 2120000 },
  { ticker: 'INFOSYS', name: 'Infosys Ltd.', price: 1420.00, open: 1435.00, volume: 3800000 },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1390.00, open: 1395.00, volume: 6710000 },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1120.00, open: 1115.00, volume: 5430000 }
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

// Simulate one second tick of market movement
const tickSimulation = () => {
  let stockHoldingsChangeSum = 0;
  let stockCount = 0;

  // 1. Simulate individual component stocks first
  stocks.forEach(stock => {
    if (stock.ticker === 'NIFTY50' || stock.ticker === 'SENSEX') return; // Handled separately

    const oldPrice = stock.price;
    
    // Geometric Brownian Motion simplified drift & volatility
    // Drifts slightly upward (0.01% drift) with a standard deviation of ~0.1% volatility
    const drift = 0.0001; 
    const volatility = 0.0015;
    const randomShock = (Math.random() - 0.49) * 2; // -1.0 to +1.0 roughly
    
    const percentageReturn = drift + volatility * randomShock;
    const priceChange = oldPrice * percentageReturn;
    
    let newPrice = oldPrice + priceChange;
    newPrice = parseFloat(newPrice.toFixed(2));
    
    if (newPrice < 1.0) newPrice = 1.0; // Avoid negative prices

    // Keep track of change sum for index correlation
    stockHoldingsChangeSum += percentageReturn;
    stockCount++;

    // Update stock details
    stock.price = newPrice;
    stock.change = parseFloat((newPrice - stock.open).toFixed(2));
    stock.changePercent = parseFloat(((newPrice - stock.open) / stock.open * 100).toFixed(2));
    
    if (newPrice > stock.high) stock.high = newPrice;
    if (newPrice < stock.low) stock.low = newPrice;
    
    // Add realistic random volume addition
    const volumeTraded = Math.floor(Math.random() * 8000) + 200;
    stock.volume += volumeTraded;

    // Track history for visual microsparkline spark graph
    stock.history.push(newPrice);
    if (stock.history.length > 25) {
      stock.history.shift();
    }
  });

  // 2. Correlate indices (NIFTY50 & SENSEX) with stock averages (adds extreme realism!)
  const avgStockChangeFactor = stockHoldingsChangeSum / stockCount;
  
  stocks.forEach(indexStock => {
    if (indexStock.ticker !== 'NIFTY50' && indexStock.ticker !== 'SENSEX') return;

    const oldPrice = indexStock.price;
    // Index moves based on weighted average stock change factor + minor index-specific drift
    const indexSpecificDrift = (Math.random() - 0.48) * 0.0005;
    const indexChangeFactor = avgStockChangeFactor + indexSpecificDrift;
    
    let newPrice = oldPrice * (1 + indexChangeFactor);
    newPrice = parseFloat(newPrice.toFixed(2));

    indexStock.price = newPrice;
    indexStock.change = parseFloat((newPrice - indexStock.open).toFixed(2));
    indexStock.changePercent = parseFloat(((newPrice - indexStock.open) / indexStock.open * 100).toFixed(2));

    if (newPrice > indexStock.high) indexStock.high = newPrice;
    if (newPrice < indexStock.low) indexStock.low = newPrice;

    // Increment volume
    indexStock.volume += Math.floor(Math.random() * 25000) + 5000;

    indexStock.history.push(newPrice);
    if (indexStock.history.length > 25) {
      indexStock.history.shift();
    }
  });
};

// Initialize WebSocket event dispatchers
const initStockSimulator = (io) => {
  // Run simulation tick every 1000ms (1 second)
  setInterval(() => {
    tickSimulation();
    // Broadcast stock updates to all connected subscribers
    io.emit('stock-updates', stocks);
  }, 1000);

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

  const newStock = {
    ticker: uppercaseTicker,
    name: name,
    price: price,
    open: price,
    volume: 0,
    high: price,
    low: price,
    change: 0,
    changePercent: 0,
    history: Array.from({ length: 25 }, (_, i) => price - (24 - i) * (Math.random() - 0.48) * (price * 0.001))
  };

  stocks.push(newStock);
  return newStock;
};

module.exports = {
  initStockSimulator,
  getStocks,
  addNewStock
};
