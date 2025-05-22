const express = require("express");
const { insertRecommendations, getRecommendationByCourseID } = require("../controller/recommendationController");

const router = express.Router();
router.post("/load-recommendations", insertRecommendations); // POST API
router.get("/:courseId", getRecommendationByCourseID); // GET API

module.exports = router;
