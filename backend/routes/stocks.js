const express = require('express');
const router = express.Router();
const { addNewStock } = require('../services/stockSimulator');

// @route   POST api/stocks/add
// @desc    Add a custom stock to the live market simulator
// @access  Public
router.post('/add', (req, res) => {
  const { ticker, name, price } = req.body;

  if (!ticker || !name || !price) {
    return res.status(400).json({ msg: 'Please provide ticker, name, and initial price' });
  }

  const initialPrice = parseFloat(price);
  if (isNaN(initialPrice) || initialPrice <= 0) {
    return res.status(400).json({ msg: 'Initial price must be a valid positive number' });
  }

  try {
    const newStock = addNewStock(ticker, name, initialPrice);
    res.status(201).json({
      msg: `Successfully added ${newStock.ticker} to the market!`,
      stock: newStock
    });
  } catch (err) {
    console.error('Error adding stock:', err.message);
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;
