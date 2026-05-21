const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/watchlist/add
// @desc    Add a stock ticker to user's personal watchlist
// @access  Private
router.post('/add', auth, async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ msg: 'Stock ticker is required' });
  }

  const uppercaseTicker = ticker.toUpperCase();

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already in watchlist
    if (user.watchlist.includes(uppercaseTicker)) {
      return res.status(400).json({ msg: `${uppercaseTicker} is already in your watchlist` });
    }

    user.watchlist.push(uppercaseTicker);
    await user.save();

    res.json({
      msg: 'Stock added to watchlist',
      watchlist: user.watchlist
    });
  } catch (err) {
    console.error('Error adding stock to watchlist:', err);
    res.status(500).json({ msg: 'Server error adding stock to watchlist' });
  }
});

// @route   POST api/watchlist/remove
// @desc    Remove a stock ticker from user's watchlist
// @access  Private
router.post('/remove', auth, async (req, res) => {
  const { ticker } = req.body;

  if (!ticker) {
    return res.status(400).json({ msg: 'Stock ticker is required' });
  }

  const uppercaseTicker = ticker.toUpperCase();

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Filter out ticker
    user.watchlist = user.watchlist.filter(t => t !== uppercaseTicker);
    await user.save();

    res.json({
      msg: 'Stock removed from watchlist',
      watchlist: user.watchlist
    });
  } catch (err) {
    console.error('Error removing stock from watchlist:', err);
    res.status(500).json({ msg: 'Server error removing stock from watchlist' });
  }
});

module.exports = router;
