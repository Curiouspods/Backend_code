const express = require('express');
const videoControllers = require('../controllers/videosControllers');
const router = express.Router();

router.get('/latest-posted',videoControllers.getLatestPosted)
router.get('/top-rated',videoControllers.getTopRatedCourses)
router.get('/trending',videoControllers.getTrendingCourses)

module.exports = router;
