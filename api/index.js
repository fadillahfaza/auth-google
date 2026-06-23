require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");

const app = express();

app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Multer (untuk Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
});

// Middleware Login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

// Home
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Google Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body class="bg-light">

    <div class="container mt-5">
      <div class="card shadow mx-auto" style="max-width:500px">
        <div class="card-body text-center">
          <h1>Google OAuth Login</h1>

          <a href="/auth/google" class="btn btn-primary mt-3">
            Login dengan Google
          </a>
        </div>
      </div>
    </div>

  </body>
  </html>
  `);
});

// Login Google
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Dashboard
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>

  <body class="bg-light">

    <div class="container mt-5">
      <div class="card shadow">
        <div class="card-body">

          <h1 class="text-center">Dashboard</h1>

          <div class="text-center mb-3">
            <img
              src="${req.user.photos?.[0]?.value || "https://via.placeholder.com/120"}"
              width="120"
              height="120"
              class="rounded-circle border"
            >
          </div>

          <p><strong>Nama:</strong> ${req.user.displayName}</p>

          <p><strong>Email:</strong> ${
            req.user.emails?.[0]?.value || "-"
          }</p>

          <hr>

          <h4>Upload File</h4>

          <form action="/upload" method="POST" enctype="multipart/form-data">
            <input
              type="file"
              name="file"
              class="form-control mb-3"
              required
            >

            <button
              type="submit"
              class="btn btn-success"
            >
              Upload
            </button>
          </form>

          <hr>

          <a href="/logout" class="btn btn-danger">
            Logout
          </a>

        </div>
      </div>
    </div>

  </body>
  </html>
  `);
});

// Upload
app.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Upload Berhasil</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
      </head>

      <body class="bg-light">

        <div class="container mt-5">
          <div class="card shadow">
            <div class="card-body text-center">

              <h2>Upload Berhasil 🎉</h2>

              <p>Nama File:</p>

              <h5>${req.file.originalname}</h5>

              <p class="text-success">
                File berhasil diterima server.
              </p>

              <a href="/dashboard" class="btn btn-primary">
                Kembali ke Dashboard
              </a>

            </div>
          </div>
        </div>

      </body>
      </html>
    `);
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Vercel Export
module.exports = app;