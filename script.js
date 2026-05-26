// FinPulse - Data Fetching & API Integration
const API_BASE = 'http://localhost:5000/api';
const CORE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other'];

// ============ CHART.JS DOUGHNUT COLORS ============
const DOUGHNUT_COLORS = {
    'Food': '#ff9100',
    'Transport': '#d500f9',
    'Entertainment': '#ff4081',
    'Shopping': '#2979ff',
    'Other': '#00e676'
};

let spendingChart = null;

// ============ CHART FUNCTIONS ============
function initDoughnutChart() {
    const ctx = document.getElementById('spendingDoughnut');
    if (!ctx) return;

    spendingChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return `$${value.toFixed(2)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateDoughnutChart(data) {
    if (!spendingChart) initDoughnutChart();
    if (!data || !data.by_category || data.by_category.length === 0) {
        if (spendingChart) {
            spendingChart.data.labels = [];
            spendingChart.data.datasets[0].data = [];
            spendingChart.data.datasets[0].backgroundColor = [];
            spendingChart.update();
        }
        const centerTotal = document.querySelector('.doughnut-total');
        if (centerTotal) centerTotal.textContent = '$0.00';
        return;
    }

    const total = data.by_category.reduce((sum, c) => sum + c.total, 0);
    const activeCategories = data.by_category.filter(c => c.total > 0);

    spendingChart.data.labels = activeCategories.map(c => c.category);
    spendingChart.data.datasets[0].data = activeCategories.map(c => c.total);
    spendingChart.data.datasets[0].backgroundColor = activeCategories.map(c => DOUGHNUT_COLORS[c.category] || '#888888');
    spendingChart.update();

    const centerTotal = document.querySelector('.doughnut-total');
    if (centerTotal) centerTotal.textContent = `$${total.toFixed(2)}`;
}

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

    if (summary) {
        updateSummaryCards(summary);
        updateDoughnutChart(summary);
    }
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
    const monthlyIncomeEl = document.querySelector('[data-monthly-income]');

    if (totalSpentEl) totalSpentEl.textContent = `$${data.total_spent.toFixed(2)}`;
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = `$${data.total_spent.toFixed(2)}`;
    if (monthlyIncomeEl) monthlyIncomeEl.textContent = `$${(data.total_spent * 1.5).toFixed(2)}`;

    if (data.by_category && data.by_category.length > 0) {
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

        const legendItems = document.querySelectorAll('[data-category-legend]');
        legendItems.forEach(item => {
            const catName = item.getAttribute('data-category-legend');
            const pctEl = item.querySelector('.category-pct');
            if (pctEl && categoryPercentages[catName] !== undefined) {
                pctEl.textContent = `${categoryPercentages[catName]}%`;
            }
        });

        updateDoughnutChart(data);
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
        'Food': 'orange-500',
        'Transport': 'blue-500',
        'Shopping': 'green-500',
        'Bills': 'pink-500',
        'Entertainment': 'pink-500',
        'Health': 'green-500',
        'Other': 'gray-500'
    };

    container.innerHTML = expenses.map(exp => {
        const icon = categoryIcons[exp.category] || 'more_horiz';
        const color = categoryColors[exp.category] || 'gray-500';
        const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const searchText = `${(exp.description || exp.category).toLowerCase()} ${exp.category.toLowerCase()}`;
        return `
            <div class="transaction-item flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer" data-search-text="${searchText}" data-category="${exp.category}" data-date="${exp.date}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-${color}/10 text-${color} flex items-center justify-center">
                        <span class="material-symbols-outlined">${icon}</span>
                    </div>
                    <div>
                        <p class="font-bold text-lg text-gray-800">${exp.description || exp.category}</p>
                        <p class="text-sm text-gray-500">${date} • ${exp.category}</p>
                    </div>
                </div>
                <span class="font-bold text-lg text-gray-800">-$${exp.amount.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');
    const list = document.getElementById('search-results-list');
    const count = document.getElementById('search-results-count');
    if (!container || !list) return;
    
    if (results.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    count.textContent = results.length + ' found';
    
    const iconMap = {
        'Food': 'restaurant',
        'Transport': 'directions_car',
        'Shopping': 'shopping_bag',
        'Entertainment': 'movie',
        'Other': 'more_horiz'
    };
    const colorMap = {
        'Food': 'bg-orange-100 text-orange-600',
        'Transport': 'bg-blue-100 text-blue-600',
        'Shopping': 'bg-green-100 text-green-600',
        'Entertainment': 'bg-pink-100 text-pink-600',
        'Other': 'bg-gray-100 text-gray-600'
    };
    
    const html = results.map(exp => {
        const icon = iconMap[exp.category] || 'more_horiz';
        const color = colorMap[exp.category] || 'bg-gray-100 text-gray-600';
        const date = new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return '<div class="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 px-3 rounded-lg transition-colors cursor-pointer"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full ' + color + ' flex items-center justify-center"><span class="material-symbols-outlined text-sm">' + icon + '</span></div><div><p class="font-semibold text-gray-800">' + (exp.description || exp.category) + '</p><p class="text-xs text-gray-500">' + date + ' • ' + exp.category + '</p></div></div><span class="font-bold text-gray-800">-$' + exp.amount.toFixed(2) + '</span></div>';
    }).join('');
    
    list.innerHTML = html;
    container.classList.remove('hidden');
}

function filterTransactions(searchTerm) {
    const search = searchTerm.toLowerCase().trim();
    const items = document.querySelectorAll('.transaction-item');
    const searchResultsSection = document.getElementById('search-results');
    
    if (!search) {
        searchResultsSection.classList.add('hidden');
        items.forEach(item => item.style.display = '');
        return;
    }
    
    const matchingExpenses = [];
    items.forEach(item => {
        const searchText = item.getAttribute('data-search-text') || '';
        const matches = searchText.includes(search);
        item.style.display = matches ? '' : 'none';
        if (matches) {
            const exp = {
                description: item.querySelector('p.font-bold')?.textContent || '',
                category: item.getAttribute('data-category') || '',
                amount: parseFloat(item.querySelector('span.font-bold')?.textContent.replace('$','').replace('-','') || 0),
                date: item.getAttribute('data-date') || new Date().toISOString().split('T')[0]
            };
            matchingExpenses.push(exp);
        }
    });
    
    renderSearchResults(matchingExpenses);
}

function updateCategoryData(categories) {
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
        container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No savings goals yet</p>';
        return;
    }

    container.innerHTML = goals.map(goal => {
        const progress = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);
        return `
            <div class="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-lg text-gray-800">${goal.name}</span>
                    <span class="text-sm text-gray-500">${goal.deadline || 'No deadline'}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full transition-all" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="flex justify-between">
                    <span class="text-sm text-green-600">$${goal.current_amount.toFixed(2)}</span>
                    <span class="text-sm text-gray-500">of $${goal.target_amount.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    initDoughnutChart();
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

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTransactions(e.target.value);
        });
    }
});

// Export for external use
window.FinPulse = { loadDashboardData, loadExpenses, loadMonthlySummary };
