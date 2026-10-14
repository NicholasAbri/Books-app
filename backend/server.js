require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const booksRouter = require("./routes/books");
const authRouter = require("./routes/auth");
const requireAuth = require("./middleware/requireAuth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Books API is running");
});

// Public authentication routes
app.use("/api/auth", authRouter);

// Protected book routes
app.use("/api/books", requireAuth, booksRouter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing from your .env file");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing from your .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });
