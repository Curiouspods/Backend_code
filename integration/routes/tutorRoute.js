const express = require("express");
const { insertTutorials, getTutorialByCourseID } = require("../controllers/tutorController");

const router = express.Router();
router.post("/load-tutors", insertTutorials);
router.get("/:productId", getTutorialByCourseID); // New GET API

module.exports = router;
