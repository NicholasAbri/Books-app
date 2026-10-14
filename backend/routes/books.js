const express = require("express");
const mongoose = require("mongoose");
const Book = require("../models/Book");

const router = express.Router();

// Get only the logged-in user's books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find({
      owner: req.userId,
    }).sort({ createdAt: -1 });

    return res.json(books);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not fetch books",
    });
  }
});

// Get one book belonging to the logged-in user
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const book = await Book.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not fetch book",
    });
  }
});

// Add a book for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { title, author, year, genre } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim()
    ) {
      return res.status(400).json({
        message: "Title and author are required",
      });
    }

    let parsedYear;

    if (year !== undefined && year !== null && year !== "") {
      parsedYear = Number(year);

      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({
          message: "Year must be a whole number",
        });
      }
    }

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      ...(parsedYear !== undefined ? { year: parsedYear } : {}),
      genre: typeof genre === "string" ? genre.trim() : "",
      owner: req.userId,
    });

    return res.status(201).json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not create book",
    });
  }
});

// Update only a book owned by the logged-in user
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const { title, author, year, genre } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim()
    ) {
      return res.status(400).json({
        message: "Title and author are required",
      });
    }

    const updates = {
      title: title.trim(),
      author: author.trim(),
      genre: typeof genre === "string" ? genre.trim() : "",
      year: year === "" || year == null ? null : Number(year),
    };

    if (updates.year !== null && !Number.isInteger(updates.year)) {
      return res.status(400).json({
        message: "Year must be a whole number",
      });
    }

    const book = await Book.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not update book",
    });
  }
});

// Delete only a book owned by the logged-in user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Could not delete book",
    });
  }
});

module.exports = router;
