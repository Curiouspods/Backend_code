const express = require('express');
const router = express.Router();
const {
  createFlashMessage,
  getActiveFlashMessages,
  getAllFlashMessages,
  deleteFlashMessage,
  updateFlashMessage
} = require('../controllers/flashMessageController');

// Routes for frontend
router.get('/active', getActiveFlashMessages);

// Routes for admin
router.post('/', createFlashMessage);
router.get('/', getAllFlashMessages);
router.delete('/:id', deleteFlashMessage);
router.put('/:id', updateFlashMessage);

module.exports = router;