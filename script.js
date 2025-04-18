document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalAmount = document.getElementById("total-amount");
  const filterCategory = document.getElementById("filter-category");
  const generateMonthlyReportButton = document.getElementById("generate-monthly-report");
  const expenseCategory = document.getElementById("expense-category");
  const customCategoryInput = document.getElementById("custom-category");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  const predefinedCategories = ["Food", "Transport", "Entertainment", "Other"];

  // Populate category dropdown
  function populateCategoryDropdown() {
    expenseCategory.innerHTML = '<option value="" disabled selected>Select Category</option>';
    predefinedCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.innerText = category;
      expenseCategory.appendChild(option);
    });
  }

  populateCategoryDropdown();

  // Load expenses and display
  function loadExpenses() {
    displayExpenses(expenses);
    updateTotalAmount();
  }

  // Show or hide custom category input
  expenseCategory.addEventListener("change", () => {
    if (expenseCategory.value === "Other") {
      customCategoryInput.style.display = "block";
      customCategoryInput.required = true;
    } else {
      customCategoryInput.style.display = "none";
      customCategoryInput.required = false;
    }
  });

  // Snackbar Notification
  function showSnackbar(message) {
    let snackbar = document.getElementById("snackbar");
    if (!snackbar) {
      snackbar = document.createElement("div");
      snackbar.id = "snackbar";
      document.body.appendChild(snackbar);
    }
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => snackbar.className = snackbar.className.replace("show", ""), 3000);
  }

  // Submit form
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    let category = expenseCategory.value;
    const date = document.getElementById("expense-date").value;

    if (category === "Other") {
      category = customCategoryInput.value.trim();
      if (!category) {
        showSnackbar("Please enter a custom category.");
        return;
      }
    }

    const expense = {
      id: Date.now(),
      name,
      amount,
      category,
      date,
    };

    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    displayExpenses(expenses);
    updateTotalAmount();
    showSnackbar("Expense added!");
    expenseForm.reset();
    customCategoryInput.style.display = "none";
  });

  // Filter by category
  filterCategory.addEventListener("change", (e) => {
    const category = e.target.value;
    if (category === "All") {
      displayExpenses(expenses);
    } else {
      const filtered = expenses.filter((exp) => exp.category === category);
      displayExpenses(filtered);
    }
  });

  // Display list
  function displayExpenses(expList) {
    expenseList.innerHTML = "";
    expList.forEach((expense) => {
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

  // Total update
  function updateTotalAmount() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalAmount.textContent = total.toFixed(2);
  }

  // Delete / Edit
  expenseList.addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);
    if (e.target.classList.contains("delete-btn")) {
      expenses = expenses.filter((exp) => exp.id !== id);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      displayExpenses(expenses);
      updateTotalAmount();
      showSnackbar("Expense deleted!");
    }

    if (e.target.classList.contains("edit-btn")) {
      const expense = expenses.find((exp) => exp.id === id);
      document.getElementById("expense-name").value = expense.name;
      document.getElementById("expense-amount").value = expense.amount;
      document.getElementById("expense-date").value = expense.date;

      // Handle custom category
      if (predefinedCategories.includes(expense.category)) {
        expenseCategory.value = expense.category;
        customCategoryInput.style.display = "none";
        customCategoryInput.required = false;
      } else {
        expenseCategory.value = "Other";
        customCategoryInput.style.display = "block";
        customCategoryInput.value = expense.category;
        customCategoryInput.required = true;
      }

      expenses = expenses.filter((exp) => exp.id !== id);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      displayExpenses(expenses);
      updateTotalAmount();
      showSnackbar("Ready to update. Submit the form.");
    }
  });

  // Generate Monthly Report
  generateMonthlyReportButton.addEventListener("click", () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthName = new Date().toLocaleString("default", { month: "long" });

    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    if (monthlyExpenses.length === 0) {
      alert("No expenses for this month.");
      return;
    }

    const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) acc[expense.category] = 0;
      acc[expense.category] += expense.amount;
      return acc;
    }, {});

    const categories = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0', '#FF9800'];

    document.getElementById("report-title").textContent = "Monthly Expenses Report";
    document.getElementById("report-month").textContent = `Report for: ${monthName} ${currentYear}`;
    document.getElementById("total-expense").textContent =
      `Total Expense: ₹${values.reduce((sum, val) => sum + val, 0).toFixed(2)}`;

    const ctx = document.getElementById("expense-chart").getContext("2d");
    if (window.expenseChart) window.expenseChart.destroy();
    window.expenseChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: categories,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, categories.length),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });

    // Generate PDF
    setTimeout(() => {
      const reportContent = document.getElementById("report-content");
      reportContent.style.display = "block";

      html2canvas(reportContent).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Monthly_Report_${monthName}_${currentYear}.pdf`);
        reportContent.style.display = "none";
      });
    }, 1000);
  });

  loadExpenses();
});
