const axios = require("axios");

const LatestCourses = require("../models/LatestCourses");
const TopRatedCourses = require("../models/TopRatedCourses");
const TrendingCourses = require("../models/TrendingCourses");

const WP_SITE_URL = process.env.WP_SITE_URL;

//latest posted courses
async function fetchAllCourses() {
  try {
    const url = `${WP_SITE_URL}/wp-json/custom-tutor/v1/latest-course`;
    const res = await axios.get(url, {
      params: {
        orderby: "date",
        order: "desc",
        per_page: 10,
      },
      auth: {
        username: process.env.TUTOR_API_KEY,
        password: process.env.TUTOR_SECRET_KEY,
      },
    });
    return {
      id: res.data.course_id,
      title: res.data.course_title,
      link: res.data.course_url,
      enrollment_count: res.data.enrollment_count,
      ratings: res.data.ratings,
    };
  } catch (error) {
    console.log(error);
  }
}

const getLatestPosted = async (req, res) => {
  try {
    const courses = await fetchAllCourses();

    const exists = await LatestCourses.exists({ id: courses.id });
    if (!exists) {
      const newCourse = new LatestCourses({
        id: courses.id,
        title: courses.title,
        link: courses.link,
        enrollment_count: courses.enrollment_count,
        ratings: courses.ratings,
      });
      await newCourse.save();
    }

    res.status(200).json(courses);
  } catch (err) {
    console.error("Error in getLatestPosted:", err);
    res.status(500).json({ error: err.message });
  }
};

//Top Rated Courses
async function fetchEnrolledCourses() {
  try {
    const url = `${WP_SITE_URL}/wp-json/tutor/v1/courses`;
    const res = await axios.get(url, {
      params: {
        orderby: "rating",
        order: "desc",
        per_page: 10,
      },
      auth: {
        username: process.env.TUTOR_API_KEY,
        password: process.env.TUTOR_SECRET_KEY,
      },
    });
    return res.data.data.posts.map((course) => ({
      id: course.ID,
      title: course.post_title,
      rating: course.ratings.rating_avg,
      reviews: course.ratings.rating_count,
      link: course.thumbnail_url,
      date: course.post_date,
    }));
  } catch (error) {
    console.log(error);
  }
}

