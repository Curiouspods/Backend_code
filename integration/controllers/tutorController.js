const Tutorial = require("../models/tutorModel");
const fs = require("fs");

async function insertTutorials(req, res) {
  fs.readFile("Integration_TutorLMS_Stripe.json", "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("File read error");
    }

    const jsonData = JSON.parse(data);
    const tutorials = jsonData.Mapping.map(tutorial => ({
      ProductID: tutorial["Product ID"],
      CourseID: tutorial["Course ID"],
      CourseTitle: tutorial["Course Title"],
      PlanID: tutorial["Plan id"],
      CourseStatus: tutorial["Course Status"],
      CourseVersion: tutorial["Course Version"]
    }));

     try {
      for (const tutorial of tutorials) {
        const exists = await Tutorial.findOne({ ProductID: tutorial.ProductID });
        if (!exists) {
          await Tutorial.create(tutorial);
        } else {
          console.log(`Skipping duplicate ProductID: ${tutorial.ProductID}`);
        }
      }
      res.status(200).send("Tutorials inserted successfully (excluding duplicates)!");
    } catch (error) {
      console.error("Insertion Error:", error);
      res.status(500).send("Error inserting tutorials");
    }
  });
}


async function getTutorialByCourseID(req, res) {
  const { productId } = req.params;

  try {
    const tutorial = await Tutorial.findOne({ ProductID: productId });

    if (!tutorial) {
      return res.status(404).json({ message: "No course found with this CourseID!" });
    }

    res.status(200).json(tutorial);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Server error while retrieving course data" });
  }
}

module.exports = { insertTutorials, getTutorialByCourseID };
