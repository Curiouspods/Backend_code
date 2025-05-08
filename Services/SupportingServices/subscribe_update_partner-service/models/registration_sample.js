const mongoose = require('mongoose');

const registration_sampleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  flag:{
    type:String,
    default:"no Update"
  }
});

const registration_sample = mongoose.model('registration_sample', registration_sampleSchema);
module.exports = registration_sample;
