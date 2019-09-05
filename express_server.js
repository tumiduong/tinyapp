const express = require("express");
const app = express();
const PORT = 8080;
const uuid = require("uuid/v4");
const bcrypt = require('bcrypt');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

// databases
const urlDatabase = {

};

const users = {

};

// functions

let urlRandom = () => {
  return uuid().substr(0, 6);
};

let userRandom = () => {
  return uuid().substr(0, 8);
};

const userFinder = (email => {
  for (const user of Object.values(users)) {
    if (user.email === email) {
      return user;
    } else {
      return false;
    }
  }
});

const authenticatePw = ((email, password) => {
  const user = userFinder(email);
  if (password === user.password) {
    return true;
  } else {
    return false;
  }
});

// gets

app.get("/", (req, res) => {
  res.redirect("/urls")
});

app.get("/urls/new", (req, res) => {
  let templateVars = { users: req.cookies["user_id"] };
  if (!req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    users: req.cookies["user_id"],
    urls: urlDatabase }
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { users: req.cookies["user_id"] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { users: req.cookies["user_id"] };
  res.render("urls_login", templateVars)
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: req.cookies["user_id"] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//posts

app.post("/urls", (req, res) => {
  let shortURL = urlRandom();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body
  let user = userFinder(email);

  if (!user) {
    res.status(403).send("Email cannot be found.");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Password is not correct.")
  } else if (user && bcrypt.compareSync(password, user.password)) {
    res.cookie("user_id", user);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let userId = userRandom();
  let pW = req.body.password;
  let hashedPw = bcrypt.hashSync(pW, 10);
  if (req.body.email === "" || pW === "") {
    res.status(400).send("Please fill out email and/or password.");
  } else if (userFinder(req.body.email)) {
    res.status(400).send("User already exists.");
  } else {
    users[userId] = { id: userId, email: req.body.email, password: hashedPw };
    res.cookie("user_id", users[userId]);
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});