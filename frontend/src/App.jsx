import { useEffect, useState } from "react";

import {
  registerUser,
  loginUser,
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} from "./api";

import "./App.css";

const emptyForm = {
  title: "",
  author: "",
  year: "",
  genre: "",
};

const emptyAuthForm = {
  email: "",
  password: "",
};

const coverColors = [
  "#315B4C",
  "#B8674D",
  "#385678",
  "#806747",
  "#725879",
  "#A27B43",
];

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("booksAppToken") || "",
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("booksAppUser"));
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setBooks([]);
      setLoading(false);
      return undefined;
    }

    async function loadBooks() {
      try {
        setLoading(true);

        const data = await getBooks(token);

        if (!cancelled) {
          setBooks(data);
          setError("");
        }
      } catch (err) {
        if (cancelled) return;

        if (err.status === 401) {
          localStorage.removeItem("booksAppToken");
          localStorage.removeItem("booksAppUser");

          setToken("");
          setUser(null);
          setError("Your session expired. Please log in again.");
        } else {
          setError(err.message || "Could not load your books.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleAuthChange(event) {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    try {
      setAuthLoading(true);
      setError("");
      setMessage("");

      const result =
        authMode === "register"
          ? await registerUser(authForm)
          : await loginUser(authForm);

      localStorage.setItem("booksAppToken", result.token);
      localStorage.setItem("booksAppUser", JSON.stringify(result.user));

      setToken(result.token);
      setUser(result.user);
      setAuthForm(emptyAuthForm);
      setShowPassword(false);
      setMessage(result.message || "");
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("booksAppToken");
    localStorage.removeItem("booksAppUser");

    setToken("");
    setUser(null);
    setBooks([]);
    setForm(emptyForm);
    setEditingId(null);
    setSearchQuery("");
    setError("");
    setMessage("");
  }

  function handleBookError(err, fallback) {
    if (err.status === 401) {
      localStorage.removeItem("booksAppToken");
      localStorage.removeItem("booksAppUser");

      setToken("");
      setUser(null);
      setError("Your session expired. Please log in again.");
    } else {
      setError(err.message || fallback);
    }
  }

  async function refreshBooks() {
    const data = await getBooks(token);
    setBooks(data);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.author.trim()) {
      setError("Book title and author are required.");
      return;
    }

    try {
      setError("");
      setMessage("");

      const bookData = {
        ...form,
        title: form.title.trim(),
        author: form.author.trim(),
        genre: form.genre.trim(),
      };

      if (editingId) {
        await updateBook(editingId, bookData, token);
        setMessage("Your book has been updated.");
      } else {
        await addBook(bookData, token);
        setMessage("A new book has been added to your library.");
      }

      setForm(emptyForm);
      setEditingId(null);

      await refreshBooks();
    } catch (err) {
      handleBookError(err, "Could not save this book.");
    }
  }

  function handleEdit(book) {
    setForm({
      title: book.title || "",
      author: book.author || "",
      year: book.year ?? "",
      genre: book.genre || "",
    });

    setEditingId(book._id);
    setError("");
    setMessage("");
  }

  async function handleDelete(id) {
    try {
      setError("");
      setMessage("");

      await deleteBook(id, token);
      await refreshBooks();

      if (editingId === id) {
        setForm(emptyForm);
        setEditingId(null);
      }

      setMessage("Book deleted from your library.");
    } catch (err) {
      handleBookError(err, "Could not delete this book.");
    }
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function switchAuthMode() {
    setAuthMode((current) => (current === "register" ? "login" : "register"));

    setAuthForm(emptyAuthForm);
    setShowPassword(false);
    setError("");
    setMessage("");
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBooks = books.filter((book) => {
    const searchableText = [book.title, book.author, book.genre, book.year]
      .map((value) => String(value || ""))
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  const genres = [
    ...new Set(books.map((book) => book.genre?.trim()).filter(Boolean)),
  ];

  const yearValues = books
    .map((book) => Number(book.year))
    .filter((year) => Number.isFinite(year) && year > 0)
    .sort((a, b) => b - a);

  const newestYear = yearValues.length ? yearValues[0] : "—";
  const avatarLetter = user?.email?.charAt(0).toUpperCase() || "R";

  // Login and registration
  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-showcase">
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true">
              B<span>.</span>
            </span>

            <div>
              <strong>Bookshelf</strong>
              <span>YOUR PERSONAL LIBRARY</span>
            </div>
          </div>

          <div className="showcase-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              MADE FOR YOUR READING LIFE
            </span>

            <h1>
              Every book
              <br />
              has its <span>place.</span>
            </h1>

            <p>
              Your own little corner of the literary world. Keep your books
              organized, find what you need, and make room for your next
              favorite.
            </p>

            <div className="showcase-features">
              <div className="feature-row">
                <span className="feature-icon">↗</span>
                <div>
                  <strong>Your collection, organized</strong>
                  <span>Keep titles, authors and genres together.</span>
                </div>
              </div>

              <div className="feature-row">
                <span className="feature-icon">⌕</span>
                <div>
                  <strong>Find books faster</strong>
                  <span>Search your collection in seconds.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />

            <div className="art-book art-book-back">
              <span className="art-book-number">02</span>
              <span className="art-book-line" />
              <span className="art-book-title">A world of ideas</span>
              <span className="art-book-footer">THE COLLECTION</span>
            </div>

            <div className="art-book art-book-front">
              <span className="art-book-number">01</span>
              <span className="art-book-line" />
              <span className="art-book-title">
                Stories
                <br />
                worth
                <br />
                keeping.
              </span>
              <span className="art-book-footer">BOOKSHELF EDITION</span>
            </div>

            <div className="art-note">
              <span className="art-note-icon">✳</span>
              <div>
                <strong>Your next chapter</strong>
                <span>Starts right here.</span>
              </div>
            </div>

            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✦</div>
          </div>

          <p className="showcase-footer">
            A little more order. A lot more room for stories.
          </p>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-mobile-brand">
              <span className="brand-mark" aria-hidden="true">
                B<span>.</span>
              </span>
              <strong>Bookshelf</strong>
            </div>

            <div className="auth-heading">
              <span className="eyebrow auth-eyebrow">
                {authMode === "register" ? "GET STARTED" : "WELCOME BACK"}
              </span>

              <h2>
                {authMode === "register"
                  ? "Create your account"
                  : "Good to see you."}
              </h2>

              <p>
                {authMode === "register"
                  ? "Set up your account and start building your personal library."
                  : "Sign in to pick up where your library left off."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <label className="field-label" htmlFor="auth-email">
                Email address
              </label>

              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  @
                </span>

                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={authForm.email}
                  onChange={handleAuthChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="password-label-row">
                <label className="field-label" htmlFor="auth-password">
                  Password
                </label>

                {authMode === "login" && (
                  <span className="field-hint">Welcome back</span>
                )}
              </div>

              <div className="input-shell">
                <span className="input-icon" aria-hidden="true">
                  ◈
                </span>

                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={
                    authMode === "register"
                      ? "At least 8 characters"
                      : "Enter your password"
                  }
                  value={authForm.password}
                  onChange={handleAuthChange}
                  autoComplete={
                    authMode === "register"
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {error && (
                <div className="notice notice-error" role="alert">
                  <span className="notice-symbol">!</span>
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="notice notice-success" role="status">
                  <span className="notice-symbol">✓</span>
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                className="primary-button auth-submit"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create my account"
                    : "Sign in to Bookshelf"}

                {!authLoading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="auth-switch">
              <span>
                {authMode === "register"
                  ? "Already have an account?"
                  : "New to Bookshelf?"}
              </span>

              <button
                type="button"
                className="inline-link"
                onClick={switchAuthMode}
              >
                {authMode === "register" ? "Sign in" : "Create an account"}
              </button>
            </div>

            <div className="auth-bottom-note">
              <span aria-hidden="true">✳</span>
              Your books. Your space. Your pace.
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Main library dashboard
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            B<span>.</span>
          </span>

          <div className="sidebar-brand-copy">
            <strong>Bookshelf</strong>
            <span>YOUR PERSONAL LIBRARY</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <div className="sidebar-nav-item active" aria-current="page">
          <span className="nav-icon" aria-hidden="true">
            ▤
          </span>
          <span>My library</span>
          <span className="nav-count">{books.length}</span>
        </div>

        <div className="sidebar-library-card">
          <div className="sidebar-library-icon" aria-hidden="true">
            ✳
          </div>

          <strong>A library of your own.</strong>

          <p>Every title you add has a place here.</p>

          <div className="sidebar-mini-stat">
            <span>BOOKS COLLECTED</span>
            <strong>{String(books.length).padStart(2, "0")}</strong>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-divider" />

          <div className="profile-row">
            <div className="avatar">{avatarLetter}</div>

            <div className="profile-details">
              <strong>Your account</strong>
              <span title={user?.email || ""}>{user?.email || "Reader"}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span aria-hidden="true">↗</span>
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="breadcrumb">
            <span>WORKSPACE</span>
            <span className="breadcrumb-separator">/</span>
            <strong>My library</strong>
          </div>

          <div className="topbar-profile">
            <span className="online-dot" />
            <span>Your library is personal</span>
            <div className="avatar topbar-avatar">{avatarLetter}</div>
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <span className="eyebrow dashboard-eyebrow">
              YOUR PERSONAL LIBRARY
            </span>

            <h1>Good books. Better organized.</h1>

            <p>Keep your collection close and your next read in sight.</p>
          </div>

          <div className="welcome-decoration" aria-hidden="true">
            <span>✳</span>
          </div>
        </section>

        {error && (
          <div className="notice notice-error dashboard-notice" role="alert">
            <span className="notice-symbol">!</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="notice notice-success dashboard-notice" role="status">
            <span className="notice-symbol">✓</span>
            <span>{message}</span>
          </div>
        )}

        <section className="stats-grid" aria-label="Library statistics">
          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-icon stat-icon-green">▤</span>
              <span className="stat-label">TOTAL COLLECTION</span>
            </div>

            <div className="stat-bottomline">
              <strong>{books.length}</strong>
              <span>{books.length === 1 ? "book" : "books"} saved</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-icon stat-icon-orange">✳</span>
              <span className="stat-label">GENRES EXPLORED</span>
            </div>

            <div className="stat-bottomline">
              <strong>{genres.length}</strong>
              <span>{genres.length === 1 ? "genre" : "genres"} recorded</span>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-icon stat-icon-blue">↗</span>
              <span className="stat-label">LATEST PUBLICATION</span>
            </div>

            <div className="stat-bottomline">
              <strong>{newestYear}</strong>
              <span>
                {newestYear === "—"
                  ? "No year recorded"
                  : "Year in your collection"}
              </span>
            </div>
          </article>
        </section>

        <section className="dashboard-layout">
          <div className="library-column">
            <div className="section-heading">
              <div>
                <span className="eyebrow section-eyebrow">YOUR SHELVES</span>
                <h2>Your collection</h2>
                <p>All the books you have saved in one place.</p>
              </div>

              <span className="collection-count">
                {books.length} {books.length === 1 ? "BOOK" : "BOOKS"}
              </span>
            </div>

            <div className="search-shell">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                aria-label="Search your books"
                placeholder="Search title, author or genre..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />

              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">✳</div>
                <h3>Opening your shelves...</h3>
                <p>Your collection is on its way.</p>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="book-grid">
                {filteredBooks.map((book) => {
                  const originalIndex = books.findIndex(
                    (item) => item._id === book._id,
                  );

                  const coverColor =
                    coverColors[
                      Math.max(originalIndex, 0) % coverColors.length
                    ];

                  return (
                    <article className="book-card" key={book._id}>
                      <div
                        className="book-cover"
                        style={{ "--cover-color": coverColor }}
                      >
                        <div className="cover-topline">
                          <span className="cover-brand">B.</span>
                          <span className="cover-number">
                            {String(Math.max(originalIndex, 0) + 1).padStart(
                              2,
                              "0",
                            )}
                          </span>
                        </div>

                        <div className="cover-copy">
                          <span className="cover-genre">
                            {book.genre || "GENERAL READING"}
                          </span>

                          <strong>{book.title}</strong>

                          <span className="cover-author">{book.author}</span>
                        </div>

                        <div className="cover-footer">
                          <span />
                          <span>BOOKSHELF EDITION</span>
                        </div>
                      </div>

                      <div className="book-card-details">
                        <div className="book-title-row">
                          <h3 title={book.title}>{book.title}</h3>

                          {book.year && (
                            <span className="book-year">{book.year}</span>
                          )}
                        </div>

                        <p className="book-author">by {book.author}</p>

                        <div className="book-card-footer">
                          <span className="genre-tag">
                            {book.genre || "Uncategorized"}
                          </span>

                          <div className="book-actions">
                            <button
                              type="button"
                              className="icon-button edit-action"
                              onClick={() => handleEdit(book)}
                              aria-label={`Edit ${book.title}`}
                              title="Edit book"
                            >
                              ✎
                            </button>

                            <button
                              type="button"
                              className="icon-button delete-action"
                              onClick={() => handleDelete(book._id)}
                              aria-label={`Delete ${book.title}`}
                              title="Delete book"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">▤</div>

                <h3>
                  {searchQuery
                    ? "No matching books"
                    : "Your next favorite belongs here."}
                </h3>

                <p>
                  {searchQuery
                    ? "Try another title, author or genre."
                    : "Start your collection by adding your first book using the form."}
                </p>

                {searchQuery && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            <p className="library-footnote">
              <span>✳</span>
              Every great collection starts with one book.
            </p>
          </div>

          <aside className="composer-panel">
            <div className="composer-header">
              <div className="composer-icon" aria-hidden="true">
                {editingId ? "✎" : "+"}
              </div>

              <div>
                <span className="eyebrow section-eyebrow">
                  {editingId ? "MAKE A CHANGE" : "GROW YOUR LIBRARY"}
                </span>

                <h2>{editingId ? "Edit book" : "Add a book"}</h2>
              </div>
            </div>

            <p className="composer-description">
              {editingId
                ? "Update the details of this title."
                : "Give a new addition its place on your shelves."}
            </p>

            <form className="book-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="book-title">
                  Book title <span>*</span>
                </label>
                <input
                  id="book-title"
                  name="title"
                  placeholder="e.g. Atomic Habits"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="book-author">
                  Author <span>*</span>
                </label>
                <input
                  id="book-author"
                  name="author"
                  placeholder="e.g. James Clear"
                  value={form.author}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="book-year">Publication year</label>
                <input
                  id="book-year"
                  name="year"
                  type="number"
                  min="0"
                  max="9999"
                  placeholder="e.g. 2018"
                  value={form.year}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="book-genre">Genre</label>
                <input
                  id="book-genre"
                  name="genre"
                  placeholder="e.g. Personal development"
                  value={form.genre}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="primary-button save-button">
                <span>{editingId ? "Save changes" : "Add to my library"}</span>
                <span aria-hidden="true">→</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button cancel-button"
                  onClick={cancelEdit}
                >
                  Cancel editing
                </button>
              )}
            </form>

            <div className="composer-tip">
              <span aria-hidden="true">✦</span>
              <p>
                <strong>A little tip</strong>
                Adding a genre makes it easier to browse your collection later.
              </p>
            </div>
          </aside>
        </section>

        <footer className="dashboard-footer">
          <span>BOOKSHELF</span>
          <span>
            Made for the love of books. <span aria-hidden="true">✳</span>
          </span>
        </footer>
      </main>
    </div>
  );
}
