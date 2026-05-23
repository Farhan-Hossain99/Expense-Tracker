"""
FinPulse Expense Tracker - Flask Backend
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import sqlite3
import os

# Project root = directory containing app.py (no subdirectory)
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=PROJECT_DIR, static_url_path='')
CORS(app)

DATABASE = os.path.join(PROJECT_DIR, 'finpulse.db')


def get_db():
    """Get database connection with row factory."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            icon TEXT,
            color TEXT
        )
    ''')
    
    # Insert default categories if not exist
    default_categories = [
        ('Food', 'restaurant', '#ff9100'),
        ('Transport', 'directions_car', '#2979ff'),
        ('Shopping', 'shopping_bag', '#00e676'),
        ('Bills', 'receipt_long', '#ff4081'),
        ('Entertainment', 'movie', '#ff4081'),
        ('Health', 'health_and_safety', '#00e676'),
        ('Other', 'more_horiz', '#727785')
    ]
    
    cursor.executemany(
        'INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)',
        default_categories
    )

    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS savings_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert sample savings goals if table is empty
    cursor.execute('SELECT COUNT(*) FROM savings_goals')
    if cursor.fetchone()[0] == 0:
        sample_goals = [
            ('Emergency Fund', 5000, 1500, '2026-12-31'),
            ('Vacation', 3000, 800, '2026-08-01'),
            ('New Laptop', 2000, 1200, '2026-06-01')
        ]
        cursor.executemany(
            'INSERT INTO savings_goals (name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?)',
            sample_goals
        )
    
    conn.commit()
    conn.close()


# Initialize database on startup
init_db()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'service': 'FinPulse API'})


# ============ EXPENSE ENDPOINTS ============

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses with optional filtering."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Query params for filtering
    month = request.args.get('month')  # Format: YYYY-MM
    category = request.args.get('category')
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)
    
    query = 'SELECT * FROM expenses WHERE 1=1'
    params = []
    
    if month:
        query += ' AND strftime("%Y-%m", date) = ?'
        params.append(month)
    
    if category:
        query += ' AND category = ?'
        params.append(category)
    
    query += ' ORDER BY date DESC, created_at DESC'
    
    if limit:
        query += ' LIMIT ? OFFSET ?'
        params.extend([limit, offset])
    
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    
    # Get total count
    count_query = 'SELECT COUNT(*) as count FROM expenses WHERE 1=1' + (
        f' AND strftime("%Y-%m", date) = "{month}"' if month else ''
    ) + (f' AND category = "{category}"' if category else '')
    cursor.execute(count_query)
    total = cursor.fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'expenses': expenses,
        'total': total,
        'limit': limit,
        'offset': offset
    })


@app.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get a single expense by ID."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    expense = cursor.fetchone()
    conn.close()
    
    if expense is None:
        return jsonify({'error': 'Expense not found'}), 404
    
    return jsonify(dict(expense))


@app.route('/api/expenses', methods=['POST'])
def create_expense():
    """Create a new expense."""
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'amount, category, and date are required'}), 400
    
    # Validate amount is positive
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'amount must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'amount must be a valid number'}), 400
    
    # Validate category
    valid_categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
    if data['category'] not in valid_categories:
        return jsonify({'error': f'category must be one of: {", ".join(valid_categories)}'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        'INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)',
        (
            amount,
            data['category'],
            data.get('description', ''),
            data['date']
        )
    )
    
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': expense_id,
        'amount': amount,
        'category': data['category'],
        'description': data.get('description', ''),
        'date': data['date'],
        'message': 'Expense created successfully'
    }), 201


@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update an existing expense."""
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if expense exists
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    existing = cursor.fetchone()
    
    if existing is None:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404
    
    # Build update query dynamically
    updates = []
    params = []
    
    if 'amount' in data:
        try:
            amount = float(data['amount'])
            if amount <= 0:
                conn.close()
                return jsonify({'error': 'amount must be positive'}), 400
            updates.append('amount = ?')
            params.append(amount)
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'error': 'amount must be a valid number'}), 400
    
    if 'category' in data:
        valid_categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
        if data['category'] not in valid_categories:
            conn.close()
            return jsonify({'error': f'category must be one of: {", ".join(valid_categories)}'}), 400
        updates.append('category = ?')
        params.append(data['category'])
    
    if 'description' in data:
        updates.append('description = ?')
        params.append(data['description'])
    
    if 'date' in data:
        updates.append('date = ?')
        params.append(data['date'])
    
    if not updates:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400
    
    params.append(expense_id)
    query = f'UPDATE expenses SET {", ".join(updates)} WHERE id = ?'
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense updated successfully'})


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    existing = cursor.fetchone()
    
    if existing is None:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404
    
    cursor.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense deleted successfully'})


# ============ ANALYTICS ENDPOINTS ============

@app.route('/api/analytics/summary', methods=['GET'])
def get_summary():
    """Get summary for a specific month."""
    month = request.args.get('month')  # Format: YYYY-MM, defaults to current month
    
    if not month:
        month = datetime.now().strftime('%Y-%m')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Total spent this month
    cursor.execute('''
        SELECT COALESCE(SUM(amount), 0) as total_spent, COUNT(*) as expense_count
        FROM expenses
        WHERE strftime("%Y-%m", date) = ?
    ''', (month,))
    result = cursor.fetchone()
    
    total_spent = result['total_spent']
    expense_count = result['expense_count']
    
    # Spending by category for this month
    cursor.execute('''
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE strftime("%Y-%m", date) = ?
        GROUP BY category
        ORDER BY total DESC
    ''', (month,))
    by_category = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'month': month,
        'total_spent': round(total_spent, 2),
        'expense_count': expense_count,
        'by_category': by_category
    })


@app.route('/api/analytics/monthly', methods=['GET'])
def get_monthly_spending():
    """Get spending for the last N months."""
    months = request.args.get('months', 6, type=int)
    
    # Get the last N months
    today = datetime.now()
    month_list = []
    for i in range(months - 1, -1, -1):
        d = today - timedelta(days=i * 30)
        month_list.append(d.strftime('%Y-%m'))
    
    conn = get_db()
    cursor = conn.cursor()
    
    results = []
    for month in month_list:
        cursor.execute('''
            SELECT COALESCE(SUM(amount), 0) as total
            FROM expenses
            WHERE strftime("%Y-%m", date) = ?
        ''', (month,))
        result = cursor.fetchone()
        results.append({
            'month': month,
            'total': round(result['total'], 2)
        })
    
    conn.close()
    
    return jsonify({'monthly_spending': results})


# ============ CATEGORY ENDPOINTS ============

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM categories ORDER BY name')
    categories = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({'categories': categories})


# ============ SAVINGS GOALS ENDPOINTS ============

@app.route('/api/savings-goals', methods=['GET'])
def get_savings_goals():
    """Get all savings goals."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM savings_goals ORDER BY id')
    goals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'savings_goals': goals})


@app.route('/api/savings-goals/<int:goal_id>', methods=['PUT'])
def update_savings_goal(goal_id):
    """Update a savings goal (add contribution)."""
    data = request.get_json()
    
    if 'current_amount' in data:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE savings_goals SET current_amount = ? WHERE id = ?',
            (data['current_amount'], goal_id)
        )
        conn.commit()
        
        cursor.execute('SELECT * FROM savings_goals WHERE id = ?', (goal_id,))
        goal = dict(cursor.fetchone())
        conn.close()
        return jsonify({'savings_goal': goal})
    
    return jsonify({'error': 'Invalid update'}), 400



# ============ FRONTEND ROUTES ============

@app.route('/')
def serve_index():
    """Serve the main dashboard."""
    return app.send_static_file('index.html')

@app.route('/script.js')
def serve_script():
    return app.send_static_file('script.js')

@app.route('/style.css')
def serve_style():
    return app.send_static_file('style.css')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
