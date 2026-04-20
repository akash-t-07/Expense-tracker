const form = document.getElementById("expense-form");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const description = document.getElementById("description");
const date = document.getElementById("date");
const submitBtn = document.getElementById("submit-btn");
const message = document.getElementById("message");

const filterCategory = document.getElementById("filter-category");
const sortOrder = document.getElementById("sort-order");
const expenseBody = document.getElementById("expense-body");
const total = document.getElementById("total");

let currentRequestKey = null;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(value);
}

function setMessage(text, ok = true) {
  message.textContent = text;
  message.style.color = ok ? "green" : "red";
}

async function loadCategories() {
  const res = await fetch("/api/categories");
  const data = await res.json();

  const selected = filterCategory.value;
  filterCategory.innerHTML = `<option value="">All</option>`;

  data.categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    filterCategory.appendChild(option);
  });

  filterCategory.value = selected;
}

async function loadExpenses() {
  const params = new URLSearchParams();

  if (filterCategory.value) params.append("category", filterCategory.value);
  if (sortOrder.value) params.append("sort", sortOrder.value);

  const res = await fetch(`/api/expenses?${params.toString()}`);
  const data = await res.json();

  total.textContent = formatCurrency(data.total);

  if (!data.expenses.length) {
    expenseBody.innerHTML = `<tr><td colspan="4">No expenses found</td></tr>`;
    return;
  }

  expenseBody.innerHTML = data.expenses.map((expense) => `
    <tr>
      <td>${expense.date}</td>
      <td>${expense.category}</td>
      <td>${expense.description}</td>
      <td>${formatCurrency(expense.amount)}</td>
    </tr>
  `).join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("");

  if (!currentRequestKey) {
    currentRequestKey = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": currentRequestKey
      },
      body: JSON.stringify({
        amount: amount.value,
        category: category.value,
        description: description.value,
        date: date.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add expense");
    }

    setMessage(
      data.duplicated
        ? "Duplicate request detected. Existing expense returned."
        : "Expense added successfully."
    );

    form.reset();
    date.value = new Date().toISOString().slice(0, 10);
    currentRequestKey = null;

    await loadCategories();
    await loadExpenses();
  } catch (err) {
    setMessage(err.message, false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Expense";
  }
});

filterCategory.addEventListener("change", loadExpenses);
sortOrder.addEventListener("change", loadExpenses);

date.value = new Date().toISOString().slice(0, 10);
loadCategories();
loadExpenses();
