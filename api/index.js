require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));

// ====================
// MULTER (UPLOAD FILE)
// ====================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

// ====================
// SESSION
// ====================

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ====================
// PASSPORT
// ====================

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

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

// ====================
// LOGIN GOOGLE
// ====================

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

// ====================
// MIDDLEWARE LOGIN
// ====================

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/");
}

// ====================
// HOME
// ====================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Login Google</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
</head>

<body class="bg-light">

<div class="container mt-5">

  <div class="card shadow mx-auto" style="max-width:500px;">
    <div class="card-body text-center">

      <h1 class="mb-4">Google OAuth Login</h1>

      <a href="/auth/google" class="btn btn-primary">
        Login dengan Google
      </a>

    </div>
  </div>

</div>

</body>
</html>
`);
});

// ====================
// DASHBOARD
// ====================

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

      <h1 class="text-center mb-4">
        Dashboard
      </h1>

      <div class="text-center">

        <img
          src="${req.user.photos?.[0]?.value || "https://via.placeholder.com/120"}"
          width="120"
          height="120"
          class="rounded-circle border"
        >

      </div>

      <hr>

      <p>
        <strong>Nama:</strong>
        ${req.user.displayName}
      </p>

      <p>
        <strong>Email:</strong>
        ${req.user.emails[0].value}
      </p>

      <hr>

      <h4>Upload File</h4>

      <form
        action="/upload"
        method="POST"
        enctype="multipart/form-data"
      >

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

      <a
        href="/logout"
        class="btn btn-danger"
      >
        Logout
      </a>

    </div>
  </div>

</div>

</body>
</html>
`);
});

// ====================
// UPLOAD FILE
// ====================

app.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">

</head>

<body class="bg-light">

<div class="container mt-5">

<div class="card shadow">
<div class="card-body">

<h2>Upload Berhasil 🎉</h2>

<p>
Nama File:
<strong>${req.file.filename}</strong>
</p>

<a
  href="/uploads/${req.file.filename}"
  target="_blank"
  class="btn btn-primary"
>
  Lihat File
</a>

<a
  href="/dashboard"
  class="btn btn-secondary"
>
  Kembali
</a>

</div>
</div>

</div>

</body>
</html>
`);
  }
);

// ====================
// LOGOUT
// ====================

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// ====================
// SERVER
// ====================

app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});