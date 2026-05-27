from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

income_bp = Blueprint('income', __name__)

@income_bp.route('/api/income', methods=['GET'])
def get_income():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT income FROM income WHERE user_id = 1')
    row = cursor.fetchone()
    conn.close()
    if row is None or row['income'] is None:
        return jsonify({'income': 0})
    return jsonify({'income': row['income']})

@income_bp.route('/api/income', methods=['POST'])
def set_income():
    data = request.get_json()
    income = data.get('income', 0)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO income (user_id, income) VALUES (1, %s) ON CONFLICT (id) DO UPDATE SET income = %s', (income, income))
    conn.commit()
    conn.close()
    return jsonify({'income': income})

@income_bp.route('/api/income', methods=['DELETE'])
def delete_income():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM income WHERE user_id = 1')
    conn.commit()
    conn.close()
    return jsonify({'success': True})
