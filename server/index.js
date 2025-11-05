const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Trust proxy for accurate client IPs when behind a proxy or dev tools
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with fallback (handles SRV DNS failures)
async function connectMongo() {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_ALT_URI || 'mongodb://127.0.0.1:27017/acsoguard';

  const connect = async (uri, label) => {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB connected successfully (${label})`);
      return true;
    } catch (err) {
      console.error(`MongoDB connection error (${label}):`, err);
      return false;
    }
  };

  // Try primary first
  const primaryOk = await connect(primaryUri || fallbackUri, primaryUri ? 'primary' : 'fallback-default');
  if (primaryOk) return;

  // If SRV DNS failure or any error on primary and a distinct fallback URI exists, try fallback
  if (primaryUri && fallbackUri && primaryUri !== fallbackUri) {
    console.log('Attempting fallback MongoDB connection...');
    const fallbackOk = await connect(fallbackUri, 'fallback');
    if (fallbackOk) return;
  }

  console.error('Failed to connect to MongoDB using both primary and fallback URIs.');
}

connectMongo();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join site-specific room
  socket.on('join_site', (siteId) => {
    socket.join(`site_${siteId}`);
    console.log(`Client ${socket.id} joined site ${siteId}`);
  });
  // Auto-join site room if provided via auth
  const { siteId } = socket.handshake.auth || {};
  if (siteId) {
    socket.join(`site_${siteId}`);
    console.log(`Client ${socket.id} auto-joined site ${siteId}`);
  }

  // Leave site-specific room
  socket.on('leave_site', (siteId) => {
    socket.leave(`site_${siteId}`);
    console.log(`Client ${socket.id} left site ${siteId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/access-points', require('./routes/accessPoints'));
app.use('/api/subscriptions', require('./routes/subscription'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/preregistration', require('./routes/preRegistration'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/terms-and-waivers', require('./routes/termsAndWaivers'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  
  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes (only if not in production or if it's an API route)
if (process.env.NODE_ENV !== 'production') {
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
