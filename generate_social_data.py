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

MAIN_COMMENTS = [
    "Дуже крутий розділ!", "Боже, що за фінал...", "Малюнок просто неймовірний.",
    "Чекаю продовження з нетерпінням!", "Ця манга стає дедалі кращою.",
    "Хтось зрозумів, що сталося на 5-й сторінці?", "Мені шкода головного героя.",
    "Це шедевр, 10/10!", "Нарешті вони зустрілися!", "Тайтл топ, раджу всім.",
    "Переклад вогонь, дякую команді!", "Я плачу... чому так сумно?",
    "Який же антагоніст крутий у цій арці.", "Перечитую втретє і все одно цікаво."
]

REPLIES = [
    "Згоден на всі 100!", "Мені теж так здалося.", "Ні, ти помиляєшся, там все інакше.",
    "Ахаха, точно!", "Підтримую!", "Ти що, це ж найкращий момент!",
    "Ой, а я і не помітив спочатку.", "Це точно.", "База.", "+++"
]

def main():
    print("--- ГЕНЕРАЦІЯ СОЦІАЛЬНИХ ДАНИХ (БЕЗ UPDATED_AT) ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Помилка підключення: {e}")
        return

    # 1. Reading History
    print("1. Формування історії читання на основі закладок...")
    cur.execute("SELECT user_id, manga_id, status FROM user_manga_statuses WHERE status != 'planned'")
    user_manga_links = cur.fetchall()

    cur.execute("SELECT id, manga_id FROM chapters ORDER BY manga_id, chapter_number ASC")
    chapters_by_manga = {}
    for cid, mid in cur.fetchall():
        if mid not in chapters_by_manga:
            chapters_by_manga[mid] = []
        chapters_by_manga[mid].append(cid)

    history_data = []
    for uid, mid, status in user_manga_links:
        chaps = chapters_by_manga.get(mid)
        if not chaps:
            continue
        
        chapter_id = chaps[-1] if status == 'completed' else random.choice(chaps)
        history_data.append((uid, mid, chapter_id, datetime.now() - timedelta(days=random.randint(0, 180))))

    psycopg2.extras.execute_values(cur, """
        INSERT INTO reading_histories (user_id, manga_id, chapter_id, updated_at)
        VALUES %s ON CONFLICT (user_id, manga_id) DO UPDATE SET chapter_id = EXCLUDED.chapter_id
    """, history_data)
    print(f"   Записано {len(history_data)} записів історії.")

    # 2. Основні коментарі
    print("2. Генерація основних коментарів...")
    cur.execute("TRUNCATE comments RESTART IDENTITY CASCADE;")

    cur.execute("SELECT id FROM chapters ORDER BY RANDOM() LIMIT 500")
    active_chapters = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id FROM users LIMIT 300")
    active_users = [r[0] for r in cur.fetchall()]

    inserted_comment_ids = []
    for cid in active_chapters:
        for _ in range(random.randint(2, 6)):
            uid = random.choice(active_users)
            content = random.choice(MAIN_COMMENTS)
            date = datetime.now() - timedelta(days=random.randint(0, 150))
            
            # Використовуємо 5 колонок і 5 значень
            cur.execute("""
                INSERT INTO comments (user_id, chapter_id, content, display_status, created_at)
                VALUES (%s, %s, %s, 'active', %s) RETURNING id, chapter_id;
            """, (uid, cid, content, date))
            inserted_comment_ids.append(cur.fetchone())

    print(f"   Створено {len(inserted_comment_ids)} основних коментарів.")

    # 3. Відповіді (Nested comments)
    print("3. Створення відповідей (Nested)...")
    replies_data = []
    for parent_id, cid in inserted_comment_ids:
        if random.random() < 0.4:
            for _ in range(random.randint(1, 2)):
                uid = random.choice(active_users)
                content = random.choice(REPLIES)
                created_at = datetime.now() - timedelta(minutes=random.randint(1, 5000))
                
                # Кортеж з 6 значень для 6 колонок
                replies_data.append((uid, cid, parent_id, content, 'active', created_at))

    if replies_data:
        # Використовуємо 6 колонок: user_id, chapter_id, parent_id, content, display_status, created_at
        psycopg2.extras.execute_values(cur, """
            INSERT INTO comments (user_id, chapter_id, parent_id, content, display_status, created_at)
            VALUES %s
        """, replies_data)

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Успіх! Створено {len(replies_data)} вкладених відповідей.")

if __name__ == "__main__":
    main()