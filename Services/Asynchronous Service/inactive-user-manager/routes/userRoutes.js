// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All routes are protected
router.use(protect);

// Routes for all authenticated users
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);

// Admin only routes
router.use(authorize('admin'));
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;