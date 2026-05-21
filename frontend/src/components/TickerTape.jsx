import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TickerTape() {
  const { stocks } = useSocket();
  const [prevPrices, setPrevPrices] = useState({});
  const [flashStates, setFlashStates] = useState({});

  // Monitor stock price changes to trigger micro visual cues
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

      // Reset flash state after 700ms
      const timer = setTimeout(() => {
        setFlashStates({});
      }, 700);
      return () => clearTimeout(timer);
    } else if (stocks.length > 0 && Object.keys(prevPrices).length === 0) {
      // Initialize first prices
      setPrevPrices(stocks.reduce((acc, curr) => ({ ...acc, [curr.ticker]: curr.price }), {}));
    }
  }, [stocks, prevPrices]);

  if (stocks.length === 0) {
    return (
      <div className="w-full bg-slate-950 border-b border-white/5 py-2.5 overflow-hidden text-xs text-textMuted flex items-center justify-center font-medium">
        <span className="animate-pulse">Loading live NSE/BSE stock ticker data feed...</span>
      </div>
    );
  }

  // Duplicate items to ensure a continuous seamless looping marquee
  const marqueeItems = [...stocks, ...stocks, ...stocks];

  return (
    <div className="w-full bg-[#05060b] border-b border-white/5 py-2.5 overflow-hidden text-xs font-semibold relative z-30 select-none">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#05060b] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#05060b] to-transparent z-10 pointer-events-none" />
      
      <div className="flex animate-scroll-marquee whitespace-nowrap gap-8 w-max">
        {marqueeItems.map((stock, index) => {
          const isUp = stock.changePercent >= 0;
          const flash = flashStates[stock.ticker];
          
          let flashClass = '';
          if (flash === 'up') flashClass = 'text-neonGreen shadow-green-glow transition-all duration-150 scale-105';
          else if (flash === 'down') flashClass = 'text-neonRed shadow-red-glow transition-all duration-150 scale-105';

          return (
            <div
              key={`${stock.ticker}-${index}`}
              className={`flex items-center gap-2 px-3 py-1 rounded border border-transparent transition-all duration-300 ${
                flashClass ? flashClass : 'text-slate-200'
              }`}
            >
              <span className="text-slate-400 font-bold uppercase tracking-wider">{stock.ticker}</span>
              <span className="text-slate-100 font-bold">₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              
              <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isUp ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'
              }`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
