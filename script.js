// ==========================================
// CONFIG & CONSTANTS
// ==========================================
// GANTI URL DI BAWAH INI DENGAN WEB APP URL GOOGLE APPS SCRIPT KAMU
const API_URL = "https://script.google.com/macros/s/AKfycbwZTw33RJWsN6FjmjSbyWIBzf5f7dtNrEpGw30__s3EFqKkWjwFW_e17U8mhmZbtkov/exec";

const STORAGE_KEY = "moneytrack_transactions_v2";
const BUDGET_KEY = "moneytrack_monthly_budget";
const THEME_KEY = "moneytrack_theme";

const CATEGORY_META = {
  "Gaji": { icon: "💼" },
  "Kiriman Ortu": { icon: "👨‍👩‍👦" },
  "Freelance": { icon: "🧑‍💻" },
  "Makan": { icon: "🍜" },
  "Transport": { icon: "🛵" },
  "Belajar": { icon: "📚" },
  "Hiburan": { icon: "🎮" },
  "Tagihan": { icon: "🧾" },
  "Kost": { icon: "🏠" },
  "Investasi": { icon: "📈" },
  "Lainnya": { icon: "🗂️" },
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const form = document.getElementById("transactionForm");
const editingIdInput = document.getElementById("editingId");
const titleInput = document.getElementById("title");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const noteInput = document.getElementById("note");
const tableBody = document.getElementById("transactionTable");
const filterType = document.getElementById("filterType");
const sortBy = document.getElementById("sortBy");
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const balanceAmount = document.getElementById("balanceAmount");
const incomeAmount = document.getElementById("incomeAmount");
const expenseAmount = document.getElementById("expenseAmount");
const savingRateAmount = document.getElementById("savingRateAmount");
const categoryChart = document.getElementById("categoryChart");
const topCategoryBadge = document.getElementById("topCategoryBadge");
const exportBtn = document.getElementById("exportBtn");
const importInput = document.getElementById("importInput");
const clearAllBtn = document.getElementById("clearAllBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const dailyTrend = document.getElementById("dailyTrend");
const avgDailyExpense = document.getElementById("avgDailyExpense");
const transactionCount = document.getElementById("transactionCount");
const remainingBudget = document.getElementById("remainingBudget");
const budgetAmount = document.getElementById("budgetAmount");
const budgetBar = document.getElementById("budgetBar");
const budgetStatus = document.getElementById("budgetStatus");
const editBudgetBtn = document.getElementById("editBudgetBtn");
const budgetModal = document.getElementById("budgetModal");
const closeBudgetModal = document.getElementById("closeBudgetModal");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const tipTitle = document.getElementById("tipTitle");
const tipText = document.getElementById("tipText");

// ==========================================
// STATE MANAGEMENT
// ==========================================
const today = new Date();
dateInput.valueAsDate = today;
monthFilter.value = today.toISOString().slice(0, 7);

let transactions = getLocalTransactions();
let monthlyBudget = Number(localStorage.getItem(BUDGET_KEY)) || 1200000;

// ==========================================
// INITIALIZATION
// ==========================================
initTheme();
renderApp();
// Ambil data terbaru dari Google Sheets saat pertama dibuka
fetchFromGoogleSheets();

// ==========================================
// EVENT LISTENERS
// ==========================================
form.addEventListener("submit", handleSubmit);
filterType.addEventListener("change", renderTable);
sortBy.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);
monthFilter.addEventListener("change", renderApp);
exportBtn.addEventListener("click", exportToCSV);
importInput.addEventListener("change", importFromCSV);
clearAllBtn.addEventListener("click", clearAllData);
cancelEditBtn.addEventListener("click", resetFormMode);
themeToggle.addEventListener("click", toggleTheme);
editBudgetBtn.addEventListener("click", openBudgetModal);
closeBudgetModal.addEventListener("click", closeBudget);
saveBudgetBtn.addEventListener("click", saveBudget);

budgetModal.addEventListener("click", (event) => {
  if (event.target === budgetModal) closeBudget();
});

document.querySelectorAll(".quick-chip").forEach((button) => {
  button.addEventListener("click", () => autofillQuickTransaction(button.dataset.quick));
});

document.querySelectorAll(".menu a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".menu a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================
async function fetchFromGoogleSheets() {
  if (!API_URL || API_URL.includes("https://script.google.com/macros/s/AKfycbwZTw33RJWsN6FjmjSbyWIBzf5f7dtNrEpGw30__s3EFqKkWjwFW_e17U8mhmZbtkov/exec")) return;

  try {
    showToast("Mengambil data dari Google Sheets...");
    const response = await fetch(API_URL);
    const data = await response.json();

    if (Array.isArray(data)) {
      // Pemetaan langsung sesuai nama header di Google Sheets kamu
      transactions = data.map((item) => ({
        id: crypto.randomUUID(),
        title: item.title || "Transaksi Tanpa Nama",
        type: item.type === "income" ? "income" : "expense",
        amount: Number(item.amount || 0),
        category: item.category || "Lainnya",
        date: normalizeDate(item.date),
        note: item.note || "",
        createdAt: new Date().toISOString()
      }));

      saveLocalTransactions();
      renderApp();
      showToast("Data berhasil diperbarui dari Google Sheets!");
    }
  } catch (error) {
    console.error("Gagal sinkronisasi Google Sheets:", error);
    showToast("Gagal mengambil data dari Google Sheets, memakai data lokal.");
  }
}

async function sendToGoogleSheets(transaction) {
  if (!API_URL || API_URL.includes("URL_WEB_APP_APPS_SCRIPT_KAMU_DI_SINI")) return;

  // Format data sesuai dengan header spreadsheet kamu: date, title, category, type, amount, note
  const payload = {
    date: formatDateForApp(transaction.date),
    title: transaction.title,
    category: transaction.category,
    type: transaction.type, // 'income' atau 'expense'
    amount: transaction.amount,
    note: transaction.note
  };

  try {
    showToast("Menyimpan ke Google Sheets...");
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.status === "success") {
      showToast("Tersimpan di Google Sheets!");
    } else {
      showToast("Gagal simpan ke Cloud: " + result.message);
    }
  } catch (error) {
    console.error("Gagal kirim ke Google Sheets:", error);
    showToast("Gagal terhubung ke Cloud. Data tersimpan lokal.");
  }
}

function normalizeDate(dateVal) {
  if (!dateVal) return new Date().toISOString().slice(0, 10);

  // Jika input berupa string dan mengandung karakter garis miring "/" (contoh: "7/5/2026")
  if (typeof dateVal === 'string' && dateVal.includes('/')) {
    const parts = dateVal.split('/');
    if (parts.length === 3) {
      // Di Google Sheets, format default biasanya M/D/YYYY
      const month = parts[0].padStart(2, '0'); // Mengubah "7" jadi "07"
      const day = parts[1].padStart(2, '0');   // Mengubah "5" jadi "05"
      const year = parts[2];
      
      return `${year}-${month}-${day}`; // Menghasilkan "2026-07-05"
    }
  }

  // Jika formatnya sudah berupa Objek Date atau ISO String
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Fallback jika tanggal tidak valid
  return new Date().toISOString().slice(0, 10);
}

// ==========================================
// CORE APP FUNCTIONS
// ==========================================
async function handleSubmit(event) {
  event.preventDefault();

  const transaction = {
    id: editingIdInput.value || crypto.randomUUID(),
    title: titleInput.value.trim(),
    type: typeInput.value,
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
    note: noteInput.value.trim(),
    createdAt: editingIdInput.value ? getExistingCreatedAt(editingIdInput.value) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!transaction.title || transaction.amount <= 0 || !transaction.date) {
    showToast("Isi nama transaksi, nominal, dan tanggal dengan benar.");
    return;
  }

  if (editingIdInput.value) {
    transactions = transactions.map((item) => (item.id === editingIdInput.value ? transaction : item));
    showToast("Transaksi berhasil diedit.");
  } else {
    transactions.unshift(transaction);
    // Kirim data ke Cloud jika transaksi baru
    sendToGoogleSheets(transaction);
  }

  saveLocalTransactions();
  resetFormMode();
  renderApp();
}

function getExistingCreatedAt(id) {
  return transactions.find((item) => item.id === id)?.createdAt || new Date().toISOString();
}

function getLocalTransactions() {
  const newData = localStorage.getItem(STORAGE_KEY);
  if (newData) return JSON.parse(newData);
  return [];
}

function saveLocalTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function renderApp() {
  renderSummary();
  renderTable();
  renderCategoryChart();
  renderBudget();
  renderDailyTrend();
  renderExtraInsights();
}

function getPeriodTransactions() {
  const selectedMonth = monthFilter.value;
  if (!selectedMonth) return transactions;
  return transactions.filter((item) => item.date?.startsWith(selectedMonth));
}

function renderSummary() {
  const period = getPeriodTransactions();
  const income = sumByType(period, "income");
  const expense = sumByType(period, "expense");
  const balance = income - expense;
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  incomeAmount.textContent = formatCurrency(income);
  expenseAmount.textContent = formatCurrency(expense);
  balanceAmount.textContent = formatCurrency(balance);
  savingRateAmount.textContent = `${savingRate}%`;
}

function sumByType(data, type) {
  return data.filter((item) => item.type === type).reduce((sum, item) => sum + Number(item.amount), 0);
}

function renderTable() {
  const typeValue = filterType.value;
  const keyword = searchInput.value.toLowerCase();
  const selectedMonth = monthFilter.value;

  let filtered = transactions.filter((item) => {
    const matchType = typeValue === "all" || item.type === typeValue;
    const matchMonth = !selectedMonth || item.date?.startsWith(selectedMonth);
    const matchKeyword =
      item.title.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword) ||
      (item.note || "").toLowerCase().includes(keyword);

    return matchType && matchMonth && matchKeyword;
  });

  filtered = sortTransactions(filtered);

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--muted);padding:28px;">
          Tidak ada transaksi yang cocok.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered
    .map(
      (item) => `
      <tr>
        <td>${formatDate(item.date)}</td>
        <td>
          <strong>${escapeHTML(item.title)}</strong>
          ${item.note ? `<br><small style="color:var(--muted);">${escapeHTML(item.note)}</small>` : ""}
        </td>
        <td><span class="category-pill"><span class="category-mini-icon">${getCategoryIcon(item.category)}</span>${escapeHTML(item.category)}</span></td>
        <td><span class="badge ${item.type}">${item.type === "income" ? "Pemasukan" : "Pengeluaran"}</span></td>
        <td class="${item.type === "income" ? "amount-income" : "amount-expense"}">
          ${item.type === "income" ? "+" : "-"}${formatCurrency(item.amount)}
        </td>
        <td>
          <div class="action-cell">
            <button class="edit-btn" onclick="editTransaction('${item.id}')">Edit</button>
            <button class="delete-btn" onclick="deleteTransaction('${item.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

function sortTransactions(data) {
  const sorted = [...data];
  const value = sortBy.value;
  if (value === "newest") return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (value === "oldest") return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
  if (value === "highest") return sorted.sort((a, b) => b.amount - a.amount);
  if (value === "lowest") return sorted.sort((a, b) => a.amount - b.amount);
  return sorted;
}

function renderCategoryChart() {
  const expenses = getPeriodTransactions().filter((item) => item.type === "expense");

  if (expenses.length === 0) {
    categoryChart.className = "category-chart empty-state";
    categoryChart.textContent = "Belum ada data pengeluaran.";
    topCategoryBadge.textContent = "-";
    return;
  }

  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxValue = Math.max(...entries.map(([, value]) => value));
  const totalExpense = entries.reduce((sum, [, value]) => sum + value, 0);
  const [topCategory, topAmount] = entries[0];
  topCategoryBadge.textContent = `${getCategoryIcon(topCategory)} ${topCategory} • ${Math.round((topAmount / totalExpense) * 100)}%`;

  categoryChart.className = "category-chart";
  categoryChart.innerHTML = entries
    .map(([category, amount]) => {
      const width = Math.max(5, Math.round((amount / maxValue) * 100));
      const share = Math.round((amount / totalExpense) * 100);
      return `
        <div class="chart-row" title="${share}% dari total pengeluaran">
          <div class="chart-label">
            <span class="category-label-with-icon"><span class="category-mini-icon">${getCategoryIcon(category)}</span>${escapeHTML(category)} · ${share}%</span>
            <strong>${formatCurrency(amount)}</strong>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDailyTrend() {
  const period = getPeriodTransactions();
  if (period.length === 0) {
    dailyTrend.className = "daily-trend empty-state";
    dailyTrend.textContent = "Belum ada data tren.";
    return;
  }

  const grouped = period.reduce((acc, item) => {
    const day = item.date.slice(-2);
    acc[day] ||= { income: 0, expense: 0 };
    acc[day][item.type] += Number(item.amount);
    return acc;
  }, {});

  const entries = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
  const maxValue = Math.max(...entries.flatMap(([, value]) => [value.income, value.expense]), 1);

  dailyTrend.className = "daily-trend";
  dailyTrend.innerHTML = entries.map(([day, value]) => {
    const incomeHeight = Math.max(4, Math.round((value.income / maxValue) * 120));
    const expenseHeight = Math.max(4, Math.round((value.expense / maxValue) * 120));
    return `
      <div class="trend-day" title="Tgl ${day} | Masuk: ${formatCurrency(value.income)} | Keluar: ${formatCurrency(value.expense)}">
        <div class="trend-bars">
          <div class="trend-income" style="height:${incomeHeight}px"></div>
          <div class="trend-expense" style="height:${expenseHeight}px"></div>
        </div>
        <span>${day}</span>
      </div>
    `;
  }).join("");
}

function renderExtraInsights() {
  const period = getPeriodTransactions();
  const expenses = period.filter((item) => item.type === "expense");
  const totalExpense = sumByType(period, "expense");
  const uniqueExpenseDays = new Set(expenses.map((item) => item.date)).size || 1;
  const average = expenses.length ? totalExpense / uniqueExpenseDays : 0;
  const remaining = monthlyBudget - totalExpense;

  avgDailyExpense.textContent = formatCurrency(average);
  transactionCount.textContent = period.length;
  remainingBudget.textContent = formatCurrency(remaining);

  const expenseRatio = monthlyBudget > 0 ? totalExpense / monthlyBudget : 0;
  if (expenseRatio >= 1) {
    tipTitle.textContent = "Budget sudah lewat batas.";
    tipText.textContent = "Coba cek transaksi terbesar dan kategori dominan. Prioritaskan pengeluaran wajib dulu.";
  } else if (expenseRatio >= 0.8) {
    tipTitle.textContent = "Budget mulai menipis.";
    tipText.textContent = "Pengeluaran sudah melewati 80% budget. Kurangi kategori fleksibel seperti hiburan atau snack.";
  } else if (expenses.length > 0) {
    tipTitle.textContent = "Cashflow masih bisa dikontrol.";
    tipText.textContent = "Pantau kategori terbesar, karena biasanya kebocoran kecil muncul dari transaksi yang terlihat sepele.";
  } else {
    tipTitle.textContent = "Belum ada pengeluaran.";
    tipText.textContent = "Tambahkan transaksi pertama untuk mulai membaca pola cashflow.";
  }
}

function renderBudget() {
  const totalExpense = sumByType(getPeriodTransactions(), "expense");
  const percentage = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0;
  const remaining = monthlyBudget - totalExpense;

  budgetAmount.textContent = formatCurrency(monthlyBudget);
  budgetBar.style.width = `${percentage}%`;
  budgetStatus.textContent = `${percentage}% terpakai · sisa ${formatCurrency(remaining)}`;
}

function editTransaction(id) {
  const item = transactions.find((transaction) => transaction.id === id);
  if (!item) return;

  editingIdInput.value = item.id;
  titleInput.value = item.title;
  typeInput.value = item.type;
  amountInput.value = item.amount;
  categoryInput.value = item.category;
  dateInput.value = item.date;
  noteInput.value = item.note || "";
  formTitle.textContent = "Edit Transaksi";
  submitBtn.textContent = "Update Transaksi";
  cancelEditBtn.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteTransaction(id) {
  const isConfirmed = confirm("Yakin mau hapus transaksi ini dari tampilan lokal?");
  if (!isConfirmed) return;

  transactions = transactions.filter((item) => item.id !== id);
  saveLocalTransactions();
  renderApp();
  showToast("Transaksi dihapus secara lokal.");
}

function resetFormMode() {
  form.reset();
  editingIdInput.value = "";
  dateInput.valueAsDate = new Date();
  formTitle.textContent = "Tambah Transaksi";
  submitBtn.textContent = "Simpan Transaksi";
  cancelEditBtn.classList.add("hidden");
}

function autofillQuickTransaction(raw) {
  const [title, type, amount, category, note = ""] = raw.split("|");

  editingIdInput.value = "";
  titleInput.value = title;
  typeInput.value = type;
  amountInput.value = Number(amount);
  categoryInput.value = category;
  dateInput.value = new Date().toISOString().slice(0, 10);
  noteInput.value = note;

  formTitle.textContent = "Tambah Transaksi";
  submitBtn.textContent = "Simpan Transaksi";
  cancelEditBtn.classList.remove("hidden");

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  titleInput.focus();
  showToast(`${title} dimasukkan ke form. Bisa diedit dulu sebelum disimpan.`);
}

function exportToCSV() {
  const data = getPeriodTransactions();
  if (data.length === 0) {
    showToast("Belum ada data untuk diexport.");
    return;
  }

  const headers = ["date", "title", "category", "type", "amount", "note"];
  const rows = data.map((item) => headers.map((key) => `"${String(item[key] ?? "").replaceAll('"', '""')}"`).join(","));
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `moneytrack-${monthFilter.value || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV berhasil diexport.");
}

function importFromCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split(/\r?\n/).filter(Boolean);
    const [headerLine, ...rows] = lines;
    const headers = parseCSVLine(headerLine).map((header) => header.trim());

    const imported = rows.map((row) => {
      const values = parseCSVLine(row);
      const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
      return {
        id: crypto.randomUUID(),
        date: record.date || new Date().toISOString().slice(0, 10),
        title: record.title || "Imported transaction",
        category: record.category || "Lainnya",
        type: record.type === "income" ? "income" : "expense",
        amount: Number(record.amount) || 0,
        note: record.note || "Imported CSV",
        createdAt: new Date().toISOString(),
      };
    }).filter((item) => item.amount > 0);

    transactions = [...imported, ...transactions];
    saveLocalTransactions();
    renderApp();
    showToast(`${imported.length} transaksi berhasil diimport.`);
    importInput.value = "";
  };
  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function clearAllData() {
  const isConfirmed = confirm("Yakin mau hapus semua data transaksi di aplikasi lokal?");
  if (!isConfirmed) return;
  transactions = [];
  saveLocalTransactions();
  renderApp();
  showToast("Semua data transaksi lokal dihapus.");
}

function openBudgetModal() {
  budgetInput.value = monthlyBudget;
  budgetModal.classList.remove("hidden");
}

function closeBudget() {
  budgetModal.classList.add("hidden");
}

function saveBudget() {
  monthlyBudget = Math.max(0, Number(budgetInput.value) || 0);
  localStorage.setItem(BUDGET_KEY, String(monthlyBudget));
  closeBudget();
  renderApp();
  showToast("Budget berhasil diperbarui.");
}

function initTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "dark";
  document.body.classList.toggle("light", theme === "light");
  themeToggle.textContent = theme === "light" ? "Mode Gelap" : "Mode Terang";
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
  themeToggle.textContent = isLight ? "Mode Gelap" : "Mode Terang";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function getCategoryIcon(category) {
  return CATEGORY_META[category]?.icon || CATEGORY_META["Lainnya"].icon;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
