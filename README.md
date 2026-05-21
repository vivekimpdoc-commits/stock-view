# Bharat Stocks (NSE/BSE Live Trade Terminal)

A high-performance, real-time Indian Stock Market Web Application (NSE/BSE) utilizing React.js, Tailwind CSS, Node.js + Express, and WebSockets (Socket.io). Features secure JWT authentication, real-time price updates with dynamic visual ticks, sparkline charts, personal watchlists, and virtual cash paper trading.

---

## Key Features

1. **High-Frequency Websocket Streams**: Feeds correlated real-time market data (RELIANCE, TCS, NIFTY50, SENSEX, etc.) at 1-second intervals.
2. **Visual Ticks & Sparklines**: Cells and rows pulse emerald green/rose red on ticks and fade instantly. Features beautiful canvas bezier sparkline charts.
3. **Paper Trading Exchange**: Authenticated accounts start with ₹1,00,000 in virtual cash. Buy and sell shares at actual live stock prices, tracking weighted cost averages and ROI.
4. **Hybrid Database Layer**: Seamlessly connects to MongoDB if available, otherwise automatically falls back to an elegant local JSON file storage (`db_fallback.json`) for immediate zero-config execution.

---

## 📂 Project Directory Structure

```
stock-view/
├── backend/
│   ├── config/db.js            # Dual MongoDB / JSON Fallback Connection
│   ├── middleware/auth.js      # JWT token authentication validator
│   ├── models/User.js          # Hybrid Model (Mongoose schema / Custom File DB Adapter)
│   ├── routes/
│   │   ├── auth.js             # Register, Login, Current Profile APIs
│   │   ├── watchlist.js        # Persisted user watchlist additions
│   │   └── portfolio.js        # Paper Trading BUY & SELL executions
│   ├── services/
│   │   └── stockSimulator.js   # GBM random walk high-frequency simulation
│   ├── .env                    # Environment keys (Ports, Secrets)
│   ├── package.json            # Backend dependency map
│   └── server.js               # Entry point, HTTP and Socket.io binding
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── AuthForm.jsx    # Glass credentials sliding card
    │   │   ├── Dashboard.jsx   # Live Cockpit dashboard & Price Flash Table
    │   │   ├── MiniSparkline.jsx# HTML5 Canvas line/area charting engine
    │   │   ├── OrderPanel.jsx  # Paper trade execution slip with validations
    │   │   └── TickerTape.jsx  # Continuous sliding top index ribbon
    │   ├── context/
    │   │   └── SocketContext.jsx# Core Auth hooks & Websocket dispatch listeners
    │   ├── App.jsx             # Render router directing views
    │   ├── index.css           # Styling directives and tick keyframes
    │   └── main.jsx            # DOM Mount anchor
    ├── tailwind.config.js      # Tailwind UI tokens
    └── package.json            # Frontend dependency map
```

---

## ⚡ Quick Start Guide (Zero-Configuration Fallback)

### Step 1: Install Dependencies
Run `npm install` inside both directories:

```bash
# Install Backend packages
cd backend
npm install

# Install Frontend packages
cd ../frontend
npm install
```

### Step 2: Set Environment Config (Optional)
The backend is preset with standard credentials inside `backend/.env`. You may customize port bindings or secure keys there:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stock-view
JWT_SECRET=nse_bse_financial_secret_token_key_987654321
```

### Step 3: Run the Services

You must launch both the backend (API & Feed) and frontend (React Server):

#### 1. Start the Backend Server:
```bash
cd backend
npm run dev
# Or 'npm start'
```
*Note: If MongoDB is not running locally, the server logs a warning and automatically instantiates the JSON persistent database in `backend/db_fallback.json`.*

#### 2. Start the Frontend React Client:
```bash
cd frontend
npm run dev
```

### Step 4: Open Browser
Navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Interactive Testing & Operations

1. **Authentication**: Register an investor account (e.g. `trader1`). You start with ₹1,00,000 in virtual cash.
2. **Watchlists**: Click the **Star** icon next to key equities (e.g., RELIANCE, INFOSYS). Click the **Watchlist Only** toggle at the top right to filter the view to just your starred assets.
3. **Paper Trading**: 
   - Click the **TRADE** button on any equity row.
   - The Order Terminal on the right updates instantly to show your current virtual cash balance and stock holdings.
   - Enter your desired share volume (e.g. `10` shares) and hit **Transmit Buy Order**.
   - Your virtual cash balance decreases, the holding appears in your Active Portfolio card below, and your net ROI fluctuates in high-frequency as the live stock ticker changes!
   - Try selling shares using **Transmit Sell Order** to realize your simulated profits.
