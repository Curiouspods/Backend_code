const axios = require("axios");
const { createClient } = require("redis");

const LatestCourses = require("../models/LatestCourses");
const TopRatedCourses = require("../models/TopRatedCourses");
const TrendingCourses = require("../models/TrendingCourses");

const WP_SITE_URL = process.env.WP_SITE_URL;
const CATEGORY_ID = process.env.CATEGORY_ID || 5;
const CACHE_KEY = `tutor_courses_category_${CATEGORY_ID}`;
const CACHE_TTL = 604800; // 1 week
const REDIS_KEY = "tutor_top_rated_courses";

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

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
    //console.log(res.data);
    return {
      id: res.data.course_id,
      title: res.data.course_title,
      link: res.data.course_url,
      enrollment_count: res.data.enrollment_count,
      ratings: res.data.ratings,
    }
  } catch (error) {
    console.log(error);
  }
}

const getLatestPosted = async (req, res) => {
  try {
    const cacheKey = `tutor_courses_category_${CATEGORY_ID}`;
    const cached = await redisClient.get(cacheKey);
    const courses = await fetchAllCourses();

      const exists = await LatestCourses.exists({ id: courses.id });
      if (!exists) {
        const newCourse = new LatestCourses({
          id: courses.id,
          title: courses.title,
          link: courses.link,
          enrollment_count:courses.enrollment_count,
          ratings: courses.ratings,
        });
        await newCourse.save();
    }

    await redisClient.set(cacheKey, JSON.stringify(courses), { EX: CACHE_TTL });

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
    }));
  } catch (error) {
    console.log(error);
  }
}

const getTopRatedCourses = async (req, res) => {
  try {
    const cached = await redisClient.get(REDIS_KEY);
    const courses = await fetchEnrolledCourses();
    for (const course of courses) {
      const exists = await TopRatedCourses.exists({ id: course.id });
      if (!exists) {
        const newCourse = new TopRatedCourses({
          id: course.id,
          title: course.title,
          rating: course.rating,
          reviews: course.reviews,
          link: course.link,
        });
        await newCourse.save();
      }
    }
    await redisClient.set(REDIS_KEY, JSON.stringify(courses), {
      EX: CACHE_TTL,
    });

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
        console.error("Error fetching metrics for course ID", course.id, error);
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
      const newCourse = new TrendingCourses({
        id: course.id,
        title: course.title,
        date: course.date,
        trendingScore: course.trendingScore,
        link: course.link,
      });
      await newCourse.save();
    }

  }
  res.status(200).json(sorted);
}

// Export all functions
module.exports = {
  getLatestPosted,
  getTopRatedCourses,
  getTrendingCourses,
};
