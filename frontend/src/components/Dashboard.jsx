import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import MiniSparkline from './MiniSparkline';
import OrderPanel from './OrderPanel';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star, 
  LogOut, 
  IndianRupee, 
  Activity, 
  CheckCircle2, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Briefcase,
  Plus,
  X
} from 'lucide-react';

export default function Dashboard() {
  const { 
    user, 
    stocks, 
    logout, 
    addToWatchlist, 
    removeFromWatchlist, 
    isAuthenticated 
  } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Custom stock states
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockTicker, setNewStockTicker] = useState('');
  const [newStockName, setNewStockName] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('');
  const [addStockStatus, setAddStockStatus] = useState(null);
  
  // High-frequency price change visual cue tracking states
  const [prevPrices, setPrevPrices] = useState({});
  const [flashStates, setFlashStates] = useState({});

  // 1. Live Price Change Flash Monitor
  useEffect(() => {
    const newFlashes = {};
    let hasChanged = false;

    stocks.forEach(stock => {
      const prevPrice = prevPrices[stock.ticker];
      if (prevPrice !== undefined && prevPrice !== stock.price) {
        newFlashes[stock.ticker] = stock.price > prevPrice ? 'up' : 'down';
        hasChanged = true;
      }
    });

    if (hasChanged) {
      setFlashStates(prev => ({ ...prev, ...newFlashes }));
      setPrevPrices(stocks.reduce((acc, curr) => ({ ...acc, [curr.ticker]: curr.price }), {}));

      // Flash reset after 600ms
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 600);
      return () => clearTimeout(timer);
    } else if (stocks.length > 0 && Object.keys(prevPrices).length === 0) {
      setPrevPrices(stocks.reduce((acc, curr) => ({ ...acc, [curr.ticker]: curr.price }), {}));
      
      // Auto-select first stock for trading panel as default
      const defaultTradeable = stocks.find(s => s.ticker !== 'NIFTY50' && s.ticker !== 'SENSEX');
      if (defaultTradeable) {
        setSelectedStock(defaultTradeable);
      }
    }
  }, [stocks, prevPrices]);

  // Keep selectedStock object in sync with streaming updates
  useEffect(() => {
    if (selectedStock && stocks.length > 0) {
      const live = stocks.find(s => s.ticker === selectedStock.ticker);
      if (live && live.price !== selectedStock.price) {
        setSelectedStock(live);
      }
    }
  }, [stocks, selectedStock]);

  // 2. Portfolio Calculations in High Frequency
  const calculatePortfolioValuation = () => {
    if (!user || !user.portfolio || user.portfolio.length === 0) return { totalValue: 0, totalInvested: 0, pnl: 0, pnlPercent: 0 };
    
    let totalValue = 0;
    let totalInvested = 0;

    user.portfolio.forEach(holding => {
      const liveStock = stocks.find(s => s.ticker === holding.ticker);
      const currentPrice = liveStock ? liveStock.price : holding.avgPrice;
      totalValue += holding.shares * currentPrice;
      totalInvested += holding.shares * holding.avgPrice;
    });

    const pnl = totalValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return {
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercent: parseFloat(pnlPercent.toFixed(2))
    };
  };

  const portfolioStats = calculatePortfolioValuation();
  const netAssets = (user?.balance || 100000) + portfolioStats.totalValue;
  const portfolioPnLIsUp = portfolioStats.pnl >= 0;

  // Split indices and tradeable stocks
  const indexStocks = stocks.filter(s => s.ticker === 'NIFTY50' || s.ticker === 'SENSEX');
  const tradeableStocks = stocks.filter(s => s.ticker !== 'NIFTY50' && s.ticker !== 'SENSEX');

  // Filter list by Watchlist and Search Queries
  const filteredStocks = tradeableStocks.filter(stock => {
    const matchesSearch = 
      stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesWatchlist = !showWatchlistOnly || (user?.watchlist || []).includes(stock.ticker);
    
    return matchesSearch && matchesWatchlist;
  });

  const handleWatchlistToggle = async (e, ticker) => {
    e.stopPropagation(); // Avoid selecting row for trading on clicking star
    const isWatchlisted = (user?.watchlist || []).includes(ticker);
    if (isWatchlisted) {
      await removeFromWatchlist(ticker);
    } else {
      await addToWatchlist(ticker);
    }
  };

  const { addCustomStock } = useSocket();
  const handleAddStock = async (e) => {
    e.preventDefault();
    setAddStockStatus({ loading: true });
    const res = await addCustomStock(newStockTicker, newStockName, newStockPrice);
    if (res.success) {
      setAddStockStatus({ type: 'success', text: res.msg });
      setTimeout(() => {
        setShowAddStockModal(false);
        setNewStockTicker('');
        setNewStockName('');
        setNewStockPrice('');
        setAddStockStatus(null);
      }, 1500);
    } else {
      setAddStockStatus({ type: 'error', text: res.msg });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Header Navigation Bar */}
      <header className="flex justify-between items-center bg-slate-950/60 border border-white/5 px-6 py-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-gradient-to-b from-cyan-500 to-emerald-500" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Activity className="w-5.5 h-5.5 text-slate-950" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase font-sans flex items-center gap-1.5 leading-none">
              BHARAT STOCKS
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-neonGreen font-bold border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <span className="w-1 h-1 rounded-full bg-neonGreen animate-ping" />
                Live Feed
              </span>
            </h1>
            <p className="text-[10px] text-textMuted uppercase font-bold tracking-widest mt-1">NSE & BSE Financial Platform</p>
          </div>
        </div>

        {/* User Card info */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account Active</p>
              <p className="text-xs font-extrabold text-cyan-400">@{user.username}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/5 hidden sm:block" />
            <button
              onClick={logout}
              className="px-3.5 py-2 text-xs font-extrabold text-slate-300 hover:text-neonRed border border-white/5 hover:border-rose-500/20 bg-slate-950/60 rounded-xl flex items-center gap-1.5 transition-all shadow hover:shadow-rose-500/5 select-none"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. Top Indices & Portfolio Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {indexStocks.map(index => {
          const isUp = index.changePercent >= 0;
          return (
            <div key={index.ticker} className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between h-40 relative group overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-[3px] transition-all duration-300 bg-borderGlow group-hover:bg-neonCyan" />
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold uppercase text-slate-300">{index.ticker}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-neonGreen shadow-green-glow' : 'bg-neonRed shadow-red-glow'} animate-pulse`} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold">{index.name}</p>
                </div>
                
                <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded font-extrabold ${
                  isUp ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'bg-rose-950/40 text-rose-400 border border-rose-500/10'
                }`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {isUp ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    ₹{index.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'} mt-0.5`}>
                    {isUp ? '+' : ''}{index.change.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Today
                  </p>
                </div>
                
                <div className="w-28 h-10">
                  <MiniSparkline history={index.history} isPositive={isUp} width={110} height={38} />
                </div>
              </div>
            </div>
          );
        })}

        {/* User Balance card */}
        <div className="bg-gradient-to-br from-[#121626] to-[#0c0d16] rounded-2xl p-5 border border-[#1f253d] flex flex-col justify-between h-40 relative overflow-hidden group">
          {/* Animated glow strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-transparent" />
          <div className="absolute -right-6 -bottom-6 text-white/5 rotate-12 shrink-0 pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-28 h-28 stroke-[1.5]" />
          </div>

          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulated Net Asset Valuation</p>
              <h2 className="text-2xl font-black text-slate-100 mt-1 select-all">₹{netAssets.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            </div>
            {portfolioStats.totalValue > 0 && (
              <span className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded font-extrabold border ${
                portfolioPnLIsUp ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/10' : 'bg-rose-950/40 text-rose-400 border-rose-500/10'
              }`}>
                {portfolioPnLIsUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {portfolioPnLIsUp ? '+' : ''}{portfolioStats.pnlPercent}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 z-10 border-t border-white/5 pt-3.5 text-xs font-semibold">
            <div>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Unrealized profit/loss</p>
              <p className={`font-black ${portfolioPnLIsUp ? 'text-neonGreen' : 'text-neonRed'} mt-0.5`}>
                {portfolioPnLIsUp ? '+' : ''}₹{portfolioStats.pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Available virtual cash</p>
              <p className="text-cyan-400 font-black mt-0.5">
                ₹{user?.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard grid (Markets Watchlist vs Orders & holdings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Live Tickers Watchlist Panel (col-span-2) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl relative">
          
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3.5 mb-5 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/15">
                <IndianRupee className="w-4 h-4 text-neonCyan" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Equity Watchlist (Live)</h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Search Symbol Input */}
              <div className="relative flex-1 sm:w-44">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter stock..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-100 placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Watchlist Star filter toggle */}
              <button
                onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all select-none ${
                  showWatchlistOnly 
                    ? 'bg-yellow-950/40 text-yellow-400 border-yellow-500/20 shadow shadow-yellow-500/5' 
                    : 'bg-slate-950/60 text-slate-400 border-white/5 hover:text-slate-200'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${showWatchlistOnly ? 'fill-yellow-400' : ''}`} />
                <span>Watchlist Only</span>
              </button>

              {/* Add Custom Stock Button */}
              <button
                onClick={() => setShowAddStockModal(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-emerald-950/40 text-emerald-400 border-emerald-500/20 shadow shadow-emerald-500/5 hover:bg-emerald-950/60 transition-all select-none flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stock</span>
              </button>
            </div>
          </div>

          {/* Core Table Grid */}
          <div className="overflow-x-auto w-full border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/5 font-bold uppercase tracking-widest text-[9px] text-slate-400 select-none">
                  <th className="py-3 px-4 text-center w-12">Star</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3 hidden md:table-cell">Company Name</th>
                  <th className="py-3 px-3 text-right">LTP (₹)</th>
                  <th className="py-3 px-3 text-right">Change</th>
                  <th className="py-3 px-3 text-right">Change %</th>
                  <th className="py-3 px-4 text-center w-28">Live Spark</th>
                  <th className="py-3 px-4 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-textMuted font-medium text-xs">
                      No stock listings match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map(stock => {
                    const isUp = stock.changePercent >= 0;
                    const isWatchlisted = (user?.watchlist || []).includes(stock.ticker);
                    const flashState = flashStates[stock.ticker];
                    
                    let flashClass = '';
                    if (flashState === 'up') flashClass = 'animate-tick-up';
                    else if (flashState === 'down') flashClass = 'animate-tick-down';

                    const isSelected = selectedStock?.ticker === stock.ticker;

                    return (
                      <tr 
                        key={stock.ticker} 
                        onClick={() => setSelectedStock(stock)}
                        className={`transition-colors duration-150 hover:bg-white/[0.02] cursor-pointer ${
                          isSelected ? 'bg-white/[0.03]' : ''
                        }`}
                      >
                        {/* 1. Watchlist Star toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleWatchlistToggle(e, stock.ticker)}
                            className="text-slate-500 hover:text-yellow-400 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`} />
                          </button>
                        </td>

                        {/* 2. Symbol */}
                        <td className="py-3.5 px-3 font-bold uppercase tracking-tight text-slate-100">
                          {stock.ticker}
                        </td>

                        {/* 3. Company name */}
                        <td className="py-3.5 px-3 font-semibold text-slate-400 hidden md:table-cell max-w-[150px] truncate">
                          {stock.name}
                        </td>

                        {/* 4. Live price cell with glowing tick cues */}
                        <td className={`py-3.5 px-3 font-black text-right transition-all select-all ${flashClass} text-slate-100`}>
                          ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 5. Change */}
                        <td className={`py-3.5 px-3 font-bold text-right ${isUp ? 'text-emerald-400' : 'text-neonRed'}`}>
                          {isUp ? '+' : ''}{stock.change.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 6. Change % */}
                        <td className="py-3.5 px-3 text-right">
                          <span className={`inline-block font-extrabold px-2 py-0.5 rounded text-[10px] ${
                            isUp ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-neonRed'
                          }`}>
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>

                        {/* 7. Canvas spark graphs */}
                        <td className="py-2.5 px-4">
                          <MiniSparkline history={stock.history} isPositive={isUp} width={90} height={24} />
                        </td>

                        {/* 8. Order panel loader button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid double action
                              setSelectedStock(stock);
                            }}
                            className={`font-extrabold px-3 py-1.5 rounded-lg border text-[10px] select-none transition-all ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow shadow-cyan-500/20'
                                : 'bg-slate-950 border-white/5 hover:border-cyan-500/25 hover:text-cyan-400 text-slate-300'
                            }`}
                          >
                            TRADE
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick tips panel footer */}
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-semibold select-none border-t border-white/5 pt-3.5">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              Click any stock row to open trade order ticket instantly.
            </span>
            <span className="hidden sm:block">Flashes glow soft green/red on real-time price updates.</span>
          </div>
        </div>

        {/* Right Side: Order Slip & Holdings (col-span-1) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Order Terminal */}
          <OrderPanel selectedStock={selectedStock} />

          {/* Portfolio Holdings */}
          <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl relative overflow-hidden select-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 rounded bg-yellow-950/40 border border-yellow-500/20">
                <Briefcase className="w-4 h-4 text-yellow-400" />
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Active Portfolio Holdings</h4>
            </div>

            {(!user?.portfolio || user.portfolio.length === 0) ? (
              <div className="bg-slate-950/40 border border-white/5 rounded-xl py-6 px-4 text-center text-slate-500 text-xs font-semibold">
                💼 Portfolio Empty
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto font-normal">Use virtual starting cash of ₹1,00,000 to buy shares of leading companies!</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {user.portfolio.map(holding => {
                  // Find current live stock price
                  const live = stocks.find(s => s.ticker === holding.ticker);
                  const currentPrice = live ? live.price : holding.avgPrice;
                  
                  const valuation = holding.shares * currentPrice;
                  const totalCost = holding.shares * holding.avgPrice;
                  const pnl = valuation - totalCost;
                  const isUp = pnl >= 0;
                  const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

                  return (
                    <div 
                      key={holding.ticker} 
                      onClick={() => {
                        const targetStock = stocks.find(s => s.ticker === holding.ticker);
                        if (targetStock) setSelectedStock(targetStock);
                      }}
                      className="bg-slate-950/60 hover:bg-slate-900 border border-white/5 rounded-xl p-3.5 transition-colors cursor-pointer relative group flex flex-col justify-between gap-1"
                    >
                      <div className="absolute right-3 top-3.5 flex items-center gap-0.5 text-[10px] font-extrabold">
                        {isUp ? (
                          <span className="text-neonGreen flex items-center">
                            <ArrowUpRight className="w-3 h-3" />
                            +{pnlPercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-neonRed flex items-center">
                            <ArrowDownRight className="w-3 h-3" />
                            {pnlPercent.toFixed(2)}%
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold uppercase text-slate-100 tracking-tight">{holding.ticker}</span>
                          <span className="text-[10px] text-slate-400 font-bold bg-[#171d2b] px-1.5 py-0.5 rounded leading-none">
                            {holding.shares} Qty
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Average Cost: ₹{holding.avgPrice}</p>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-1">
                        <div>
                          <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Market Value</p>
                          <p className="text-xs font-black text-slate-200">₹{valuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Unrealized P&L</p>
                          <p className={`text-xs font-black ${isUp ? 'text-neonGreen' : 'text-neonRed'}`}>
                            {isUp ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Custom Stock Modal overlay */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => { setShowAddStockModal(false); setAddStockStatus(null); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-slate-100 mb-4 uppercase">List New Stock</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ticker Symbol</label>
                <input required type="text" placeholder="e.g. TSLA" maxLength="10" value={newStockTicker} onChange={(e) => setNewStockTicker(e.target.value.toUpperCase())} className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2 px-3 text-sm font-bold text-slate-100 outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Company Name</label>
                <input required type="text" placeholder="e.g. Tesla Inc." maxLength="40" value={newStockName} onChange={(e) => setNewStockName(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2 px-3 text-sm font-bold text-slate-100 outline-none mt-1" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Initial Price (₹)</label>
                <input required type="number" step="0.01" min="1" placeholder="e.g. 15000" value={newStockPrice} onChange={(e) => setNewStockPrice(e.target.value)} className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2 px-3 text-sm font-bold text-slate-100 outline-none mt-1" />
              </div>
              
              {addStockStatus && !addStockStatus.loading && (
                <div className={`p-2.5 rounded-lg text-xs font-bold ${addStockStatus.type === 'success' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950/30 text-rose-400 border border-rose-500/20'}`}>
                  {addStockStatus.text}
                </div>
              )}

              <button disabled={addStockStatus?.loading} type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-neonCyan to-blue-500 text-slate-950 text-xs font-extrabold uppercase shadow-lg hover:shadow-cyan-500/10 transition-all disabled:opacity-50">
                {addStockStatus?.loading ? 'Listing...' : 'List on Exchange'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
