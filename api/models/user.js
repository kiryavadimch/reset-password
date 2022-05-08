const { Schema, model } = require('mongoose');

const User = new Schema({
  name: String,
  email: String,
  password: String,
  verified: {type: Boolean, default: false},
});

module.exports = model('User', User);
