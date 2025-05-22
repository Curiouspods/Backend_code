const SearchData = require("../models/searchModel");
const fs = require("fs");
const { MeiliSearch } = require("meilisearch");

const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY || "wowvtexmas100225599",
});

async function insertSearchData(req, res) {
  const jsonData = require('../Tags-and-Subtags.json').Sheet1;

  // Prepare documents to insert
  const documents = jsonData.map(entry => ({
    id: entry["Coure ID"].trim(),   // use unique id for Meilisearch
    title: entry["Title "].trim(),
    plan: entry["Plan"].trim(),
    tag: entry["Tag"].trim(),
    subtags: [entry["Subtag1"], entry["Subtag2"], entry["Subtag3"]].filter(Boolean),
  }));

  try {
    // Create index with primary key "id" (if not exists)
    await client.createIndex('searchdata', { primaryKey: 'id' }).catch(() => {});

    // Add documents to Meilisearch index
    const index = client.index('searchdata');
    const response = await index.addDocuments(documents);


    res.status(200).json({ message: "Data added to Meilisearch!", task: response });
  } catch (err) {
    console.error('Meilisearch insertion error:', err);
    res.status(500).json({ error: 'Failed to insert data into Meilisearch' });
  }
}

// Search from Meilisearch by query
async function searchData(req, res) {
  const query = req.query.q || "";

  if (!query) {
    return res.status(400).json({ error: "Query (q) parameter is required." });
  }

  try {
    const result = await client.index("searchdata").search(query);
    res.status(200).json(result.hits);
  } catch (error) {
    console.error("Search Error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
}

module.exports = { insertSearchData, searchData };


