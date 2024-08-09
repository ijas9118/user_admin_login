const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcrypt");
const { User, Admin } = require("./config");

require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

let plNames = ["C", "C++", "Python", "Java"];

app.get("/", (req, res) => {
  if (req.session.admin) return res.redirect("/admin");
  if (!req.session.user) {
    return res.status(200).redirect("/login");
  } else {
    return res.status(200).render("home", {
      pageTitle: "Home Page",
      plNames,
    });
  }
});

app.post("/", (req, res) => {
  plNames.push(req.body.plName);
  res.redirect("/");
});

app.get("/admin", async (req, res) => {
  if (!req.session.admin) {
    return res.status(200).redirect("/login");
  }
  try {
    const users = await User.find();

    return res.status(200).render("admin", {
      pageTitle: "Admin Page",
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send("Server error. Please try again later.");
  }
});

app.get("/login", (req, res) => {
  if (req.session.role) {
    return res.status(200).redirect("/");
  }
  res.status(200).render("login");
});

app.post("/login", async (req, res) => {
  try {
    const role = req.body.role;

    let check;

    if (role === "user") {
      check = await User.findOne({ email: req.body.email });
    } else {
      check = await Admin.findOne({ email: req.body.email });
    }

    if (check === null) {
      return res
        .status(404)
        .send(
          "<p>Incorrect email or password. <a href='/login'>Try again</a></p>"
        );
    }

    const isMatch = await bcrypt.compare(req.body.password, check.password);
    if (isMatch) {
      req.session.role = role;

      if (role === "admin") {
        req.session.admin = { email: req.body.email };
        return res.redirect("/admin");
      } else {
        req.session.user = { email: req.body.email };
        return res.redirect("/");
      }
    } else {
      return res
        .status(404)
        .send('<p>Incorrect password. <a href="/login">Try again</a></p>');
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send(
        '<p>Server error. Please try again later. <a href="/login">Try again</a></p>'
      );
  }
});

app.get("/signup", (req, res) => {
  if (req.session.role) {
    return res.status(200).redirect("/");
  }
  res.status(200).render("signup");
});

app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    secret: req.body.secret,
  };

  const salt = 10;
  const hashedPassword = await bcrypt.hash(data.password, salt);

  if (data.role === "user") {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      res.send("Email already registered. Please choose a different email.");
    } else {
      const userData = new User({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      userData.save();

      req.session.user = { email: req.body.email };
      return res.redirect("/");
    }
  } else {
    if (data.secret !== process.env.SECRET_KEY)
      return res.send("Incorrect secret key");
    const existingAdmin = await Admin.findOne({ email: data.email });
    if (existingAdmin) {
      res.send("Email already registered. Please choose a different email.");
    } else {
      const adminData = new Admin({
        name: data.name,
        email: data.email,
        password: hashedPassword,
      });

      adminData.save();

      req.session.user = { email: req.body.email };
      return res.redirect("/admin");
    }
  }
});

app.get("/edit/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.render("edit", { user, pageTitle: "Edit User" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    const updatedUser = {
      name: req.body.name,
      email: req.body.email,
    };

    await User.findByIdAndUpdate(req.params.id, updatedUser);

    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/search", async (req, res) => {
  const { searchType, searchValue } = req.body;
  try {
    let users;

    if (searchType === "Name") {
      users = await User.find({ name: searchValue });
    } else if (searchType === "Email") {
      users = await User.find({ email: searchValue });
    }

    res.render("admin", {
      pageTitle: "User Details",
      users, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while searching for users.");
  }
  
});

app.get('/add-user', (req, res) => {
  res.render('add-user', { pageTitle: 'Add New User' });
});

app.post('/add-user', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const newUser = new User({
      name: name,
      email: email,
      password: password
    });

    await newUser.save();

    res.redirect('/admin');
  } catch (err) {
    console.error('Error adding new user:', err);
    res.status(500).send('Server Error');
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

app.listen(3000, () => {
  console.log("Server is running http://localhost:3000");
});
