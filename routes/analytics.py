from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/summary', methods=['GET'])
def get_summary():
    month = request.args.get('month')
    if not month:
        month = datetime.now().strftime('%Y-%m')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COALESCE(SUM(amount), 0) as total_spent, COUNT(*) as expense_count FROM expenses WHERE user_id = 1 AND TO_CHAR(date::date, 'YYYY-MM') = %s", (month,))
    result = cursor.fetchone()
    total_spent = result['total_spent']
    expense_count = result['expense_count']
    cursor.execute("SELECT category, SUM(amount) as total FROM expenses WHERE user_id = 1 AND TO_CHAR(date::date, 'YYYY-MM') = %s GROUP BY category ORDER BY total DESC", (month,))
    by_category = [dict(row) for row in cursor.fetchall()]
    core_categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Other']
    aggregated = {}
    for cat in by_category:
        name = cat['category']
        if name not in core_categories:
            name = 'Other'
        aggregated[name] = aggregated.get(name, 0) + cat['total']
    by_category = [{'category': k, 'total': v} for k, v in aggregated.items()]
    conn.close()
    return jsonify({'month': month, 'total_spent': round(total_spent, 2), 'expense_count': expense_count, 'by_category': by_category})

@analytics_bp.route('/api/analytics/monthly', methods=['GET'])
def get_monthly_spending():
    months = request.args.get('months', 6, type=int)
    today = datetime.now()
    month_list = []
    for i in range(months - 1, -1, -1):
        d = today - timedelta(days=i * 30)
        month_list.append(d.strftime('%Y-%m'))
    conn = get_db()
    cursor = conn.cursor()
    results = []
    for month in month_list:
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = 1 AND TO_CHAR(date::date, 'YYYY-MM') = %s", (month,))
        result = cursor.fetchone()
        results.append({'month': month, 'total': round(result['total'], 2)})
    conn.close()
    return jsonify({'monthly_spending': results})
