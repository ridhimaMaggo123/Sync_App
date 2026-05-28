require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const isDatabaseConnected = await connectDB();

  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'sync_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  };

  if (isDatabaseConnected) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60,
    });
  } else {
    console.warn('⚠️ Using in-memory sessions because MongoDB is not connected.');
  }

  app.use(session(sessionConfig));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/analyze', require('./routes/analyze'));
  app.use('/api/exercise', require('./routes/exercise'));
  app.use('/api/cycle', require('./routes/cycle'));
  app.use('/api/report', require('./routes/report'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/preferences', require('./routes/preferences'));
  app.use('/api/activity', require('./routes/activity'));
  app.use('/api/progress', require('./routes/progress'));
  app.use('/api/calendar', require('./routes/calendar'));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Sync Health App Backend is running',
      timestamp: new Date().toISOString()
    });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  });

  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    console.log(`🗄️  Database: ${isDatabaseConnected ? 'MongoDB Atlas (Connected)' : 'MongoDB Atlas (Disconnected)'}`);
    console.log(`🔐 Session Secret: ${process.env.SESSION_SECRET ? 'Configured' : 'Using default'}`);
  });
};

startServer();
