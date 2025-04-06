const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Check if MONGO_URI is defined
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in the .env file');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
console.log(`Connection string: ${process.env.MONGO_URI}`);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Get database information
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Failed to get database reference');
      process.exit(1);
    }
    
    const dbName = db.databaseName || 'unknown';
    console.log(`Connected to database: ${dbName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Load models dynamically to avoid issues if they don't exist
    let User, Activity;
    try {
      const userModelPath = path.join(__dirname, '../models/User.js');
      const activityModelPath = path.join(__dirname, '../models/Activity.js');
      
      if (fs.existsSync(userModelPath)) {
        User = require('../models/User');
        
        // Count users
        const userCount = await User.countDocuments();
        console.log(`\nTotal users: ${userCount}`);
        
        if (userCount > 0) {
          // Get user roles count
          const userRoles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ]);
          
          console.log('Users by role:');
          userRoles.forEach(role => {
            console.log(`- ${role._id}: ${role.count}`);
          });
          
          // List some users
          const users = await User.find().limit(5).select('-password');
          console.log('\nSample users:');
          users.forEach(user => {
            console.log(`- ${user.name} (${user.email}): ${user.role}`);
          });
        }
      } else {
        console.log('\nUser model not found');
      }
      
      if (fs.existsSync(activityModelPath)) {
        Activity = require('../models/Activity');
        
        // Count activities
        const activityCount = await Activity.countDocuments();
        console.log(`\nTotal activities: ${activityCount}`);
        
        if (activityCount > 0) {
          // Get activity status count
          const activityStatus = await Activity.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ]);
          
          console.log('Activities by status:');
          activityStatus.forEach(status => {
            console.log(`- ${status._id}: ${status.count}`);
          });
          
          // List some activities
          const activities = await Activity.find()
            .populate('student', 'name email')
            .limit(5);
          
          console.log('\nSample activities:');
          activities.forEach(activity => {
            const studentName = activity.student ? activity.student.name : 'Unknown';
            console.log(`- ${activity.title} (${activity.activityType}) by ${studentName}: ${activity.status}`);
          });
        }
      } else {
        console.log('\nActivity model not found');
      }
    } catch (modelError) {
      console.error('Error loading models:', modelError);
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
    process.exit(0);
  }
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 