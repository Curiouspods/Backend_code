const express = require('express');
const videoControllers = require('../controllers/videosControllers');
const router = express.Router();

router.get('/latest-posted',videoControllers.getLatestPosted)
router.get('/top-rated',videoControllers.getTopRatedCourses)
router.get('/trending',videoControllers.getTrendingCourses)

//route for adding sample data
router.post('/add-sample-data',videoControllers.addSampleData)



module.exports = router;
