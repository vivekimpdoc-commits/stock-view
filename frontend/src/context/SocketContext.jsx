import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);

const clientInitialStocks = [
  { ticker: 'NIFTY50', name: 'Nifty 50 Index', price: 22450.00, open: 22400.00, high: 22500.00, low: 22380.00, volume: 154020000, change: 50.00, changePercent: 0.22, history: Array.from({ length: 25 }, () => 22450) },
  { ticker: 'SENSEX', name: 'BSE Sensex Index', price: 73900.00, open: 73800.00, high: 74100.00, low: 73700.00, volume: 98040000, change: 100.00, changePercent: 0.14, history: Array.from({ length: 25 }, () => 73900) },
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2870.00, open: 2860.00, high: 2890.00, low: 2855.00, volume: 4520000, change: 10.00, changePercent: 0.35, history: Array.from({ length: 25 }, () => 2870) },
  { ticker: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3850.00, open: 3840.00, high: 3880.00, low: 3830.00, volume: 2120000, change: 10.00, changePercent: 0.26, history: Array.from({ length: 25 }, () => 3850) },
  { ticker: 'INFOSYS', name: 'Infosys Ltd.', price: 1420.00, open: 1435.00, high: 1440.00, low: 1415.00, volume: 3800000, change: -15.00, changePercent: -1.05, history: Array.from({ length: 25 }, () => 1420) },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1390.00, open: 1395.00, high: 1405.00, low: 1385.00, volume: 6710000, change: -5.00, changePercent: -0.36, history: Array.from({ length: 25 }, () => 1390) },
  { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1120.00, open: 1115.00, high: 1130.00, low: 1110.00, volume: 5430000, change: 5.00, changePercent: 0.45, history: Array.from({ length: 25 }, () => 1120) }
];

