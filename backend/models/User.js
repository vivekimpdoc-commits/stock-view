const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { localDbPath } = require('../config/db');

// --- MONGOOSE MONGO DB DEFINITIONS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  watchlist: { type: [String], default: [] },
  balance: { type: Number, default: 100000 }, // Virtual INR cash balance for mock trading
  portfolio: [{
    ticker: { type: String, required: true },
    shares: { type: Number, required: true },
    avgPrice: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password for Mongoose
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper for Mongoose
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token helper for Mongoose
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.JWT_SECRET || 'nse_bse_financial_secret_token_key_987654321',
    { expiresIn: '7d' }
  );
};

const MongoUser = mongoose.model('User', UserSchema);


// --- JSON PERSISTENT FALLBACK DB DEFINITIONS ---
class JsonUser {
  constructor(data) {
    this._id = data._id || Math.random().toString(36).substring(2, 11);
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.watchlist = data.watchlist || [];
    this.balance = data.balance !== undefined ? data.balance : 100000;
    this.portfolio = data.portfolio || [];
    this.createdAt = data.createdAt || new Date();
  }

  // Load database content
  static _readDb() {
    try {
      if (!fs.existsSync(localDbPath)) {
        fs.writeFileSync(localDbPath, JSON.stringify({ users: [] }, null, 2));
      }
      const raw = fs.readFileSync(localDbPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading JSON fallback database', e);
      return { users: [] };
    }
  }

  // Save database content
  static _writeDb(data) {
    try {
      fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error writing to JSON fallback database', e);
    }
  }

  // Find a user by single criteria (e.g. email, username, or id)
  static async findOne(query) {
    const db = this._readDb();
    let userRecord = null;
    
    if (query.email) {
      userRecord = db.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
    } else if (query.username) {
      userRecord = db.users.find(u => u.username.toLowerCase() === query.username.toLowerCase());
    } else if (query._id) {
      userRecord = db.users.find(u => u._id === query._id);
    }

    if (!userRecord) return null;
    return new JsonUser(userRecord);
  }

  // Find a user by ID
  static async findById(id) {
    return this.findOne({ _id: id });
  }

  // Create and save new user
  static async create(data) {
    const db = this._readDb();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = new JsonUser({
      ...data,
      password: hashedPassword
    });

    db.users.push({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      watchlist: newUser.watchlist,
      balance: newUser.balance,
      portfolio: newUser.portfolio,
      createdAt: newUser.createdAt
    });

    this._writeDb(db);
    return newUser;
  }

  // Save current instance changes back to file
  async save() {
    const db = JsonUser._readDb();
    const index = db.users.findIndex(u => u._id === this._id);
    
    const serialized = {
      _id: this._id,
      username: this.username,
      email: this.email,
      password: this.password,
      watchlist: this.watchlist,
      balance: this.balance,
      portfolio: this.portfolio,
      createdAt: this.createdAt
    };

    if (index !== -1) {
      db.users[index] = serialized;
    } else {
      db.users.push(serialized);
    }

    JsonUser._writeDb(db);
    return this;
  }

  // Compare candidate password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Generate JWT token
  generateAuthToken() {
    return jwt.sign(
      { _id: this._id, email: this.email, username: this.username },
      process.env.JWT_SECRET || 'nse_bse_financial_secret_token_key_987654321',
      { expiresIn: '7d' }
    );
  }
}


// --- HYBRID INTERFACE MODEL ADAPTER ---
// This acts as a gateway proxy returning the right model based on global.dbMode
module.exports = {
  get User() {
    return global.dbMode === 'mongodb' ? MongoUser : JsonUser;
  }
};
