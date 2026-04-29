import random
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta

DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

def get_weighted_date(days_ago=210):
    now = datetime.now()
    start = now - timedelta(days=days_ago)
    fraction = random.random() ** 0.6 
    delta_seconds = (now - start).total_seconds()
    return start + timedelta(seconds=delta_seconds * fraction)

def main():
    print("--- ПОЛІРУВАННЯ РЕАЛЬНИХ ДАНИХ (ОПТИМІЗОВАНО) ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Помилка підключення: {e}")
        return

    # 1. Отримуємо список всіх манг
    cur.execute("SELECT id, cover_url FROM mangas")
    mangas = cur.fetchall()
    total_mangas = len(mangas)
    print(f"Знайдено манг для обробки: {total_mangas}")

    total_chapters_updated = 0

    for idx, (m_id, cover_url) in enumerate(mangas):
        # Оновлюємо дату самої манги
        manga_created_at = get_weighted_date(days_ago=210)
        cur.execute("UPDATE mangas SET created_at = %s WHERE id = %s", (manga_created_at, m_id))

        # Отримуємо розділи
        cur.execute("SELECT id, chapter_number FROM chapters WHERE manga_id = %s ORDER BY chapter_number ASC", (m_id,))
        chapters = cur.fetchall()

        current_ch_date = manga_created_at
        
        for ch_id, ch_num in chapters:
            current_ch_date += timedelta(days=random.randint(3, 7), hours=random.randint(1, 12))
            if current_ch_date > datetime.now():
                current_ch_date = datetime.now()

            has_pages = random.random() > 0.1

            if not has_pages:
                final_pages_value = f"https://placehold.co/800x1200/1a1a1a/white?text=Chapter+Coming+Soon+(Ch:+{ch_num})"
            else:
                final_pages_value = f"mangas/{m_id}/chapters/{ch_num}/"

            cur.execute("""
                UPDATE chapters 
                SET created_at = %s, pages_url = %s, view_count = %s
                WHERE id = %s
            """, (current_ch_date, final_pages_value, random.randint(50, 5000), ch_id))
            
            total_chapters_updated += 1

        # Виводимо прогрес кожні 20 манг і робимо Commit
        if (idx + 1) % 20 == 0:
            conn.commit()
            print(f"   Прогрес: {idx + 1}/{total_mangas} манг оброблено...")

    print("2. Оновлення статистики (Materialized View)...")
    try:
        cur.execute("REFRESH MATERIALIZED VIEW manga_stats_mv;")
        conn.commit()
    except Exception as e:
        print(f"Помилка оновлення View: {e}")

    cur.close()
    conn.close()
    
    print(f"✅ УСПІХ!")
    print(f"   Всього оновлено розділів: {total_chapters_updated}")

if __name__ == "__main__":
    main()