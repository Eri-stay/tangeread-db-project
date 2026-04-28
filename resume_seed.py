import requests
import time
import psycopg2
import sys
import io

# Force UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

ANILIST_URL = 'https://graphql.anilist.co'

QUERY_MANGA = 'query ($page: Int) { Page(page: $page, perPage: 50) { media(type: MANGA, sort: POPULARITY_DESC) { id title { english romaji } } } }'
QUERY_USERS = 'query ($page: Int) { Page(page: $page, perPage: 50) { reviews(mediaType: MANGA, sort: ID_DESC) { user { id name } } } }'
QUERY_USER_LIST = '''
query ($userId: Int) {
  MediaListCollection(userId: $userId, type: MANGA) {
    lists {
      status
      entries {
        mediaId
        score(format: POINT_10)
      }
    }
  }
}
'''

LIST_STATUS_MAP = {
    "CURRENT": "reading", "COMPLETED": "completed", "PAUSED": "on_hold",
    "DROPPED": "dropped", "PLANNING": "planned", "REPEATING": "rereading"
}

# Оновлений фрагмент make_request у resume_seed.py
def make_request(query, variables):
    try:
        res = requests.post(ANILIST_URL, json={'query': query, 'variables': variables}, timeout=15)
        
        # Якщо AniList лежить (код 503 або 500)
        if res.status_code in [500, 502, 503, 504]:
            print("[!] AniList Сервер недоступний (Down). Спробуйте пізніше.")
            return None

        data = res.json()
        if 'errors' in data:
            msg = data['errors'][0]['message']
            if "temporarily disabled" in msg:
                print("\n[!!!] КРИТИЧНО: AniList офіційно вимкнули свій API через нестабільність.")
                print("[!!!] Будь ласка, зачекайте кілька годин і спробуйте знову.\n")
                sys.exit(1) # Зупиняємо скрипт повністю
            print(f"[!] API Error: {msg}")
            return None
        return data
    except Exception as e:
        print(f"[!] Request error: {e}")
        return None


def main():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        print(f"Помилка підключення до БД: {e}")
        return

    print("--- ВІДНОВЛЕННЯ ПРОЦЕСУ ---")
    
    # 1. Відновлюємо мапу манг
    print("1. Пошук манг у базі...")
    db_manga_map = {}
    for page in range(1, 6):
        data = make_request(QUERY_MANGA, {"page": page})
        if data and data.get('data') and data['data'].get('Page') and data['data']['Page'].get('media'):
            for m in data['data']['Page']['media']:
                title = m['title'].get('english') or m['title'].get('romaji')
                cur.execute("SELECT id FROM mangas WHERE title_orig = %s", (title,))
                res = cur.fetchone()
                if res: db_manga_map[m['id']] = res[0]
        time.sleep(0.5)
    
    # 2. Відновлюємо мапу юзерів
    print(f"2. Пошук користувачів у базі (знайдено манг: {len(db_manga_map)})...")
    db_users = {}
    page = 1
    while len(db_users) < 1000 and page <= 60:
        data = make_request(QUERY_USERS, {"page": page})
        if data and data.get('data') and data['data'].get('Page') and data['data']['Page'].get('reviews'):
            for r in data['data']['Page']['reviews']:
                u = r['user']
                cur.execute("SELECT id FROM users WHERE username = %s", (u['name'],))
                res = cur.fetchone()
                if res:
                    db_users[u['id']] = res[0]
        page += 1
        if page % 10 == 0: print(f"   Обробка сторінки юзерів {page}...")
        time.sleep(0.5)

    # 3. КРОК 5
    print(f"3. Починаємо Крок 5 для {len(db_users)} користувачів...")
    for idx, (anilist_uid, db_uid) in enumerate(db_users.items()):
        if idx % 50 == 0:
            print(f"   Прогрес: {idx}/{len(db_users)}...")
            conn.commit()
            
        list_data = make_request(QUERY_USER_LIST, {"userId": anilist_uid})
        time.sleep(0.8)

        if not list_data or not list_data.get('data') or not list_data['data'].get('MediaListCollection'):
            continue

        for lst in list_data['data']['MediaListCollection']['lists']:
            status = LIST_STATUS_MAP.get(lst['status'], 'planned')
            for entry in lst['entries']:
                a_manga_id = entry['mediaId']
                if a_manga_id in db_manga_map:
                    db_m_id = db_manga_map[a_manga_id]
                    # Статус
                    cur.execute("INSERT INTO user_manga_statuses (user_id, manga_id, status, created_at) VALUES (%s, %s, %s, NOW()) ON CONFLICT DO NOTHING", (db_uid, db_m_id, status))
                    # Оцінка
                    if entry.get('score') and entry['score'] > 0:
                        cur.execute("INSERT INTO ratings (user_id, manga_id, score, created_at) VALUES (%s, %s, %s, NOW()) ON CONFLICT DO NOTHING", (db_uid, db_m_id, int(entry['score'])))
        
    conn.commit()
    cur.close()
    conn.close()
    print("Готово! База повністю наповнена.")

if __name__ == "__main__":
    main()
