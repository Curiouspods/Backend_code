
const LatestCourses =require('../models/LatestCourses')
const TopRatedCourses = require("../models/TopRatedCourses");
const TrendingCourses = require("../models/TrendingCourses");


//fetching latest courses from database
const getLatestPosted = async (req, res) => {
  try {
      const courses = await LatestCourses.find();
      if (courses.length === 0) {
          return res.status(404).json({ message: 'No active latest courses found.' });
      }
      res.json(courses); 
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};


//fetching top-rated courses from database
const getTopRatedCourses=async(req,res)=>{
    try {
        const courses = await TopRatedCourses.find({ flag: "active" });
        if (courses.length === 0) {
            return res.status(404).json({ message: 'No top rated courses found.' });
        }
        res.json(courses); 
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
}

//fetching trending courses from database
const getTrendingCourses=async(req,res)=>{
    try {
        const courses = await TrendingCourses.find({ flag: "active" });
        if (courses.length === 0) {
            return res.status(404).json({ message: 'No trending courses found.' });
        }
        res.json(courses); 
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
}

module.exports={getLatestPosted,getTopRatedCourses,getTrendingCourses}