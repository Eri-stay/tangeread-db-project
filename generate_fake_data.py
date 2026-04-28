import random
import psycopg2
import psycopg2.extras
import sys
import io
from datetime import datetime, timedelta

# Force UTF-8 для коректного виведення в консоль
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres", 
    "host": "localhost",
    "port": "5432"
}

# --- НАЛАШТУВАННЯ ---
# Якщо True, скрипт видалить всі старі оцінки та статуси перед генерацією нових.
# Якщо False, скрипт просто дозапише нові та оновить існуючі.
CLEAN_OLD_DATA = False 

STATUS_CHOICES =["reading", "completed", "planned", "on_hold", "dropped", "rereading"]
STATUS_WEIGHTS =[0.35, 0.40, 0.10, 0.05, 0.08, 0.02]

def get_weighted_date(days_ago=210):
    now = datetime.now()
    start = now - timedelta(days=days_ago)
    fraction = random.random() ** 0.6 
    delta_seconds = (now - start).total_seconds()
    return start + timedelta(seconds=delta_seconds * fraction)

def main():
    print("--- ГЕНЕРАТОР СИНТЕТИЧНИХ ДАНИХ (SMART RATINGS) ---")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Помилка підключення до БД: {e}")
        return

    if CLEAN_OLD_DATA:
        print("0. Очищення старих згенерованих даних...")
        cur.execute("TRUNCATE user_manga_statuses, ratings, reading_histories CASCADE;")
        conn.commit()

    # 1. Завантаження наявних даних
    print("1. Зчитування існуючих даних з БД...")
    
    cur.execute("SELECT id FROM users")
    users = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id FROM mangas")
    mangas = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT id FROM tags")
    tags = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT manga_id, tag_id FROM manga_tags")
    manga_tags = {}
    for mid, tid in cur.fetchall():
        if mid not in manga_tags:
            manga_tags[mid] = []
        manga_tags[mid].append(tid)

    cur.execute("SELECT id, manga_id FROM chapters ORDER BY chapter_number ASC")
    manga_chapters = {}
    for cid, mid in cur.fetchall():
        if mid not in manga_chapters:
            manga_chapters[mid] =[]
        manga_chapters[mid].append(cid)

    if not users or not mangas:
        print("Помилка: У базі немає юзерів або манг!")
        return

    # 2. Розподіл популярності та "базової якості" манг
    print("2. Обчислення глобальної популярності та об'єктивної якості манг...")
    manga_base_weights = {}
    manga_base_quality = {}
    
    random.shuffle(mangas) 
    total_mangas = len(mangas)
    
    for i, mid in enumerate(mangas):
        # Вага для ймовірності того, що мангу взагалі прочитають (Закон Ципфа)
        manga_base_weights[mid] = 100.0 / ((i + 1) ** 0.7)
        
        # Об'єктивна якість манги (Топ-1 має ~9.0, остання має ~6.5)
        # Це формує базовий бал, від якого будуть відштовхуватись юзери
        manga_base_quality[mid] = 9.0 - (i / total_mangas) * 2.5

    # 3. Генерація даних
    print("3. Генерація 'розумних' зв'язків (Списки, Оцінки, Історія читання)...")
    
    statuses_to_insert =[]
    ratings_to_insert = []
    history_to_insert =[]

    for uid in users:
        num_mangas = int(random.triangular(5, 150, 15))
        
        # User Bias: упередженість користувача (Нормальний розподіл Гаусса)
        # mean=0, std=1.0. Хтось в середньому ставить на бал вище, хтось на бал нижче.
        user_bias = random.gauss(0, 1.0)
        
        user_weights = []
        for mid in mangas:
            weight = manga_base_weights[mid]
            m_tags = manga_tags.get(mid,[])
            has_favorite_tag = any((uid % 5) == (t % 5) for t in m_tags)
            
            if has_favorite_tag:
                weight *= 6.0 
            user_weights.append(weight)

        chosen_mangas = set()
        attempts = 0
        while len(chosen_mangas) < num_mangas and attempts < num_mangas * 3:
            selection = random.choices(mangas, weights=user_weights, k=1)[0]
            chosen_mangas.add(selection)
            attempts += 1

        for mid in chosen_mangas:
            created_at = get_weighted_date()
            status = random.choices(STATUS_CHOICES, weights=STATUS_WEIGHTS, k=1)[0]
            is_favorite = random.random() < 0.1

            # 1. СТАТУСИ
            statuses_to_insert.append((uid, mid, status, is_favorite, created_at))

            # 2. ОЦІНКИ (Тільки для reading, completed, dropped)
            if status in ['reading', 'completed', 'dropped'] and random.random() < 0.7:
                m_tags = manga_tags.get(mid,[])
                has_favorite_tag = any((uid % 5) == (t % 5) for t in m_tags)
                
                # --- АЛГОРИТМ SMART RATING ---
                base_quality = manga_base_quality[mid]
                tag_modifier = 1.5 if has_favorite_tag else 0.0
                status_modifier = -2.5 if status == 'dropped' else (0.5 if status == 'completed' else 0.0)
                random_noise = random.gauss(0, 0.5) # Легка випадковість настрою в конкретний день
                
                raw_score = base_quality + user_bias + tag_modifier + status_modifier + random_noise
                
                # Обмежуємо оцінку від 1 до 10 і округлюємо
                score = max(1, min(10, int(round(raw_score))))
                
                rating_date = created_at + timedelta(days=random.randint(1, 10))
                if rating_date > datetime.now(): rating_date = datetime.now()
                
                ratings_to_insert.append((uid, mid, score, rating_date))

            # 3. ІСТОРІЯ ЧИТАННЯ
            if status in['reading', 'completed', 'on_hold', 'dropped']:
                chapters = manga_chapters.get(mid,[])
                if chapters:
                    last_chapter = random.choice(chapters)
                    history_date = created_at + timedelta(days=random.randint(0, 15))
                    if history_date > datetime.now(): history_date = datetime.now()
                    
                    history_to_insert.append((uid, mid, last_chapter, history_date))

    # 4. Масовий запис у БД (з DO UPDATE для ідемпотентності)
    print(f"4. Запис у БД: {len(statuses_to_insert)} статусів, {len(ratings_to_insert)} оцінок...")
    try:
        print("   [Інфо] Виправлення старих первинних ключів від GORM у таблиці reading_histories...")
        cur.execute("TRUNCATE reading_histories CASCADE;") # Очищаємо, щоб не було дублікатів при зміні
        cur.execute("ALTER TABLE reading_histories DROP CONSTRAINT IF EXISTS reading_histories_pkey CASCADE;")
        cur.execute("ALTER TABLE reading_histories ADD PRIMARY KEY (user_id, manga_id);")
        conn.commit()
    except Exception as e:
        print(f"   [Помилка при зміні ключа]: {e}")
        conn.rollback()
    
    insert_statuses_query = """
        INSERT INTO user_manga_statuses (user_id, manga_id, status, is_favorite, created_at)
        VALUES %s 
        ON CONFLICT (user_id, manga_id) DO UPDATE 
        SET status = EXCLUDED.status, is_favorite = EXCLUDED.is_favorite, created_at = EXCLUDED.created_at
    """
    psycopg2.extras.execute_values(cur, insert_statuses_query, statuses_to_insert, page_size=5000)

    insert_ratings_query = """
        INSERT INTO ratings (user_id, manga_id, score, created_at)
        VALUES %s 
        ON CONFLICT (user_id, manga_id) DO UPDATE 
        SET score = EXCLUDED.score, created_at = EXCLUDED.created_at
    """
    psycopg2.extras.execute_values(cur, insert_ratings_query, ratings_to_insert, page_size=5000)

    insert_history_query = """
        INSERT INTO reading_histories (user_id, manga_id, chapter_id, updated_at)
        VALUES %s 
        ON CONFLICT (user_id, manga_id) DO UPDATE 
        SET chapter_id = EXCLUDED.chapter_id, updated_at = EXCLUDED.updated_at
    """
    psycopg2.extras.execute_values(cur, insert_history_query, history_to_insert, page_size=5000)

    # 5. Оновлення дат існуючих манг та розділів
    print("5. Оновлення дат створення Манг та Розділів (розподіл на 7 місяців)...")
    for mid in mangas:
        m_date = get_weighted_date(days_ago=210)
        cur.execute("UPDATE mangas SET created_at = %s WHERE id = %s", (m_date, mid))
        
        chapters = manga_chapters.get(mid,[])
        current_ch_date = m_date
        
        for cid in chapters:
            current_ch_date += timedelta(days=random.randint(1, 7), hours=random.randint(2, 20))
            if current_ch_date > datetime.now():
                current_ch_date = datetime.now()
                
            cur.execute("UPDATE chapters SET created_at = %s WHERE id = %s", (current_ch_date, cid))

    # 6. Оновлюємо Materialized View
    print("6. Оновлення Materialized View для рейтингів...")
    try:
        cur.execute("REFRESH MATERIALIZED VIEW manga_stats_mv;")
    except Exception as e:
        print(f"   [Інфо] Materialized View не знайдено або не оновлено: {e}")
        conn.rollback()

    conn.commit()
    cur.close()
    conn.close()
    
    print("✅ ГОТОВО! Дані згенеровано та збережено.")

if __name__ == "__main__":
    main()