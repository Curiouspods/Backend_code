const express = require('express');
const videoControllersFromDB = require('../controllers/videoControllersFromDB');
const videosControllers = require('../controllers/videosControllers');
const router = express.Router();

router.get('/latest-posted',videoControllersFromDB.getLatestPosted)
router.get('/top-rated',videoControllersFromDB.getTopRatedCourses)
router.get('/trending',videoControllersFromDB.getTrendingCourses)

router.get('/fetch-all-flexpick-courses',videosControllers.fetchAllFlexpickCourses)

// Updated route to fetch details of a specific course by ID
router.get('/fetch-course-details/:id', videosControllers.fetchCourseById);

module.exports = router;
