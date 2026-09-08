import { useEffect, useState } from "react";
import { getBooks, addBook, updateBook, deleteBook } from "./api";
import "./App.css";

const emptyForm = { title: "", author: "", year: "", genre: "" };

export default function App() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const data = await getBooks();
      setBooks(data);
      setError("");
    } catch (err) {
      setError("Could not load books. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.author) return;
    try {
      if (editingId) {
        await updateBook(editingId, form);
      } else {
        await addBook(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadBooks();
    } catch (err) {
      setError("Could not save book.");
    }
  }

  function handleEdit(book) {
    setForm({
      title: book.title,
      author: book.author,
      year: book.year || "",
      genre: book.genre || "",
    });
    setEditingId(book._id);
  }

  async function handleDelete(id) {
    try {
      await deleteBook(id);
      loadBooks();
    } catch (err) {
      setError("Could not delete book.");
    }
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="container">
      <h1>Books App</h1>

      <form className="book-form" onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="author"
          placeholder="Author"
          value={form.author}
          onChange={handleChange}
          required
        />
        <input
          name="year"
          placeholder="Year"
          type="number"
          value={form.year}
          onChange={handleChange}
        />
        <input
          name="genre"
          placeholder="Genre"
          value={form.genre}
          onChange={handleChange}
        />
        <div className="form-buttons">
          <button type="submit">{editingId ? "Update" : "Add"} Book</button>
          {editingId && (
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading books...</p>
      ) : (
        <ul className="book-list">
          {books.map((book) => (
            <li key={book._id} className="book-item">
              <div>
                <strong>{book.title}</strong> by {book.author}
                {book.year ? ` (${book.year})` : ""}
                {book.genre ? ` — ${book.genre}` : ""}
              </div>
              <div className="book-actions">
                <button onClick={() => handleEdit(book)}>Edit</button>
                <button onClick={() => handleDelete(book._id)}>Delete</button>
              </div>
            </li>
          ))}
          {books.length === 0 && <p>No books yet. Add one above.</p>}
        </ul>
      )}
    </div>
  );
}
