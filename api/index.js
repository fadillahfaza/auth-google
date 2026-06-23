require("dotenv").config();

const express = require("express");
const session = require("express-session");

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  res.send("Session OK");
});

module.exports = app;