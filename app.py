"""
FinPulse Expense Tracker - Flask Backend
"""
from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
load_dotenv()

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=PROJECT_DIR, static_url_path='')
CORS(app)

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS expenses (id SERIAL PRIMARY KEY, amount REAL NOT NULL, category TEXT NOT NULL, description TEXT, date TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS categories (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, icon TEXT, color TEXT)''')
    cursor.executemany('INSERT INTO categories (name, icon, color) VALUES (%s, %s, %s) ON CONFLICT (name) DO NOTHING',
        [('Food', 'restaurant', '#ff9100'), ('Transport', 'directions_car', '#2979ff'), ('Shopping', 'shopping_bag', '#00e676'),
         ('Bills', 'receipt_long', '#ff4081'), ('Entertainment', 'movie', '#ff4081'), ('Health', 'health_and_safety', '#00e676'),
         ('Other', 'more_horiz', '#727785')])
    cursor.execute('''CREATE TABLE IF NOT EXISTS savings_goals (id SERIAL PRIMARY KEY, name TEXT NOT NULL, target_amount REAL NOT NULL, current_amount REAL DEFAULT 0, deadline TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    cursor.execute('CREATE TABLE IF NOT EXISTS income (id INTEGER PRIMARY KEY, income REAL)')
    conn.commit()
    conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'FinPulse API'})

from routes.expenses import expenses_bp
from routes.analytics import analytics_bp
from routes.income import income_bp
from routes.goals import goals_bp

app.register_blueprint(expenses_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(income_bp)
app.register_blueprint(goals_bp)

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/script.js')
def serve_script():
    return app.send_static_file('script.js')

@app.route('/style.css')
def serve_style():
    return app.send_static_file('style.css')

init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
