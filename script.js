document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalAmount = document.getElementById("total-amount");
  const filterCategory = document.getElementById("filter-category");
  const generateMonthlyReportButton = document.getElementById("generate-monthly-report");

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  const categories = ["Food", "Transport", "Entertainment", "Other"];

  const expenseCategory = document.getElementById("expense-category");
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.innerText = category;
    expenseCategory.appendChild(option);
  });

  function loadExpenses() {
    displayExpenses(expenses);
    updateTotalAmount();
  }

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

    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    displayExpenses(expenses);
    updateTotalAmount();
    expenseForm.reset();
  });

  filterCategory.addEventListener("change", (e) => {
    const category = e.target.value;
    if (category === "All") {
      displayExpenses(expenses);
    } else {
      const filtered = expenses.filter((exp) => exp.category === category);
      displayExpenses(filtered);
    }
  });

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

  function updateTotalAmount() {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalAmount.textContent = total.toFixed(2);
  }

  expenseList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.dataset.id);
      expenses = expenses.filter((exp) => exp.id !== id);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      displayExpenses(expenses);
      updateTotalAmount();
    }

    if (e.target.classList.contains("edit-btn")) {
      const id = parseInt(e.target.dataset.id);
      const expense = expenses.find((exp) => exp.id === id);

      document.getElementById("expense-name").value = expense.name;
      document.getElementById("expense-amount").value = expense.amount;
      document.getElementById("expense-category").value = expense.category;
      document.getElementById("expense-date").value = expense.date;

      expenses = expenses.filter((exp) => exp.id !== id);
      localStorage.setItem("expenses", JSON.stringify(expenses));
      displayExpenses(expenses);
      updateTotalAmount();
    }
  });

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
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9C27B0'];

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