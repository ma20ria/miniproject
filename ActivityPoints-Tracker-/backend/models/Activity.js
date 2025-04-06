const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    required: true,
    enum: ['sports', 'mooc', 'workshops', 'internships']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventOrganizer: {
    type: String,
    default: 'Not specified'
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 8;
      },
      message: 'Semester must be an integer between 1 and 8'
    }
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.activityType === 'sports';
    },
    validate: {
      validator: function(v) {
        if (this.activityType === 'sports') {
          return v >= 1 && v <= 5;
        }
        return true;
      },
      message: 'Sports activities must have a level between 1 and 5'
    }
  },
  date: {
    type: Date,
    required: true
  },
  certificateFile: {
    type: String,  // Path to the uploaded certificate file
    required: true
  },
  // Additional fields for easier filtering
  studentClass: {
    type: String
  },
  studentDepartment: {
    type: String
  },
  pointsAwarded: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  feedback: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate points and enforce limits
ActivitySchema.pre('save', async function(next) {
  if (this.status === 'approved') {
    const startOfYear = new Date(this.date.getFullYear(), 0, 1);
    const endOfYear = new Date(this.date.getFullYear(), 11, 31, 23, 59, 59);
    
    // Get existing approved activities for the year
    const yearlyActivities = await this.constructor.find({
      student: this.student,
      activityType: this.activityType,
      status: 'approved',
      date: { $gte: startOfYear, $lte: endOfYear },
      _id: { $ne: this._id }
    });

    // Calculate points based on activity type
    switch (this.activityType) {
      case 'sports':
        const sportsPointsMap = {
          1: 8,
          2: 15,
          3: 25,
          4: 40,
          5: 50
        };
        this.pointsAwarded = sportsPointsMap[this.level] || 0;
        
        const existingSportsPoints = yearlyActivities.reduce((sum, activity) => sum + activity.pointsAwarded, 0);
        if (existingSportsPoints + this.pointsAwarded > 60) {
          throw new Error('Maximum yearly points limit (60) exceeded for sports activities');
        }
        break;

      case 'mooc':
        this.pointsAwarded = 50;
        if (yearlyActivities.length > 0) {
          throw new Error('Only one MOOC certificate can be uploaded per year');
        }
        break;

      case 'workshops':
        this.pointsAwarded = 6;
        if (yearlyActivities.length >= 2) {
          throw new Error('Maximum 2 workshop certificates can be uploaded per year');
        }
        const existingWorkshopPoints = yearlyActivities.reduce((sum, activity) => sum + activity.pointsAwarded, 0);
        if (existingWorkshopPoints + this.pointsAwarded > 12) {
          throw new Error('Maximum yearly points limit (12) exceeded for workshops');
        }
        break;

      case 'internships':
        this.pointsAwarded = 20;
        if (yearlyActivities.length > 0) {
          throw new Error('Only one internship certificate can be uploaded per year');
        }
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Activity', ActivitySchema); 