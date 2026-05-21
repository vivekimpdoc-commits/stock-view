const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const auth = require('../middleware/auth');
const { getStocks } = require('../services/stockSimulator');

// @route   POST api/portfolio/trade
// @desc    Execute a virtual buy or sell order for paper trading
// @access  Private
router.post('/trade', auth, async (req, res) => {
  const { ticker, action, shares } = req.body;

  // Basic validation
  if (!ticker || !action || !shares) {
    return res.status(400).json({ msg: 'Missing order criteria: ticker, action (BUY/SELL), and shares quantity are required' });
  }

  const shareQty = parseInt(shares);
  if (isNaN(shareQty) || shareQty <= 0) {
    return res.status(400).json({ msg: 'Quantity must be a positive integer' });
  }

  const uppercaseAction = action.toUpperCase();
  if (uppercaseAction !== 'BUY' && uppercaseAction !== 'SELL') {
    return res.status(400).json({ msg: "Action must be either 'BUY' or 'SELL'" });
  }

  const uppercaseTicker = ticker.toUpperCase();

  try {
    // 1. Fetch current price from real-time stock simulator
    const activeStocks = getStocks();
    const liveStock = activeStocks.find(s => s.ticker === uppercaseTicker);

    if (!liveStock) {
      return res.status(400).json({ msg: `Stock ticker '${uppercaseTicker}' is not actively traded on our exchange` });
    }

    const currentPrice = liveStock.price;
    const totalOrderCost = parseFloat((currentPrice * shareQty).toFixed(2));

    // 2. Fetch User database document
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User profile not found' });
    }

    // Initialize portfolio array if empty/undefined
    if (!user.portfolio) {
      user.portfolio = [];
    }

    const existingHoldingIndex = user.portfolio.findIndex(h => h.ticker === uppercaseTicker);

    if (uppercaseAction === 'BUY') {
      // Check if user has enough virtual cash
      if (user.balance < totalOrderCost) {
        return res.status(400).json({ 
          msg: `Insufficient virtual cash. Order costs ₹${totalOrderCost.toLocaleString('en-IN')}, but your balance is ₹${user.balance.toLocaleString('en-IN')}` 
        });
      }

      // Process purchase
      user.balance = parseFloat((user.balance - totalOrderCost).toFixed(2));

      if (existingHoldingIndex !== -1) {
        // Recalculate average price (cost averaging)
        const holding = user.portfolio[existingHoldingIndex];
        const oldTotalCost = holding.shares * holding.avgPrice;
        const newTotalCost = oldTotalCost + totalOrderCost;
        holding.shares += shareQty;
        holding.avgPrice = parseFloat((newTotalCost / holding.shares).toFixed(2));
      } else {
        // Add new holding
        user.portfolio.push({
          ticker: uppercaseTicker,
          shares: shareQty,
          avgPrice: currentPrice
        });
      }
    } else {
      // Process Sell order
      if (existingHoldingIndex === -1) {
        return res.status(400).json({ msg: `You do not hold any shares of ${uppercaseTicker} in your portfolio` });
      }

      const holding = user.portfolio[existingHoldingIndex];
      if (holding.shares < shareQty) {
        return res.status(400).json({ msg: `Insufficient shares. You requested to sell ${shareQty} shares, but only hold ${holding.shares} shares of ${uppercaseTicker}` });
      }

      // Complete sell transaction
      user.balance = parseFloat((user.balance + totalOrderCost).toFixed(2));
      holding.shares -= shareQty;

      // Clean up holding if fully sold out
      if (holding.shares === 0) {
        user.portfolio.splice(existingHoldingIndex, 1);
      }
    }

    // Save changes
    await user.save();

    res.json({
      msg: `Successfully ${uppercaseAction === 'BUY' ? 'purchased' : 'sold'} ${shareQty} shares of ${uppercaseTicker} at ₹${currentPrice.toLocaleString('en-IN')}`,
      balance: user.balance,
      portfolio: user.portfolio
    });

  } catch (err) {
    console.error('Trading transaction error:', err);
    res.status(500).json({ msg: 'Server error processing stock transaction. Please try again.' });
  }
});

module.exports = router;
