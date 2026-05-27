from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/api/expenses', methods=['GET'])
def get_expenses():
    conn = get_db()
    cursor = conn.cursor()
    month = request.args.get('month')
    category = request.args.get('category')
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)
    query = 'SELECT * FROM expenses WHERE user_id = 1'
    params = []
    if month:
        query += " AND TO_CHAR(date::date, 'YYYY-MM') = %s"
        params.append(month)
    if category:
        query += ' AND category = %s'
        params.append(category)
    query += ' ORDER BY date DESC, created_at DESC'
    if limit:
        query += ' LIMIT %s OFFSET %s'
        params.extend([limit, offset])
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    count_params = []
    count_query = 'SELECT COUNT(*) as count FROM expenses WHERE user_id = 1'
    if month:
        count_query += " AND TO_CHAR(date::date, 'YYYY-MM') = %s"
        count_params.append(month)
    if category:
        count_query += ' AND category = %s'
        count_params.append(category)
    cursor.execute(count_query, count_params if count_params else None)
    total = cursor.fetchone()['count']
    conn.close()
    return jsonify({'expenses': expenses, 'total': total, 'limit': limit, 'offset': offset})

@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE id = %s AND user_id = 1', (expense_id,))
    expense = cursor.fetchone()
    conn.close()
    if expense is None:
        return jsonify({'error': 'Expense not found'}), 404
    return jsonify(dict(expense))

@expenses_bp.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.get_json()
    if not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'amount, category, and date are required'}), 400
    try:
        amount = float(data['amount'])
        if amount <= 0:
            return jsonify({'error': 'amount must be positive'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'amount must be a valid number'}), 400
    core_categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other']
    category = data['category']
    if category not in core_categories:
        category = 'Other'
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO expenses (user_id, amount, category, description, date) VALUES (1, %s, %s, %s, %s)', (amount, category, data.get('description', ''), data['date']))
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': expense_id, 'amount': amount, 'category': category, 'description': data.get('description', ''), 'date': data['date'], 'message': 'Expense created successfully'}), 201

@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.get_json()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE id = %s AND user_id = 1', (expense_id,))
    existing = cursor.fetchone()
    if existing is None:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404
    updates = []
    params = []
    if 'amount' in data:
        try:
            amount = float(data['amount'])
            if amount <= 0:
                conn.close()
                return jsonify({'error': 'amount must be positive'}), 400
            updates.append('amount = %s')
            params.append(amount)
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'error': 'amount must be a valid number'}), 400
    if 'category' in data:
        updates.append('category = %s')
        params.append(data['category'])
    if 'description' in data:
        updates.append('description = %s')
        params.append(data['description'])
    if 'date' in data:
        updates.append('date = %s')
        params.append(data['date'])
    if not updates:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400
    params.append(expense_id)
    query = f"UPDATE expenses SET {', '.join(updates)} WHERE id = %s AND user_id = 1"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense updated successfully'})

@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE id = %s AND user_id = 1', (expense_id,))
    existing = cursor.fetchone()
    if existing is None:
        conn.close()
        return jsonify({'error': 'Expense not found'}), 404
    cursor.execute('DELETE FROM expenses WHERE id = %s AND user_id = 1', (expense_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Expense deleted successfully'})

@expenses_bp.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM categories ORDER BY name')
    categories = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'categories': categories})
