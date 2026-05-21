import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('stock_jwt_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Real-time stocks data feed states
  const [stocks, setStocks] = useState([]);
  const [socket, setSocket] = useState(null);

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
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket backend streaming server');
    });

    newSocket.on('stock-updates', (updatedStocks) => {
      setStocks(updatedStocks);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket backend server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Fetch user profile on startup if token is available
  useEffect(() => {
    const bootstrapUser = async () => {
      const storedToken = localStorage.getItem('stock_jwt_token');
      if (!storedToken) {
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
        console.error('Failed to bootstrap user profile:', err);
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
      setAuthError('Server is currently offline. Please start the backend.');
      return false;
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
      setAuthError('Connection failed. Verify your backend server is active.');
      return false;
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
    if (!token) return;
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
      console.error('Watchlist add failed:', err);
      return false;
    }
  };

  // 8. Watchlist Action: Remove stock from user's saved list
  const removeFromWatchlist = async (ticker) => {
    if (!isAuthenticated) return false;
    try {
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
      console.error('Watchlist remove failed:', err);
      return false;
    }
  };

  // 9. Paper Trading Action: Buy or sell simulated stock
  const executeTrade = async (ticker, action, shares) => {
    if (!isAuthenticated) return { success: false, msg: 'Please log in to trade stocks.' };
    try {
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
      console.error('Paper trading execution error:', err);
      return { success: false, msg: 'Network failure communicating with trading exchange server.' };
    }
  };

  // 10. Add a new custom stock to the live market
  const addCustomStock = async (ticker, name, price) => {
    try {
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
      console.error('Add custom stock error:', err);
      return { success: false, msg: 'Network failure adding stock.' };
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
