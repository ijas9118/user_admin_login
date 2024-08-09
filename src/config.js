const mongoose = require("mongoose");
const connect = mongoose.connect("mongodb://localhost:27017/login");

connect
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database cannot be created"));

const userSchema = new mongoose.Schema({
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

// Define the admin schema
const adminSchema = new mongoose.Schema({
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
  secretKey: {
    type: String,
  },
});

const User = new mongoose.model("users", userSchema);
const Admin = new mongoose.model("admins", adminSchema);

module.exports = { User, Admin };
