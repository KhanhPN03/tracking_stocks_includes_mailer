const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stock');
const alertRoutes = require('./routes/alert');
const watchlistRoutes = require('./routes/watchlist');
const newsRoutes = require('./routes/news');
const analyticsRoutes = require('./routes/analytics');

// Import services
const PriceService = require('./services/priceService');
const AlertService = require('./services/alertService');
const EmailService = require('./services/emailService');
const NewsService = require('./services/newsService');
const RateLimitService = require('./services/rateLimitService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vietnam_stock_tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('📝 Note: Install MongoDB or use MongoDB Atlas for full functionality');
    console.log('   For now, some features may be limited without database');
    
    // Don't exit the process, allow server to start with limited functionality
    // process.exit(1);
  }
};

connectDB();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-portfolio', (portfolioId) => {
    socket.join(`portfolio-${portfolioId}`);
    console.log(`User ${socket.id} joined portfolio ${portfolioId}`);
  });

  socket.on('leave-portfolio', (portfolioId) => {
    socket.leave(`portfolio-${portfolioId}`);
    console.log(`User ${socket.id} left portfolio ${portfolioId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
console.log('📍 Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);

try {
  const realtimeRoutes = require('./routes/realtime');
  app.use('/api/realtime', realtimeRoutes);
  console.log('✅ Realtime routes registered');
} catch (error) {
  console.error('❌ Error loading realtime routes:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Vietnam Stock Tracker API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize services
const rateLimitService = new RateLimitService();
const emailService = new EmailService();
const newsService = new NewsService();
const priceService = new PriceService(io);
const alertService = new AlertService(io, emailService);

// Make services accessible to routes
app.set('io', io);
app.set('emailService', emailService);
app.set('newsService', newsService);
app.set('rateLimitService', rateLimitService);

// Start services
priceService.start();
alertService.start();
// newsService.start(); // Disabled for now to prevent validation errors

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Vietnam Stock Tracker API ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Stop services
  priceService.stop();
  alertService.stop();
  newsService.stop();
  await rateLimitService.shutdown();
  
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = app;
