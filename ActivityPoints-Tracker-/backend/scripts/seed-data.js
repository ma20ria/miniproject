const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Sample certificate file path
const sampleCertificatePath = 'uploads/sample-certificate.pdf';

// Create a sample certificate file if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '..', sampleCertificatePath))) {
  // Create a simple text file as a placeholder for a certificate
  fs.writeFileSync(
    path.join(__dirname, '..', sampleCertificatePath),
    'This is a sample certificate file for testing purposes.'
  );
  console.log('Created sample certificate file');
}

// Function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Load models
    const User = require('../models/User');
    const Activity = require('../models/Activity');
    
    // Clear existing data
    await User.deleteMany({});
    await Activity.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create users
    const password = await hashPassword('password123');
    
    // Create a superadmin
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password,
      role: 'superadmin'
    });
    
    // Create a teacher
    const teacher = await User.create({
      name: 'Teacher User',
      email: 'teacher@example.com',
      password,
      role: 'teacher',
      department: 'Computer Science'
    });
    
    // Create a student
    const student = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password,
      role: 'student',
      department: 'Computer Science',
      semester: 5,
      class: 'CSE-A',
      rollNumber: 'CS2001'
    });
    
    console.log('Users created');
    
    // Create activities for the student
    const activities = [
      {
        student: student._id,
        activityType: 'Technical',
        title: 'Hackathon Participation',
        description: 'Participated in a 24-hour hackathon and built a web application',
        date: new Date('2023-10-15'),
        certificateFile: sampleCertificatePath,
        status: 'pending'
      },
      {
        student: student._id,
        activityType: 'Cultural',
        title: 'College Fest Performance',
        description: 'Performed in the annual college cultural festival',
        date: new Date('2023-09-20'),
        certificateFile: sampleCertificatePath,
        status: 'approved',
        pointsAwarded: 15,
        feedback: 'Great performance!',
        reviewedBy: teacher._id,
        reviewedAt: new Date()
      },
      {
        student: student._id,
        activityType: 'Sports',
        title: 'Inter-College Cricket Tournament',
        description: 'Represented the college in cricket tournament',
        date: new Date('2023-08-10'),
        certificateFile: sampleCertificatePath,
        status: 'rejected',
        feedback: 'Certificate not valid',
        reviewedBy: teacher._id,
        reviewedAt: new Date()
      },
      {
        student: student._id,
        activityType: 'Professional Development',
        title: 'AWS Certification',
        description: 'Completed AWS Solutions Architect Associate certification',
        date: new Date('2023-11-05'),
        certificateFile: sampleCertificatePath,
        status: 'pending'
      }
    ];
    
    await Activity.insertMany(activities);
    
    console.log('Activities created');
    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  }
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
}); 