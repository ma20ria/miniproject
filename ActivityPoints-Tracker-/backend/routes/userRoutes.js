const express = require('express');
const {
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  deleteUser,
  getAssignedStudents
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Teacher specific routes (more specific routes first)
router.get('/teacher/:teacherId/students', authorize('teacher'), getAssignedStudents);

// Role-based routes
router.get('/role/:role', authorize('superadmin', 'teacher'), getUsersByRole);

// Generic routes
router.get('/:id', authorize('superadmin', 'teacher'), getUserById);

// Superadmin only routes
router.get('/', authorize('superadmin'), getAllUsers);
router.put('/:id', authorize('superadmin'), updateUser);
router.delete('/:id', authorize('superadmin'), deleteUser);

module.exports = router; 