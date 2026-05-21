const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Keep track of the active database engine
let dbMode = 'mongodb';
let localDbPath = path.join(__dirname, '..', process.env.LOCAL_DB_FILE || 'db_fallback.json');

const connectDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    // Use a short timeout so that if the user does not have MongoDB running, the application starts immediately
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stock-view', {
      serverSelectionTimeoutMS: 2000,
    });
    dbMode = 'mongodb';
    global.dbMode = 'mongodb';
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    dbMode = 'json';
    global.dbMode = 'json';
    console.log('\n⚠️  MongoDB connection failed or is not running locally.');
    console.log(`🤖 ACTIVATING PERSISTENT MOCK DATABASE FALLBACK:`);
    console.log(`📂 Data will be securely saved to local file: ${localDbPath}`);
    console.log('🟢 You can test, log in, sign up, trade, and save watchlists immediately without any DB setup!\n');
    
    // Initialize the JSON database file if it doesn't exist
    if (!fs.existsSync(localDbPath)) {
      fs.writeFileSync(localDbPath, JSON.stringify({ users: [] }, null, 2));
    }
  }
};

module.exports = {
  connectDB,
  getDbMode: () => dbMode,
  localDbPath
};
