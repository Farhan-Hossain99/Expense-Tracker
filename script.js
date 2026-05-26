// FinPulse - Data Fetching & API Integration
const API_BASE = 'http://localhost:5000/api';
const CORE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other'];

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
    const [summary, expenses, categories, savingsGoals] = await Promise.all([
        fetchAPI('/analytics/summary'),
        fetchAPI('/expenses?limit=10'),
        fetchAPI('/categories'),
        fetchAPI('/savings-goals')
    ]);

    if (summary) updateSummaryCards(summary);
    if (expenses) updateTransactionsList(expenses.expenses);
    if (categories) updateCategoryData(categories.categories);
    if (savingsGoals) updateSavingsGoals(savingsGoals.savings_goals);
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

    // Update spending breakdown - map non-core categories to "Other"
    if (data.by_category && data.by_category.length > 0) {
        // Aggregate categories: non-core -> "Other"
        const aggregatedCategories = {};
        data.by_category.forEach(cat => {
            const normalizedCategory = CORE_CATEGORIES.includes(cat.category) ? cat.category : 'Other';
            if (aggregatedCategories[normalizedCategory]) {
                aggregatedCategories[normalizedCategory] += cat.total;
            } else {
                aggregatedCategories[normalizedCategory] = cat.total;
            }
        });

        const total = Object.values(aggregatedCategories).reduce((sum, val) => sum + val, 0);
        const categoryPercentages = {};
        Object.keys(aggregatedCategories).forEach(cat => {
            categoryPercentages[cat] = total > 0 ? ((aggregatedCategories[cat] / total) * 100).toFixed(0) : 0;
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
    }
}

function updateTransactionsList(expenses) {
    const container = document.querySelector('[data-transactions-list]');
    if (!container || !expenses) return;

    const categoryIcons = {
        'Food': 'restaurant',
        'Transport': 'directions_car',
        'Shopping': 'shopping_bag',
        'Bills': 'receipt_long',
        'Entertainment': 'movie',
        'Health': 'health_and_safety',
        'Other': 'more_horiz'
    };
    const categoryColors = {
        'Food': 'vibrant-orange',
        'Transport': 'vibrant-blue',
        'Shopping': 'vibrant-mint',
        'Bills': 'vibrant-pink',
        'Entertainment': 'vibrant-pink',
        'Health': 'vibrant-mint',
        'Other': 'outline'
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
    // Update category dropdown in modal - only show core categories
    const categorySelect = document.querySelector('[data-category-select]');
    if (categorySelect) {
        categorySelect.innerHTML = CORE_CATEGORIES.map(c =>
            `<option value="${c}">${c}</option>`
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
    let category = form.querySelector('[name="category"]').value;
    const description = form.querySelector('[name="description"]').value;
    const date = form.querySelector('[name="date"]').value;

    // Normalize category to core categories
    if (!CORE_CATEGORIES.includes(category)) {
        category = 'Other';
    }

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
            loadDashboardData();
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

function updateSavingsGoals(goals) {
    const container = document.querySelector('[data-savings-goals]');
    if (!container) return;
    
    if (!goals || goals.length === 0) {
        container.innerHTML = '<p class="font-body-md text-body-md text-on-surface-variant text-center py-8">No savings goals yet</p>';
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const progress = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);
        return `
            <div class="flex flex-col gap-2 p-4 bg-surface-container-high/30 rounded-xl">
                <div class="flex justify-between items-center">
                    <span class="font-title-lg text-title-lg text-on-surface">${goal.name}</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant">${goal.deadline || 'No deadline'}</span>
                </div>
                <div class="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div class="h-full bg-vibrant-mint rounded-full transition-all" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="flex justify-between">
                    <span class="font-label-sm text-label-sm text-secondary">$${goal.current_amount.toFixed(2)}</span>
                    <span class="font-label-sm text-label-sm text-on-surface-variant">of $${goal.target_amount.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    document.querySelectorAll('[data-add-expense-btn]').forEach(btn => {
        btn.addEventListener('click', openAddExpenseModal);
    });

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeAddExpenseModal);
    });

    const expenseForm = document.querySelector('[data-expense-form]');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleAddExpense);
    }

    const modal = document.querySelector('[data-add-expense-modal]');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAddExpenseModal();
        });
    }
});

// Export for external use
window.FinPulse = { loadDashboardData, loadExpenses, loadMonthlySummary };