export const SocketProvider = ({ children }) => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stock_jwt_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Real-time stocks data feed states
  const [stocks, setStocks] = useState(clientInitialStocks);
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Helper to fetch authorization headers
  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || localStorage.getItem('stock_jwt_token')}`
    };
  };

  // 1. Establish real-time WebSocket connection
  useEffect(() => {
    console.log('🔌 Connecting socket to:', BACKEND_URL);
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket backend streaming server');
      setIsSocketConnected(true);
    });

    newSocket.on('stock-updates', (updatedStocks) => {
      setStocks(updatedStocks);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket backend server');
      setIsSocketConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 1b. Client-side price simulation fallback when disconnected
  useEffect(() => {
    if (isSocketConnected) return;

    console.log('📴 Socket disconnected. Starting client-side mock simulation ticks.');

    const interval = setInterval(() => {
      setStocks(prevStocks => {
        let stockHoldingsChangeSum = 0;
        let stockCount = 0;

        // Simulate components
        const updated = prevStocks.map(stock => {
          if (stock.ticker === 'NIFTY50' || stock.ticker === 'SENSEX') return stock;

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

          const high = newPrice > stock.high ? newPrice : stock.high;
          const low = newPrice < stock.low ? newPrice : stock.low;
          const volume = stock.volume + Math.floor(Math.random() * 500) + 50;
          const history = [...stock.history, newPrice].slice(-25);

          return {
            ...stock,
            price: newPrice,
            change: parseFloat((newPrice - stock.open).toFixed(2)),
            changePercent: parseFloat(((newPrice - stock.open) / stock.open * 100).toFixed(2)),
            high,
            low,
            volume,
            history
          };
        });

        // Correlate indices (Nifty50 & Sensex)
        const avgStockChangeFactor = stockHoldingsChangeSum / (stockCount || 1);
        
        return updated.map(stock => {
          if (stock.ticker !== 'NIFTY50' && stock.ticker !== 'SENSEX') return stock;

          const oldPrice = stock.price;
          const indexSpecificDrift = (Math.random() - 0.48) * 0.0005;
          const indexChangeFactor = avgStockChangeFactor + indexSpecificDrift;
          
          let newPrice = oldPrice * (1 + indexChangeFactor);
          newPrice = parseFloat(newPrice.toFixed(2));

          const high = newPrice > stock.high ? newPrice : stock.high;
          const low = newPrice < stock.low ? newPrice : stock.low;
          const volume = stock.volume + Math.floor(Math.random() * 1500) + 200;
          const history = [...stock.history, newPrice].slice(-25);

          return {
            ...stock,
            price: newPrice,
            change: parseFloat((newPrice - stock.open).toFixed(2)),
            changePercent: parseFloat(((newPrice - stock.open) / stock.open * 100).toFixed(2)),
            high,
            low,
            volume,
            history
          };
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isSocketConnected]);

  // 2. Fetch user profile on startup if token is available
  useEffect(() => {
    const bootstrapUser = async () => {
      const storedToken = localStorage.getItem('stock_jwt_token');
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }

      // Offline mode login bypass
      if (storedToken === 'offline_token') {
        const localUser = localStorage.getItem('offline_user');
        if (localUser) {
          setUser(JSON.parse(localUser));
          setIsAuthenticated(true);
        } else {
          const defaultUser = {
            username: 'OfflineTrader',
            email: 'offline@domain.com',
            balance: 100000,
            watchlist: ['RELIANCE', 'TCS'],
            portfolio: []
          };
          localStorage.setItem('offline_user', JSON.stringify(defaultUser));
          setUser(defaultUser);
          setIsAuthenticated(true);
        }
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token expired or invalid
          localStorage.removeItem('stock_jwt_token');
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to bootstrap user profile. Falling back to local offline user.', err);
        const localUser = localStorage.getItem('offline_user');
        if (localUser) {
          setUser(JSON.parse(localUser));
          setIsAuthenticated(true);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapUser();
  }, [token]);

  // 3. Auth Actions: Register user
  const register = async (username, email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('stock_jwt_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setAuthError(data.msg || 'Registration failed');
        return false;
      }
    } catch (err) {
      console.warn('Backend is offline. Registering user locally in simulated mode.');
      const defaultUser = {
        username: username || 'OfflineTrader',
        email: email || 'offline@domain.com',
        balance: 100000,
        watchlist: ['RELIANCE', 'TCS'],
        portfolio: []
      };
      localStorage.setItem('stock_jwt_token', 'offline_token');
      localStorage.setItem('offline_user', JSON.stringify(defaultUser));
      setToken('offline_token');
      setUser(defaultUser);
      setIsAuthenticated(true);
      return true;
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Auth Actions: Login user
  const login = async (email, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('stock_jwt_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setAuthError(data.msg || 'Authentication failed');
        return false;
      }
    } catch (err) {
      console.warn('Backend is offline. Logging in locally in simulated mode.');
      const localUser = localStorage.getItem('offline_user');
      const defaultUser = localUser ? JSON.parse(localUser) : {
        username: 'OfflineTrader',
        email: email || 'offline@domain.com',
        balance: 100000,
        watchlist: ['RELIANCE', 'TCS'],
        portfolio: []
      };
      localStorage.setItem('stock_jwt_token', 'offline_token');
      localStorage.setItem('offline_user', JSON.stringify(defaultUser));
      setToken('offline_token');
      setUser(defaultUser);
      setIsAuthenticated(true);
      return true;
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Auth Actions: Logout user
  const logout = () => {
    localStorage.removeItem('stock_jwt_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  // 6. Profile refresh action
  const refreshProfile = async () => {
    if (!token || token === 'offline_token') return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing profile info:', err);
    }
  };

  // 7. Watchlist Action: Add stock to user's saved list
  const addToWatchlist = async (ticker) => {
    if (!isAuthenticated) return false;
    try {
      if (token === 'offline_token') {
        throw new Error('Offline mode bypass');
      }

      const response = await fetch(`${BACKEND_URL}/api/watchlist/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticker })
      });
      
      const data = await response.json();
      if (response.ok) {
        setUser(prev => ({
          ...prev,
          watchlist: data.watchlist
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Modifying watchlist locally in static mock mode.');
      if (user) {
        const updatedWatchlist = [...(user.watchlist || [])];
        if (!updatedWatchlist.includes(ticker)) {
          updatedWatchlist.push(ticker);
        }
        const updatedUser = { ...user, watchlist: updatedWatchlist };
        setUser(updatedUser);
        localStorage.setItem('offline_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    }
  };

  // 8. Watchlist Action: Remove stock from user's saved list
  const removeFromWatchlist = async (ticker) => {
    if (!isAuthenticated) return false;
    try {
      if (token === 'offline_token') {
        throw new Error('Offline mode bypass');
      }

      const response = await fetch(`${BACKEND_URL}/api/watchlist/remove`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticker })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(prev => ({
          ...prev,
          watchlist: data.watchlist
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Modifying watchlist locally in static mock mode.');
      if (user) {
        const updatedWatchlist = (user.watchlist || []).filter(t => t !== ticker);
        const updatedUser = { ...user, watchlist: updatedWatchlist };
        setUser(updatedUser);
        localStorage.setItem('offline_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    }
  };

  // 9. Paper Trading Action: Buy or sell simulated stock
  const executeTrade = async (ticker, action, shares) => {
    if (!isAuthenticated) return { success: false, msg: 'Please log in to trade stocks.' };
    try {
      if (token === 'offline_token') {
        throw new Error('Offline mode bypass');
      }

      const response = await fetch(`${BACKEND_URL}/api/portfolio/trade`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticker, action, shares })
      });

      const data = await response.json();
      if (response.ok) {
        setUser(prev => ({
          ...prev,
          balance: data.balance,
          portfolio: data.portfolio
        }));
        return { success: true, msg: data.msg };
      } else {
        return { success: false, msg: data.msg };
      }
    } catch (err) {
      console.warn('Executing trading order locally in static mock mode.');
      if (!user) return { success: false, msg: 'No active trading session.' };

      const liveStock = stocks.find(s => s.ticker === ticker);
      if (!liveStock) return { success: false, msg: 'Stock ticker not found.' };

      const price = liveStock.price;
      const cost = price * shares;

      let updatedBalance = user.balance;
      let updatedPortfolio = [...(user.portfolio || [])];

      if (action === 'BUY') {
        if (updatedBalance < cost) {
          return { success: false, msg: `Insufficient virtual cash. Required: ₹${cost.toLocaleString('en-IN')}` };
        }
        updatedBalance -= cost;
        const existing = updatedPortfolio.find(h => h.ticker === ticker);
        if (existing) {
          const totalShares = existing.shares + shares;
          const avgPrice = ((existing.shares * existing.avgPrice) + cost) / totalShares;
          existing.shares = totalShares;
          existing.avgPrice = parseFloat(avgPrice.toFixed(2));
        } else {
          updatedPortfolio.push({
            ticker,
            shares,
            avgPrice: price
          });
        }
      } else if (action === 'SELL') {
        const existing = updatedPortfolio.find(h => h.ticker === ticker);
        if (!existing || existing.shares < shares) {
          return { success: false, msg: `Insufficient shares in portfolio. Owned: ${existing ? existing.shares : 0}` };
        }
        updatedBalance += cost;
        existing.shares -= shares;
        if (existing.shares === 0) {
          updatedPortfolio = updatedPortfolio.filter(h => h.ticker !== ticker);
        }
      }

      const updatedUser = {
        ...user,
        balance: parseFloat(updatedBalance.toFixed(2)),
        portfolio: updatedPortfolio
      };

      setUser(updatedUser);
      localStorage.setItem('offline_user', JSON.stringify(updatedUser));

      return {
        success: true,
        msg: `Successfully ${action === 'BUY' ? 'bought' : 'sold'} ${shares} shares of ${ticker} at ₹${price.toFixed(2)} (Simulated).`
      };
    }
  };

  // 10. Add a new custom stock to the live market
  const addCustomStock = async (ticker, name, price) => {
    try {
      if (token === 'offline_token') {
        throw new Error('Offline mode bypass');
      }

      const response = await fetch(`${BACKEND_URL}/api/stocks/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, name, price })
      });

      const data = await response.json();
      if (response.ok) {
        return { success: true, msg: data.msg };
      } else {
        return { success: false, msg: data.msg };
      }
    } catch (err) {
      console.warn('Adding custom stock locally in static mock mode.');
      const uppercaseTicker = ticker.toUpperCase();
      if (stocks.find(s => s.ticker === uppercaseTicker)) {
        return { success: false, msg: `Stock ticker '${uppercaseTicker}' already exists in the market.` };
      }

      const newStock = {
        ticker: uppercaseTicker,
        name: name || `${uppercaseTicker} Corporation`,
        price: parseFloat(price) || 100,
        open: parseFloat(price) || 100,
        high: parseFloat(price) || 100,
        low: parseFloat(price) || 100,
        volume: 0,
        change: 0,
        changePercent: 0,
        history: Array.from({ length: 25 }, () => parseFloat(price) || 100)
      };

      setStocks(prev => [...prev, newStock]);
      return { success: true, msg: `Successfully added ${uppercaseTicker} to local market listing.` };
    }
  };

  return (
    <SocketContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        authLoading,
        authError,
        stocks,
        socket,
        register,
        login,
        logout,
        addToWatchlist,
        removeFromWatchlist,
        executeTrade,
        refreshProfile,
        addCustomStock
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
