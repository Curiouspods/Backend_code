const express = require('express');
const videoControllersFromDB = require('../controllers/videoControllersFromDB');
const router = express.Router();

router.get('/latest-posted',videoControllersFromDB.getLatestPosted)
router.get('/top-rated',videoControllersFromDB.getTopRatedCourses)
router.get('/trending',videoControllersFromDB.getTrendingCourses)

module.exports = router;
