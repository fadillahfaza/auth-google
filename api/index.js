require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.urlencoded({ extended: true }));

// Buat folder uploads jika belum ada
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

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

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

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

// Login Google
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Middleware login
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

          <div class="text-center mt-3">
            <img
              src="${req.user.photos?.[0]?.value || "https://via.placeholder.com/120"}"
              class="rounded-circle border"
              width="120"
              height="120"
            >
          </div>

          <hr>

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
      <h2>Upload Berhasil 🎉</h2>

      <p>Nama File:</p>
      <p>${req.file.filename}</p>

      <a href="/uploads/${req.file.filename}" target="_blank">
        Lihat File
      </a>

      <br><br>

      <a href="/dashboard">
        Kembali ke Dashboard
      </a>
    `);
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
});