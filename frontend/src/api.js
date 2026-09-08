const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/books";

export async function getBooks() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
}

export async function addBook(book) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  if (!res.ok) throw new Error("Failed to add book");
  return res.json();
}

export async function updateBook(id, book) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  if (!res.ok) throw new Error("Failed to update book");
  return res.json();
}

export async function deleteBook(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete book");
  return res.json();
}
