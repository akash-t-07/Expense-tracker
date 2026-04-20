import { Router } from "express";

const router = Router();

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

let expenses: Expense[] = [];
let nextId = 1;
const idempotencyMap = new Map<string, Expense>();

function isValidDate(dateString: unknown): boolean {
  if (!dateString || typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
}

router.post("/expenses", (req, res) => {
  const { amount, category, description, date } = req.body as Record<string, unknown>;
  const idempotencyKey = req.header("Idempotency-Key");

  if (!idempotencyKey || !idempotencyKey.trim()) {
    return res.status(400).json({ error: "Idempotency-Key header is required" });
  }

  if (idempotencyMap.has(idempotencyKey)) {
    return res.status(200).json({
      expense: idempotencyMap.get(idempotencyKey),
      duplicated: true,
    });
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Amount must be a positive number" });
  }

  if (!category || !String(category).trim()) {
    return res.status(400).json({ error: "Category is required" });
  }

  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: "Description is required" });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({ error: "Valid date is required" });
  }

  const expense: Expense = {
    id: nextId++,
    amount: Number(numericAmount.toFixed(2)),
    category: String(category).trim(),
    description: String(description).trim(),
    date: new Date(date as string).toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };

  expenses.push(expense);
  idempotencyMap.set(idempotencyKey, expense);

  return res.status(201).json({ expense, duplicated: false });
});

router.get("/expenses", (req, res) => {
  const { category, sort } = req.query as Record<string, string>;

  let result = [...expenses];

  if (category && category.trim()) {
    result = result.filter(
      (expense) => expense.category.toLowerCase() === category.trim().toLowerCase(),
    );
  }

  if (sort === "date_desc") {
    result.sort((a, b) => {
      if (a.date === b.date) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } else {
    result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  const total = result.reduce((sum, item) => sum + item.amount, 0);

  res.json({ expenses: result, total: Number(total.toFixed(2)) });
});

router.get("/categories", (req, res) => {
  const categories = [...new Set(expenses.map((e) => e.category))].sort();
  res.json({ categories });
});

export default router;
