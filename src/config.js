const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/login");

connect
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database cannot be created"));

const loginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const collection = new mongoose.model('users', loginSchema)

module.exports = collection;