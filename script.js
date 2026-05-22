// FinPulse - Data Fetching & API Integration
const API_BASE = 'http://localhost:5000/api';

// ============ API HELPERS ============
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        return null;
    }
}

// ============ DATA FETCHING ============
async function loadDashboardData() {
    const [summary, expenses, categories] = await Promise.all([
        fetchAPI('/analytics/summary'),
        fetchAPI('/expenses?limit=10'),
        fetchAPI('/categories')
    ]);

    if (summary) updateSummaryCards(summary);
    if (expenses) updateTransactionsList(expenses.expenses);
    if (categories) updateCategoryData(categories.categories);
}

async function loadExpenses(limit = 20) {
    return await fetchAPI(`/expenses?limit=${limit}`);
}

async function loadMonthlySummary(month) {
    return await fetchAPI(`/analytics/summary?month=${month}`);
}

// ============ UPDATE UI FUNCTIONS ============
function updateSummaryCards(data) {
    const totalSpentEl = document.querySelector('[data-total-spent]');
    const monthlyExpensesEl = document.querySelector('[data-monthly-expenses]');
    const expenseCountEl = document.querySelector('[data-expense-count]');

    if (totalSpentEl) totalSpentEl.textContent = `$${data.total_spent.toFixed(2)}`;
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = `$${data.total_spent.toFixed(2)}`;
    if (expenseCountEl) expenseCountEl.textContent = data.expense_count;

    // Update spending breakdown percentages in the doughnut chart legend
    if (data.by_category && data.by_category.length > 0) {
        const total = data.by_category.reduce((sum, c) => sum + c.total, 0);
        const categoryPercentages = {};
        data.by_category.forEach(cat => {
            categoryPercentages[cat.category] = total > 0 ? ((cat.total / total) * 100).toFixed(0) : 0;
        });
        
        // Update legend percentages based on actual API data
        const legendItems = document.querySelectorAll('[data-category-legend]');
        legendItems.forEach(item => {
            const catName = item.getAttribute('data-category-legend');
            const pctEl = item.querySelector('.category-pct');
            if (pctEl && categoryPercentages[catName] !== undefined) {
                pctEl.textContent = `${categoryPercentages[catName]}%`;
            }
        });

        // Update doughnut center total
        const centerTotal = document.querySelector('.doughnut-total');
        if (centerTotal) centerTotal.textContent = `$${(total / 1000).toFixed(1)}k`;

        // Update the doughnut border colors based on actual categories
        const doughnut = document.querySelector('.doughnut-chart');
        if (doughnut && data.by_category.length >= 4) {
            const colors = ['#ff9100', '#d500f9', '#ff4081', '#2979ff', '#00e676'];
            let rotation = 45;
            const colorSize = 360 / data.by_category.length;
            data.by_category.forEach((cat, i) => {
                // For simplicity, we keep the CSS pie chart as fallback
            });
        }
    }
}

function updateTransactionsList(expenses) {
    const container = document.querySelector('[data-transactions-list]');
    if (!container || !expenses) return;

    const categoryIcons = {
        'Food': 'restaurant', 'Transport': 'directions_car', 'Shopping': 'shopping_bag',
        'Bills': 'receipt_long', 'Entertainment': 'movie', 'Health': 'health_and_safety', 'Other': 'more_horiz'
    };
    const categoryColors = {
        'Food': 'vibrant-orange', 'Transport': 'vibrant-blue', 'Shopping': 'vibrant-mint',
        'Bills': 'vibrant-pink', 'Entertainment': 'vibrant-pink', 'Health': 'vibrant-mint', 'Other': 'outline'
    };

    container.innerHTML = expenses.map(exp => {
        const icon = categoryIcons[exp.category] || 'more_horiz';
        const color = categoryColors[exp.category] || 'outline';
        const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
            <div class="flex items-center justify-between py-4 border-b border-surface-container-highest last:border-0 hover:bg-surface-container-low/50 px-2 rounded-lg transition-colors cursor-pointer">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-${color}/10 text-${color} flex items-center justify-center">
                        <span class="material-symbols-outlined">${icon}</span>
                    </div>
                    <div>
                        <p class="font-title-lg text-title-lg text-on-surface">${exp.description || exp.category}</p>
                        <p class="font-label-sm text-label-sm text-on-surface-variant">${date} • ${exp.category}</p>
                    </div>
                </div>
                <span class="font-title-lg text-title-lg text-on-background font-bold">-$${exp.amount.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

function updateCategoryData(categories) {
    // Update category dropdown in modal
    const categorySelect = document.querySelector('[data-category-select]');
    if (categorySelect && categories.length > 0) {
        categorySelect.innerHTML = categories.map(c =>
            `<option value="${c.name}">${c.name}</option>`
        ).join('');
    }
}

// ============ ADD EXPENSE MODAL ============
function openAddExpenseModal() {
    const modal = document.querySelector('[data-add-expense-modal]');
    if (modal) modal.classList.remove('hidden');
}

function closeAddExpenseModal() {
    const modal = document.querySelector('[data-add-expense-modal]');
    if (modal) modal.classList.add('hidden');
    resetExpenseForm();
}

function resetExpenseForm() {
    const form = document.querySelector('[data-expense-form]');
    if (form) form.reset();
}

async function handleAddExpense(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('[data-submit-expense]');

    const amount = parseFloat(form.querySelector('[name="amount"]').value);
    const category = form.querySelector('[name="category"]').value;
    const description = form.querySelector('[name="description"]').value;
    const date = form.querySelector('[name="date"]').value;

    if (!amount || !category || !date) {
        alert('Please fill in all required fields');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    try {
        const response = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, category, description, date })
        });

        if (response.ok) {
            closeAddExpenseModal();
            loadDashboardData(); // Refresh dashboard
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert('Failed to add expense. Is the server running?');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Expense';
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard data
    loadDashboardData();

    // Wire up Add Expense buttons
    document.querySelectorAll('[data-add-expense-btn]').forEach(btn => {
        btn.addEventListener('click', openAddExpenseModal);
    });

    // Wire up modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeAddExpenseModal);
    });

    // Wire up expense form
    const expenseForm = document.querySelector('[data-expense-form]');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleAddExpense);
    }

    // Close modal on backdrop click
    const modal = document.querySelector('[data-add-expense-modal]');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAddExpenseModal();
        });
    }
});

// Export for external use
window.FinPulse = { loadDashboardData, loadExpenses, loadMonthlySummary };