const Recommendation = require("../models/recommendationModel");
const fs = require("fs");

async function insertRecommendations(req, res) {
  fs.readFile("Recommendation.json", "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("File read error");
    }

    const jsonData = JSON.parse(data);
    const recommendations = jsonData.map(video => ({
      Video: video["Video "].trim(),
      CourseID: video["Course id"].trim(),
      RecommendedVideos: [
        video["Recommend Video 1"],
        video["Recommend Video 2"],
        video["Recommend Video 3"],
        video["Recommend Video 4"],
        video["Recommend Video 5"]
      ].filter(Boolean), // Remove empty values
    }));

    try {
      for (const recommendation of recommendations) {
        const exists = await Recommendation.findOne({ CourseID: recommendation.CourseID });
        if (!exists) {
          await Recommendation.create(recommendation);
        } else {
          console.log(`Skipping duplicate CourseID: ${recommendation.CourseID}`);
        }
      }
      res.status(200).send("Recommendations inserted successfully (excluding duplicates)!");
    } catch (error) {
      console.error("Insertion Error:", error);
      res.status(500).send("Error inserting recommendations");
    }
  });
}

async function getRecommendationByCourseID(req, res) {
  const { courseId } = req.params;

  try {
    const recommendation = await Recommendation.findOne({ CourseID: courseId });

    if (!recommendation) {
      return res.status(404).json({ message: "No recommendations found for this CourseID!" });
    }

    res.status(200).json(recommendation);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ message: "Server error while retrieving recommendations" });
  }
}

module.exports = { insertRecommendations, getRecommendationByCourseID };
