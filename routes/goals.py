from flask import Blueprint, request, jsonify
from psycopg2.extras import RealDictCursor
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

goals_bp = Blueprint('goals', __name__)

@goals_bp.route('/api/savings-goals', methods=['GET'])
def get_savings_goals():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM savings_goals WHERE user_id = 1 ORDER BY id')
    goals = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({'savings_goals': goals})

@goals_bp.route('/api/savings-goals/<int:goal_id>', methods=['PUT'])
def update_savings_goal(goal_id):
    data = request.get_json()
    if 'current_amount' in data:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE savings_goals SET current_amount = %s WHERE id = %s AND user_id = 1', (data['current_amount'], goal_id))
        conn.commit()
        cursor.execute('SELECT * FROM savings_goals WHERE id = %s AND user_id = 1', (goal_id,))
        goal = dict(cursor.fetchone())
        conn.close()
        return jsonify({'savings_goal': goal})
    return jsonify({'error': 'Invalid update'}), 400
