const mongoose = require("mongoose");

const subscribe_partner_requestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    iv: { type: String, required: true },
    content: { type: String, required: true },
  },
  emailHash: {
     type: String,
      required: true,
       unique: true 
    },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  flag:{
    type:String,
    default:"none"
  }
});

const subscribe_partner_request = mongoose.model(
  "subscribe_partner_request",
  subscribe_partner_requestSchema
);
module.exports = subscribe_partner_request;
