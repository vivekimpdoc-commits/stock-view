const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user account
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Simple validation
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields (username, email, password)' });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({ msg: 'An account with this email already exists' });
    }

    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res.status(400).json({ msg: 'Username is already taken' });
    }

    // Create user (hashing is done internally by Mongoose pre-save or JsonUser.create)
    const newUser = await User.create({
      username,
      email,
      password,
      watchlist: [],
      balance: 100000, // ₹1,00,000 Starting virtual trading capital
      portfolio: []
    });

    const token = newUser.generateAuthToken();

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        watchlist: newUser.watchlist,
        balance: newUser.balance,
        portfolio: newUser.portfolio
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error during registration. Please try again.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please provide both email and password' });
  }

  try {
    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid password or credentials' });
    }

    const token = user.generateAuthToken();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        watchlist: user.watchlist,
        balance: user.balance,
        portfolio: user.portfolio
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during authentication. Please try again.' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile (protected)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: 'User profile not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      watchlist: user.watchlist,
      balance: user.balance,
      portfolio: user.portfolio
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ msg: 'Server error fetching user details' });
  }
});

module.exports = router;
