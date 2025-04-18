document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalAmount = document.getElementById("total-amount");
  const filterCategory = document.getElementById("filter-category");
  const generateMonthlyReportButton = document.getElementById("generate-monthly-report");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];  // Load expenses from localStorage if available
  let categories = ["Food", "Transport", "Entertainment", "Other"];

  // Initialize category dropdown for expense
  const expenseCategory = document.getElementById("expense-category");
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.innerText = category;
    expenseCategory.appendChild(option);
  });

  // Load expenses from localStorage when the page loads
  function loadExpenses() {
    displayExpenses(expenses);
    updateTotalAmount();
  }

  // Handle expense form submission
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;
    const date = document.getElementById("expense-date").value;

    const expense = {
      id: Date.now(),
      name,
      amount,
      category,
      date,
    };

    expenses.push(expense);  // Add new expense to the array
    localStorage.setItem("expenses", JSON.stringify(expenses));  // Save to localStorage
    displayExpenses(expenses);  // Update UI
    updateTotalAmount();  // Update total amount
    expenseForm.reset();  // Reset the form
  });

  // Handle category filter
  filterCategory.addEventListener("change", (e) => {
    const category = e.target.value;
    if (category === "All") {
      displayExpenses(expenses);
    } else {
      const filteredExpenses = expenses.filter(
        (expense) => expense.category === category
      );
      displayExpenses(filteredExpenses);
    }
  });

  // Display the expenses
  function displayExpenses(expenses) {
    expenseList.innerHTML = "";
    expenses.forEach((expense) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${expense.name}</td>
        <td>₹${expense.amount.toFixed(2)}</td>
        <td>${expense.category}</td>
        <td>${expense.date}</td>
        <td>
          <button class="edit-btn" data-id="${expense.id}">Edit</button>
          <button class="delete-btn" data-id="${expense.id}">Delete</button>
        </td>
      `;
      expenseList.appendChild(row);
    });
  }

  // Update total expenses
  function updateTotalAmount() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    totalAmount.textContent = total.toFixed(2);
  }

  // Delete an expense
  expenseList.addEventListener("click", (e) => {
    // Check if the delete button was clicked
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id);  // Get the id of the expense
      expenses = expenses.filter((expense) => expense.id !== id);  // Remove the expense
      localStorage.setItem("expenses", JSON.stringify(expenses));  // Save the updated list to localStorage
      displayExpenses(expenses);  // Update the table
      updateTotalAmount();  // Update the total amount
    }

    // Check if the edit button was clicked
    if (e.target.classList.contains("edit-btn")) {
      const id = parseInt(e.target.dataset.id);  // Get the id of the expense
      const expense = expenses.find((expense) => expense.id === id);  // Find the expense to edit

      // Populate the form with the selected expense details
      document.getElementById("expense-name").value = expense.name;
      document.getElementById("expense-amount").value = expense.amount;
      document.getElementById("expense-category").value = expense.category;
      document.getElementById("expense-date").value = expense.date;

      // Remove the expense from the array (since it's being edited)
      expenses = expenses.filter((expense) => expense.id !== id);
      localStorage.setItem("expenses", JSON.stringify(expenses));  // Update the list in localStorage
      displayExpenses(expenses);  // Update the table
      updateTotalAmount();  // Update the total amount
    }
  });

  // Generate Monthly Report and create a PDF
  generateMonthlyReportButton.addEventListener("click", () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter expenses for the current month and year
    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      );
    });

    if (monthlyExpenses.length === 0) {
      alert("No expenses for this month.");
      return;
    }

    // Calculate total expenses by category
    const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add the title and report header
    doc.setFontSize(18);
    doc.text("Monthly Expense Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Report for: ${currentMonth + 1}-${currentYear}`, 20, 30);

    // List the category-wise expenses
    let yPosition = 40;
    Object.keys(categoryTotals).forEach((category) => {
      doc.text(`${category}: ₹${categoryTotals[category].toFixed(2)}`, 20, yPosition);
      yPosition += 10;
    });

    // Add total expenses
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    doc.text(`Total Expenses: ₹${totalExpenses.toFixed(2)}`, 20, yPosition + 10);

    // Save the PDF
    doc.save("monthly_report.pdf");
  });

  // Load expenses on page load
  loadExpenses();
});
