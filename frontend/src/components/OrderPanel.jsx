import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { DollarSign, Wallet, ShieldAlert, Award, X } from 'lucide-react';

export default function OrderPanel({ selectedStock, onClose }) {
  const { user, executeTrade } = useSocket();
  const [action, setAction] = useState('BUY');
  const [shares, setShares] = useState('5');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Clear feedback status when the user switches selected stocks
  useEffect(() => {
    setStatus(null);
  }, [selectedStock]);

  if (!selectedStock) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/5 h-full flex flex-col justify-center items-center text-center select-none text-textMuted text-sm">
        <DollarSign className="w-10 h-10 stroke-[1.5] text-slate-600 mb-3 animate-bounce" />
        <p className="font-semibold text-slate-400">Select a Stock Symbol</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Click any row or order button in the list to open the trading panel.</p>
      </div>
    );
  }

  // Fetch current holdings of selected stock
  const holding = user?.portfolio?.find(h => h.ticker === selectedStock.ticker);
  const currentShares = holding ? holding.shares : 0;
  const averagePrice = holding ? holding.avgPrice : 0;

  const shareCount = parseInt(shares || '0');
  const estimatedCost = parseFloat((selectedStock.price * shareCount).toFixed(2));
  
  // Balance checking validations
  const hasSufficientCash = user?.balance >= estimatedCost;
  const hasSufficientShares = currentShares >= shareCount;
  const isInputValid = shareCount > 0;

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    if (!isInputValid) return;
    
    if (action === 'BUY' && !hasSufficientCash) {
      setStatus({ text: 'Insufficient virtual cash to fulfill this buy order.', type: 'error' });
      return;
    }

    if (action === 'SELL' && !hasSufficientShares) {
      setStatus({ text: 'Insufficient share quantity inside portfolio holdings.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus(null);

    const res = await executeTrade(selectedStock.ticker, action, shareCount);
    
    setLoading(false);
    if (res.success) {
      setStatus({ text: res.msg, type: 'success' });
      setShares('5'); // Reset quantity
    } else {
      setStatus({ text: res.msg, type: 'error' });
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Light glow strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-300 ${
        action === 'BUY' ? 'bg-neonGreen' : 'bg-neonRed'
      }`} />

      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${action === 'BUY' ? 'bg-neonGreen shadow-green-glow' : 'bg-neonRed shadow-red-glow'} animate-pulse`} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Order Terminal</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected Stock Overview */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-white/5 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Ticker Instrument</p>
              <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight">{selectedStock.ticker}</h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Current Market Price</p>
              <p className="text-lg font-black text-slate-100">₹{selectedStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Action Toggle Tab */}
        <div className="grid grid-cols-2 bg-slate-950/60 p-1 rounded-lg border border-white/5 mb-4">
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded transition-all ${
              action === 'BUY' 
                ? 'bg-emerald-950/60 text-neonGreen border border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setAction('BUY'); setStatus(null); }}
          >
            BUY SHARES
          </button>
          <button
            type="button"
            className={`py-2 text-xs font-bold rounded transition-all ${
              action === 'SELL' 
                ? 'bg-rose-950/60 text-neonRed border border-rose-500/20 shadow-lg shadow-rose-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={() => { setAction('SELL'); setStatus(null); }}
          >
            SELL SHARES
          </button>
        </div>

        {/* Current Position / Cash Balance Info */}
        <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
          <div className="bg-slate-950/30 border border-white/5 p-2 rounded-lg flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-slate-500 uppercase font-semibold">Virtual Cash</p>
              <p className="text-slate-200 font-bold">₹{user?.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-slate-950/30 border border-white/5 p-2 rounded-lg flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-slate-500 uppercase font-semibold">Your Holdings</p>
              <p className="text-slate-200 font-bold">
                {currentShares} Qty {currentShares > 0 && <span className="text-[9px] text-slate-400">(avg: ₹{averagePrice})</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleExecuteTrade} className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <label>Quantity</label>
              {action === 'SELL' && <span className="text-rose-400">Max sellable: {currentShares} shares</span>}
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="e.g. 5"
              className="w-full bg-slate-950/60 border border-white/5 focus:border-neonCyan rounded-lg py-2 px-3 text-sm font-bold text-slate-100 outline-none transition-all"
            />
          </div>

          {/* Pricing breakdown summary */}
          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/5 space-y-1.5 text-xs text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>Order Value:</span>
              <span className="text-slate-200 font-semibold">₹{estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5 font-bold">
              <span className="text-slate-300">Brokerage (Virtual):</span>
              <span className="text-neonGreen">₹0.00 FREE</span>
            </div>
          </div>

          {/* Error notifications */}
          {action === 'BUY' && !hasSufficientCash && isInputValid && (
            <div className="flex gap-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/20 text-[10px] text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-neonRed" />
              <span>Insufficient cash balance. Requires an additional ₹{(estimatedCost - user.balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}.</span>
            </div>
          )}

          {action === 'SELL' && !hasSufficientShares && isInputValid && (
            <div className="flex gap-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/20 text-[10px] text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-neonRed" />
              <span>You do not hold {shareCount} shares. You only own {currentShares} shares.</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              loading || 
              !isInputValid || 
              (action === 'BUY' && !hasSufficientCash) || 
              (action === 'SELL' && !hasSufficientShares)
            }
            className={`w-full py-3 rounded-xl text-slate-950 text-xs font-extrabold shadow-lg uppercase transition-all select-none duration-150 active:scale-[0.98] disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2 ${
              action === 'BUY' 
                ? 'bg-gradient-to-r from-neonGreen to-emerald-400 hover:shadow-emerald-500/10' 
                : 'bg-gradient-to-r from-neonRed to-pink-500 hover:shadow-rose-500/10'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              `TRANSMIT ${action} ORDER`
            )}
          </button>
        </form>
      </div>

      {/* Transaction status notifications */}
      {status && (
        <div className={`mt-4 p-3 rounded-lg border text-xs leading-relaxed animate-fade-in ${
          status.type === 'success' 
            ? 'bg-emerald-950/30 border-emerald-500/35 text-emerald-300' 
            : 'bg-rose-950/30 border-rose-500/35 text-rose-300'
        }`}>
          <p className="font-bold mb-0.5">{status.type === 'success' ? '⚡ Order Executed Successfully' : '⚠️ Order Transmission Failed'}</p>
          <p>{status.text}</p>
        </div>
      )}
    </div>
  );
}
