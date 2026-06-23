const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Home OK");
});

app.get("/dashboard", (req, res) => {
  res.send("Dashboard OK");
});

module.exports = app;