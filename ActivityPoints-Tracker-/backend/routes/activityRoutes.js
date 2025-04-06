const express = require('express');
const {
  submitActivity,
  getMyActivities,
  getPendingActivities,
  reviewActivity,
  getAllActivities,
  generateReport
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protect all routes
router.use(protect);

// Student routes
router.post('/', authorize('student'), upload.single('certificate'), submitActivity);
router.get('/', authorize('student'), getMyActivities);

// Teacher routes
router.get('/pending', authorize('teacher'), getPendingActivities);
router.put('/:id/review', authorize('teacher'), reviewActivity);
router.get('/report', authorize('teacher', 'superadmin'), generateReport);

// Superadmin routes
router.get('/all', authorize('superadmin'), getAllActivities);

module.exports = router; 