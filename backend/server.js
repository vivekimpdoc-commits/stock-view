require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { connectDB } = require('./config/db');
const { initStockSimulator } = require('./services/stockSimulator');

// Initialize Express app and create HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with open CORS for modern developer setups
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure Middleware
app.use(cors());
app.use(express.json());

// Main entry welcome route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'NSE/BSE Indian Stock Market High-Frequency Live Feed Server',
    dbMode: global.dbMode || 'unknown',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/watchlist/add',
      '/api/watchlist/remove',
      '/api/portfolio/trade'
    ]
  });
});

// Bootstrap Database Layer (MongoDB or Local Persistent JSON DB)
const startServer = async () => {
  await connectDB();

  // Bind API Routers
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/watchlist', require('./routes/watchlist'));
  app.use('/api/portfolio', require('./routes/portfolio'));
  app.use('/api/stocks', require('./routes/stocks'));

  // Initialize Real-time Stock Market Simulators & WebSockets
  initStockSimulator(io);

  // Serve static files from the React frontend app
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendDistPath)) {
    console.log(`📁 Serving frontend static assets from: ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));
    
    // Anything that doesn't match API endpoints, serve index.html
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  } else {
    console.log(`⚠️  Frontend build directory not found at: ${frontendDistPath}. Serving API endpoints only.`);
  }

  // Bind Express server listening port
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 ====================================================`);
    console.log(`📈 STOCK MARKET SERVER IS RUNNING LIVE AT: http://localhost:${PORT}`);
    console.log(`📡 REAL-TIME WEBSOCKET EMITTER BROADCASTING FREELY`);
    console.log(`🚀 ====================================================\n`);
  });
};

startServer().catch(err => {
  console.error('Fatal crash booting the stock market server:', err);
});
