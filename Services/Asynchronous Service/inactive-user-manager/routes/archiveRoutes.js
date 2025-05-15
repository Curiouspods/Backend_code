const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have auth middleware

// Routes with authentication
router.use(protect);

// Routes for all authenticated users
router.get('/archived', archiveController.getArchivedUsers);
router.get('/archived/:userId', archiveController.getArchivedUser);

// Routes for admins only
router.use(authorize('admin'));
router.post('/archive-user/:userId', archiveController.manuallyArchiveUser);
router.get('/inactive-users', archiveController.getInactiveUsers);
router.post('/process-inactive', archiveController.processInactiveUsers);
router.post('/run-checks', archiveController.runInactivityChecks);

module.exports = router;