const axios = require("axios");
const registration_sample = require("../models/registration_sample");
const subscribe_partner_request = require("../models/subscribe_partner_request");
const { encrypt, decrypt, hashEmail } = require("../utils/encryption");
const crypto = require("crypto");

//add user to registration sample table
const addUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(201).json({ message: "name , email required" });
    }

    const userData = await registration_sample.findOne({ email });
    if (userData) {
      return res.status(201).json({ message: "User already exists" });
    }

    const user = new registration_sample({ name, email });
    await user.save();

    res.status(201).json({ message: "User saved successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//add subscription update
const addSubscription = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    //checking logic for one hr 5 entries
    // Start of the day (today at 00:00:00)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // This is the key change!

    // Count how many users registered today
    const count = await subscribe_partner_request.countDocuments({
      createdAt: { $gte: todayStart },
    });

    if (count >= 5) {
      return res.status(429).json({
        message: "Daily registration limit reached. Try again tomorrow.",
      });
    }
    //check emailId in registration table
    const user = await registration_sample.findOne({ email });

    if (user) {
      const name = user.name;
      const email = user.email;

      const emailHash = hashEmail(email);

      // 🔍 Check if this email was already registered
      const existing = await subscribe_partner_request.findOne({ emailHash });
      if (existing) {
        return res
          .status(201)
          .json({ message: "User already registered to the subscription" });
      }
      const encryptedEmail = encrypt(email);

      //save the user details in subscription table
      const data = new subscribe_partner_request({
        name,
        email: encryptedEmail,
        emailHash,
      });
      await data.save();

      //update type=update in registration table
      const update = await registration_sample.updateOne(
        { email: email },
        { $set: { flag: "Update" } }
      );

      return res.status(200).json({
        exists: true,
        message: "User is registered to the subscription successfully",
      });
    } else {
      return res
        .status(200)
        .json({ exists: false, message: "Please Register first" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const updateSubscription = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      // 🔐 Hash the incoming email using the same method used in your DB
      const emailHash = crypto.createHash("sha256").update(email).digest("hex");
  
      // 🔍 Check if this hashed email exists in the database
      const existing = await subscribe_partner_request.findOne({ emailHash });
  
      if (existing) {
        // ✅ Update the flag
        await subscribe_partner_request.updateOne(
          { emailHash },
          { $set: { flag: "Partner" } }
        );
        return res.status(200).json({ message: "Subscription updated to Partner" });
      } else {
        return res.status(404).json({ message: "Email not found" });
      }
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  };

module.exports = { addSubscription, addUser ,updateSubscription};
