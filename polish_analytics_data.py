import random
import psycopg2
from datetime import datetime, timedelta

DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

def get_growth_date(days_ago=210):
    """
    Генерує дату з експоненціальним ростом.
    Степінь 1.8 забезпечує, що більшість дат буде ближче до сьогодні.
    """
    now = datetime.now()
    # Чим вища степінь, тим крутіший графік росту наприкінці
    fraction = random.random() ** 1.8 
    delta_days = days_ago * (1 - fraction)
    return now - timedelta(days=delta_days, hours=random.randint(0, 23))

def main():
    print("--- РАНДОМІЗАЦІЯ ДАНИХ ДЛЯ АНАЛІТИКИ ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Помилка підключення: {e}")
        return

    # 1. Отримуємо всіх користувачів, крім головного адміна
    cur.execute("SELECT id FROM users WHERE email != 'admin@gmail.com'")
    user_ids = [r[0] for r in cur.fetchall()]
    print(f"Обробка {len(user_ids)} користувачів...")

    for uid in user_ids:
        new_reg_date = get_growth_date()
        
        # Оновлюємо дату реєстрації користувача
        cur.execute("UPDATE users SET created_at = %s WHERE id = %s", (new_reg_date, uid))

        # Оновлюємо дати в закладках, щоб вони були ПІСЛЯ реєстрації
        # Додаємо від 1 години до 30 днів після реєстрації
        cur.execute("""
            UPDATE user_manga_statuses 
            SET created_at = %s + (random() * interval '30 days')
            WHERE user_id = %s
        """, (new_reg_date, uid))

        # Оновлюємо дати в оцінках
        cur.execute("""
            UPDATE ratings 
            SET created_at = %s + (random() * interval '30 days')
            WHERE user_id = %s
        """, (new_reg_date, uid))

    # 2. Також трохи підправимо дати створення команд
    print("Оновлення дат створення команд...")
    cur.execute("SELECT id FROM teams")
    team_ids = [r[0] for r in cur.fetchall()]
    for tid in team_ids:
        team_date = datetime.now() - timedelta(days=random.randint(100, 250))
        cur.execute("UPDATE teams SET created_at = %s WHERE id = %s", (team_date, tid))

    conn.commit()
    
    # 3. Оновлюємо Materialized View для актуальності статистики
    print("Оновлення статистики (Materialized View)...")
    try:
        cur.execute("REFRESH MATERIALIZED VIEW manga_stats_mv;")
        conn.commit()
    except:
        pass

    cur.close()
    conn.close()
    print("✅ Успіх! Тепер графіки в адмін-панелі покажуть ріст популярності.")

if __name__ == "__main__":
    main()