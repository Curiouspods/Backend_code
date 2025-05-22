const express = require("express");
const { insertSearchData, searchData } = require("../controllers/searchController");

const router = express.Router();

router.post("/loadAll", insertSearchData);   // Load all data into Meilisearch
router.get("/", searchData);                 // Search using `?q=anything`

module.exports = router;