const getTopRatedCourses = async (req, res) => {
  try {
    const courses = await fetchEnrolledCourses();

    for (const course of courses) {
      const exists = await TopRatedCourses.exists({ id: course.id });
      if (!exists) {
        const today = new Date(course.date);
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        const flag = today <= twoWeeksLater ? "active" : "inactive";

        const newCourse = new TopRatedCourses({
          id: course.id,
          title: course.title,
          rating: course.rating,
          reviews: course.reviews,
          link: course.link,
          valid_from: today,
          valid_to: twoWeeksLater,
          flag: flag, // Always active on creation
        });
        await newCourse.save();

        // Delete inactive entries older than 3 months
        const courseDate = new Date(course.date); // Ensure course.date is a Date object

        const threeMonthsAgo = new Date(courseDate); // Clone course.date
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        await TopRatedCourses.deleteMany({
          flag: "inactive",
          valid_to: { $lt: threeMonthsAgo },
        });
      }
    }

    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//trending courses
async function fetchEnrolledCourses1() {
  const url = `${WP_SITE_URL}/wp-json/tutor/v1/courses`;
  const res = await axios.get(url, {
    auth: {
      username: process.env.TUTOR_API_KEY,
      password: process.env.TUTOR_SECRET_KEY,
    },
  });
  return res.data.data.posts.map((course) => ({
    id: course.ID,
    title: course.post_title,
    date: course.post_date,
    link: course.thumbnail_url,
  }));
}

async function fetchSpecificCourse(courseId) {
  const url = `${WP_SITE_URL}/wp-json/custom-tutor/v1/course-details/${courseId}`;
  const res = await axios.get(url, {
    auth: {
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
    },
  });
  const enrollments = res.data.enrollment_count;
  const reviews = res.data.reviews;
  const recentReviews = reviews.filter(
    (r) => Date.now() - new Date(r.date).getTime() < 7 * 86400000
  );
  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return {
    enrollments,
    recentReviews: recentReviews.length,
    avgRating,
  };
}

function calculateTrendingScore({ enrollments, recentReviews, avgRating }) {
  return enrollments * 3 + recentReviews * 2 + avgRating * 5;
}

async function getTrendingCourses(req, res) {
  try {
    const courses = await fetchEnrolledCourses1();
    const enrichedCourses = await Promise.all(
      courses.map(async (course) => {
        try {
          const metrics = await fetchSpecificCourse(course.id);
          return {
            ...course,
            trendingScore: calculateTrendingScore(metrics),
          };
        } catch (error) {
          console.error(
            "Error fetching metrics for course ID",
            course.id,
            error
          );
          return { ...course, trendingScore: 0 };
        }
      })
    );

    const sorted = enrichedCourses
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5);

    for (const course of sorted) {
      const exists = await TrendingCourses.exists({ id: course.id });
      if (!exists) {
        const today = new Date(course.date);
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        const flag = today <= twoWeeksLater ? "active" : "inactive";

        const newCourse = new TrendingCourses({
          id: course.id,
          title: course.title,
          date: course.date,
          trendingScore: course.trendingScore,
          link: course.link,
          valid_from: today,
          valid_to: twoWeeksLater,
          flag: flag,
        });
        await newCourse.save();

        // Delete inactive entries older than 3 months
        const courseDate = new Date(course.date); // Ensure course.date is a Date object

        const threeMonthsAgo = new Date(courseDate); // Clone course.date
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        await TrendingCourses.deleteMany({
          flag: "inactive",
          valid_to: { $lt: threeMonthsAgo },
        });
      }
    }

    res.status(200).json(sorted);
  } catch (err) {
    console.error("Error in getTrendingCourses:", err);
    res.status(500).json({ error: err.message });
  }
}


//add sample data
const addSampleData = async (req, res) => {
  try {

    const {id,title,link,video,ratings,trendingScore,valid_from}=req.body;
    const exists = await TrendingCourses.exists({ id:id });
    if (!exists) {
      const newCourse = new TrendingCourses({
        id: id,
        title: title,
        link: link,
        video:video,
        ratings:ratings,
        trendingScore:trendingScore,
        valid_from:valid_from
      });
      await newCourse.save();
    }

    res.status(200).json("data is saved");
  } catch (err) {
    console.error("Error in getLatestPosted:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch all Flexpick courses
async function fetchAllFlexpickCourses(req, res) {
  try {
    console.log("Fetching all Flexpick courses...");

    const url = `${WP_SITE_URL}/wp-json/tutor/v1/courses`;
    let allCourses = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching page: ${page}`);
      const response = await axios.get(url, {
        params: { paged: page, per_page: 20 },
        auth: {
          username: process.env.TUTOR_API_KEY,
          password: process.env.TUTOR_SECRET_KEY,
        },
      });

      if (response.status === 200 && response.data?.data?.posts?.length > 0) {
        const courses = response.data.data.posts;
        allCourses = allCourses.concat(courses);
        page++;
      } else {
        hasMore = false;
      }
    }

    const videos = allCourses.map((course) => ({
      id: course.course_tag[0]?.slug || course.ID || "",
      title: course.post_title || "",
      description: course.post_content || "",
      tags: typeof course.course_tag[0]?.name === "string"
        ? course.course_tag[0]?.name.split(",").map(tag => tag.trim())
        : [],
      thumbnail: course.thumbnail_url || "",
      course_category: course.course_category[0]?.name || "",
    }));

    console.log("Total number of videos fetched:", videos.length);

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Error in fetchAllFlexpickCourses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Export all functions
module.exports = {
  fetchAllCourses,
  getLatestPosted,
  getTopRatedCourses,
  getTrendingCourses,
  addSampleData,
  fetchAllFlexpickCourses,
};
