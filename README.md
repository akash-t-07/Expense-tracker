# Expense Tracker (Full-Stack)

A minimal full-stack expense tracker built as part of a technical assessment.  
The goal is to demonstrate production-like thinking, correctness, and handling of real-world conditions (like retries and duplicate requests).

---

## 🚀 Features

- Add a new expense
  - amount
  - category
  - description
  - date
- View list of expenses
- Filter expenses by category
- Sort expenses by date (newest first)
- Display total of currently visible expenses
- Handles duplicate requests using **Idempotency-Key**

---

## 🧱 Tech Stack

- Backend: Node.js + Express
- Frontend: HTML, CSS, Vanilla JavaScript
- Storage: In-memory (for simplicity in time-boxed implementation)

---

## 📡 API Endpoints

### `POST /expenses`

Create a new expense.

#### Headers
