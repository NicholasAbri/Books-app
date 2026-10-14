const configuredBooksUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/books";

// Preserve compatibility with your existing VITE_API_URL,
// which points to the /api/books endpoint.
const API_BASE_URL = configuredBooksUrl.replace(/\/books\/?$/, "");

const BOOKS_URL = `${API_BASE_URL}/books`;
const AUTH_URL = `${API_BASE_URL}/auth`;

async function request(url, options = {}) {
  const response = await fetch(url, options);

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Request failed");

    error.status = response.status;
    throw error;
  }

  return data;
}

function headers(token, includeJson = false) {
  const result = {};

  if (includeJson) {
    result["Content-Type"] = "application/json";
  }

  if (token) {
    result.Authorization = `Bearer ${token}`;
  }

  return result;
}

// Authentication
export function registerUser(credentials) {
  return request(`${AUTH_URL}/register`, {
    method: "POST",
    headers: headers(null, true),
    body: JSON.stringify(credentials),
  });
}

export function loginUser(credentials) {
  return request(`${AUTH_URL}/login`, {
    method: "POST",
    headers: headers(null, true),
    body: JSON.stringify(credentials),
  });
}

// Books
export function getBooks(token) {
  return request(BOOKS_URL, {
    headers: headers(token),
  });
}

export function addBook(book, token) {
  return request(BOOKS_URL, {
    method: "POST",
    headers: headers(token, true),
    body: JSON.stringify(book),
  });
}

export function updateBook(id, book, token) {
  return request(`${BOOKS_URL}/${id}`, {
    method: "PUT",
    headers: headers(token, true),
    body: JSON.stringify(book),
  });
}

export function deleteBook(id, token) {
  return request(`${BOOKS_URL}/${id}`, {
    method: "DELETE",
    headers: headers(token),
  });
}
