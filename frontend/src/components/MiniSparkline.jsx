import React, { useEffect, useRef } from 'react';

export default function MiniSparkline({ history, isPositive, width = 120, height = 36 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support Retina displays / High-DPI screens for crisp lines
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const prices = history;
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const valRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Color Configurations
    const primaryColor = isPositive ? '#00ffaa' : '#ff2a5f';
    const gradientStart = isPositive ? 'rgba(0, 255, 170, 0.15)' : 'rgba(255, 42, 95, 0.15)';
    const gradientEnd = 'rgba(0, 0, 0, 0)';

    // Coordinate converters
    const getX = (index) => (index / (prices.length - 1)) * (width - 4) + 2;
    const getY = (price) => height - 4 - ((price - minVal) / valRange) * (height - 8);

    // 1. Create solid line path
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(prices[0]));

    for (let i = 1; i < prices.length; i++) {
      const xc = (getX(i - 1) + getX(i)) / 2;
      const yc = (getY(prices[i - 1]) + getY(prices[i])) / 2;
      ctx.quadraticCurveTo(getX(i - 1), getY(prices[i - 1]), xc, yc);
    }
    
    // Smooth final link
    ctx.lineTo(getX(prices.length - 1), getY(prices[prices.length - 1]));
    
    // Draw Stroke
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.75;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Keep reference of current path to draw fill
    const path2D = new Path2D();
    path2D.moveTo(getX(0), getY(prices[0]));
    for (let i = 1; i < prices.length; i++) {
      const xc = (getX(i - 1) + getX(i)) / 2;
      const yc = (getY(prices[i - 1]) + getY(prices[i])) / 2;
      path2D.quadraticCurveTo(getX(i - 1), getY(prices[i - 1]), xc, yc);
    }
    path2D.lineTo(getX(prices.length - 1), getY(prices[prices.length - 1]));
    
    ctx.stroke();

    // 2. Draw transparent gradient under trace
    path2D.lineTo(getX(prices.length - 1), height);
    path2D.lineTo(getX(0), height);
    path2D.closePath();

    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, gradientStart);
    fillGradient.addColorStop(1, gradientEnd);

    ctx.fillStyle = fillGradient;
    ctx.fill(path2D);

  }, [history, isPositive, width, height]);

  return (
    <div className="flex items-center justify-center select-none pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}
