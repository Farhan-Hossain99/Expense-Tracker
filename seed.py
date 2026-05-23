"""
FinPulse Seed Script - Populate with realistic 30-day expense data
"""
import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = '/mnt/f/Expense Tracker/finpulse.db'

# Descriptions by category
DESCRIPTIONS = {
    'Food': ['Chipotle', 'Starbucks', 'Trader Joe\'s', 'DoorDash', 'Subway', 'Sweetgreen', 'Panera', 'Pizza Hut', 'McDonald\'s', 'Burger King', 'Whole Foods', 'Safeway', 'Kroger', 'Olive Garden', 'Domino\'s Pizza', 'Taco Bell', 'Chick-fil-A', 'Wendy\'s', 'Shake Shack', 'In-N-Out'],
    'Transport': ['Uber', 'Lyft', 'Shell Gas', 'Chevron', 'BP Gas', 'Metro Card Refill', 'Parking Garage', 'Toll Road', 'Car Wash', 'Jiffy Lube'],
    'Shopping': ['Amazon', 'Target', 'Walmart', 'Best Buy', 'IKEA', 'Home Depot', 'Nordstrom', 'Macy\'s', 'Nike', 'Apple Store', 'Costco', 'TJ Maxx'],
    'Bills': ['Rent Payment', 'Electric Bill', 'Internet Bill', 'Phone Bill', 'Water Bill', 'Gas Bill', 'Netflix', 'Spotify', 'Disney+', 'Hulu', 'YouTube Premium', 'iCloud Storage', 'Gym Membership'],
    'Entertainment': ['AMC Theaters', 'Regal Cinema', 'Bowling', 'Mini Golf', 'Arcade', 'Concert Tickets', 'Sports Game', 'Museum Pass', 'Zoo Tickets', 'Escape Room'],
    'Health': ['CVS Pharmacy', 'Walgreens', 'Doctor Visit', 'Dental Checkup', 'Eye Exam', 'Therapy Session', 'Vitamin Shoppe', 'Gym Membership', 'Yoga Class'],
    'Other': ['Coffee Shop', 'Convenience Store', 'Bookstore', 'Flower Shop', 'Pet Store', 'Online Purchase', 'Miscellaneous']
}

# Weekend categories (more spending)
WEEKEND_CATEGORIES = ['Food', 'Entertainment', 'Shopping']

def generate_expenses():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing expenses
    cursor.execute('DELETE FROM expenses')
    
    today = datetime.now()
    expenses = []
    
    for days_ago in range(30, 0, -1):
        date = (today - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        day_of_week = (today - timedelta(days=days_ago)).weekday()
        is_weekend = day_of_week >= 5
        
        # 3-7 expenses per day
        num_expenses = random.randint(3, 7) if is_weekend else random.randint(2, 5)
        
        for _ in range(num_expenses):
            # Weight categories
            if is_weekend:
                category = random.choice(WEEKEND_CATEGORIES + ['Other'] * 2)
            else:
                category = random.choice(['Food'] * 3 + ['Transport', 'Shopping', 'Bills', 'Other'])
            
            desc = random.choice(DESCRIPTIONS.get(category, DESCRIPTIONS['Other']))
            
            # Amount ranges by category
            if category == 'Food':
                amount = round(random.uniform(8, 65), 2)
            elif category == 'Transport':
                amount = round(random.uniform(10, 45), 2)
            elif category == 'Shopping':
                amount = round(random.uniform(20, 200), 2)
            elif category == 'Bills':
                amount = round(random.uniform(30, 200), 2)
            elif category == 'Entertainment':
                amount = round(random.uniform(15, 80), 2)
            elif category == 'Health':
                amount = round(random.uniform(20, 120), 2)
            else:
                amount = round(random.uniform(10, 50), 2)
            
            expenses.append((amount, category, desc, date))
    
    cursor.executemany(
        'INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)',
        expenses
    )
    conn.commit()
    
    # Print summary
    cursor.execute('SELECT COUNT(*) FROM expenses')
    total = cursor.fetchone()[0]
    cursor.execute('''
        SELECT category, COUNT(*), SUM(amount) 
        FROM expenses 
        GROUP BY category 
        ORDER BY SUM(amount) DESC
    ''')
    print(f"\n✅ Seeded {total} expenses across 30 days:")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]} transactions, ${row[2]:.2f}")
    
    conn.close()

if __name__ == '__main__':
    generate_expenses()
