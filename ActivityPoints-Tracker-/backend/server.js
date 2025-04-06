const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const certificatesDir = path.join(uploadsDir, 'certificates');
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
  console.log('Created uploads/certificates directory at:', certificatesDir);
}

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set static folder for uploads with detailed logging
app.use('/uploads', (req, res, next) => {
  // Remove any absolute path components for security
  const sanitizedUrl = req.url.split(/[\\/]/).pop();
  const filePath = path.join(__dirname, 'uploads', req.url);
  
  console.log('Request URL:', req.url);
  console.log('Sanitized URL:', sanitizedUrl);
  console.log('Attempting to serve file from:', filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log('File exists at path');
    next();
  } else {
    console.log('File not found at path');
    // Try alternative path with certificates subdirectory
    const altPath = path.join(__dirname, 'uploads', 'certificates', sanitizedUrl);
    console.log('Trying alternative path:', altPath);
    
    if (fs.existsSync(altPath)) {
      console.log('File found at alternative path');
      res.sendFile(altPath);
    } else {
      res.status(404).json({
        success: false,
        message: 'Certificate file not found',
        requestedPath: filePath,
        altPath: altPath
      });
    }
  }
}, express.static(path.join(__dirname, 'uploads')));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route
app.get('/', (req, res) => {
  res.send('Activity Points Tracker Backend is running...');
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
