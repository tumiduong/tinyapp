const express = require("express");
const app = express();
const PORT = 8080;
const uuid = require("uuid/v4");
const bcrypt = require('bcrypt');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["513d0504-0e80-433c-944e-6", "e6e21375-ec41-41b8-8389-6"]
}));

app.set("view engine", "ejs");

// databases
let urlDatabase = {

};

let users = {

};

// functions

let urlRandom = () => {
  return uuid().substr(0, 6);
};

let userRandom = () => {
  return uuid().substr(0, 8);
};

// find if user exists
const userFinder = (email => {
  let foundUser = {};
  for (const user of Object.values(users)) {
    if (user.email === email) {
      foundUser = user;
    }
  }
  if (Object.keys(foundUser).length === 0) {
    return false;
  }
  return foundUser;
});

// create an object of all URLs created by user
const urlsForUser = (id => {
  let objArray = Object.values(urlDatabase);
  let userUrls = {};

  for (const obj of objArray) {
    if (id === obj.userID) {
      userUrls[obj.shortURL] = obj;
    }
  }

  if (Object.keys(userUrls).length === 0) {
    return false;
  }
  return userUrls;
});

// see if shortURL was created by current user
const userMatch = (id, shortURL) => {
  let urls = urlsForUser(id);
  let urlsKeys = Object.keys(urls);

  if (!id) {
    return false;
  }

  for (const keys of urlsKeys) {
    if (keys === shortURL) {
      return true;
    }
  }
};

// gets

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { users: req.session.user_id };
  if (!req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    users: req.session.user_id,
    urls: urlDatabase
  };

  if (req.session.user_id) {
    templateVars.urls = urlsForUser(req.session.user_id.id);
  }

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { users: req.session.user_id };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { users: req.session.user_id };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.status(500).send("Sorry, that URL doesn't exist!");
  }

  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urls: urlDatabase,
    users: req.session.user_id,
    byUser: false };

  if (req.session.user_id) {
    templateVars.byUser = userMatch(req.session.user_id.id, req.params.shortURL);
  }

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.status(500).send("Sorry, that URL doesn't exist!");
  }
  
  res.redirect(urlDatabase[req.params.shortURL].longURL);
});

//posts

app.post("/urls", (req, res) => {
  let shortUrl = urlRandom();
  urlDatabase[shortUrl] = { shortURL: shortUrl, longURL: req.body.longURL, userID: req.session.user_id.id};
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortURL", (req, res) => {
  if (userMatch(req.session.user_id.id, req.params.shortURL)) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (userMatch(req.session.user_id.id, req.params.shortURL)) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let user = userFinder(email);

  if (!user) {
    res.status(403).send("Email cannot be found.");
  } else if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Password is not correct.");
  } else if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
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
    req.session.user_id = users[userId];
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});