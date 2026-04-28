import requests
import time
import random
import psycopg2
import sys
import io
from deep_translator import GoogleTranslator

# Force UTF-8 for output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# --- НАЛАШТУВАННЯ БАЗИ ДАНИХ ---
DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

# --- КОНСТАНТИ ---
ANILIST_URL = 'https://graphql.anilist.co'
DEFAULT_PASSWORD_HASH = "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa" 

translator = GoogleTranslator(source='auto', target='uk')
translation_cache = {}

def translate_text(text):
    if not text:
        return None
    if text in translation_cache:
        return translation_cache[text]
    try:
        translated = translator.translate(text)
        translation_cache[text] = translated
        return translated
    except Exception as e:
        print(f"[!] Помилка перекладу: {e}")
        return text

# --- GRAPHQL ЗАПИТИ ---
QUERY_MANGA = '''
query ($page: Int) {
  Page(page: $page, perPage: 50) {
    media(type: MANGA, sort: POPULARITY_DESC) {
      id title { english romaji } description format status startDate { year } coverImage { large } genres tags { name }
    }
  }
}
'''

QUERY_USERS = '''
query ($page: Int) {
  Page(page: $page, perPage: 50) {
    reviews(mediaType: MANGA, sort: ID_DESC) {
      user { id name avatar { large } }
    }
  }
}
'''

QUERY_USER_LIST = '''
query ($userId: Int) {
  MediaListCollection(userId: $userId, type: MANGA, sort: ADDED_TIME_DESC) {
    lists {
      status
      entries { score(format: POINT_10) mediaId }
    }
  }
}
'''

# --- МАПІНГ СТАТУСІВ ---
STATUS_MAP = {
    "RELEASING": "ongoing", "FINISHED": "completed", 
    "HIATUS": "hiatus", "CANCELLED": "cancelled", "NOT_YET_RELEASED": "ongoing"
}

FORMAT_MAP = {
    "MANGA": "manga", "MANHWA": "manhwa", "MANHUA": "manhua",
    "ONE_SHOT": "manga", "NOVEL": "oel", "OEL": "oel"
}

LIST_STATUS_MAP = {
    "CURRENT": "reading", "COMPLETED": "completed", "PAUSED": "on_hold",
    "DROPPED": "dropped", "PLANNING": "planned", "REPEATING": "rereading"
}

INTERNAL_ROLES = ["leader", "translator", "cleaner", "typer", "editor"]
TEAM_NAMES =[
    "Moonlight Scans", "UaManga Team", "Baka Translates", "Capybara Subs", 
    "Dark Fantasy UA", "Sunrise Scans", "Kyiv Manga Club", "Lviv Typerz",
    "Cosmic Scans", "Tea Time Translates", "Ninja Scans", "Witch Hat UA",
    "Dragon Scans", "Clover Team", "Maple Scans", "Ocean Subs",
    "Phantom Translates", "Starfall Scans", "Fox Team", "Zero Scans"
]

def make_request(query, variables):
    try:
        response = requests.post(ANILIST_URL, json={'query': query, 'variables': variables})
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            print(f"[!] Rate limit! Чекаємо {retry_after} секунд...")
            time.sleep(retry_after)
            return make_request(query, variables)
        
        data = response.json()
        if 'errors' in data:
            print(f"[!] AniList API Error: {data['errors'][0]['message']}")
            return None
        return data
    except Exception as e:
        print(f"[!] Request Exception: {e}")
        return None

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("1. Збираємо мангу...")
    mangas_data =[]
    for page in range(1, 5): # 200 манг
        data = make_request(QUERY_MANGA, {"page": page})
        if data and data.get('data') and data['data'].get('Page'):
            mangas_data.extend(data['data']['Page']['media'])
        time.sleep(1)

    print("2. Збираємо активних юзерів...")
    users_data = {}
    page = 1
    while len(users_data) < 1000 and page <= 50:
        data = make_request(QUERY_USERS, {"page": page})
        if data and data.get('data') and data['data'].get('Page'):
            for review in data['data']['Page']['reviews']:
                u = review['user']
                users_data[u['id']] = u
        page += 1
        time.sleep(0.5)
    
    users_list = list(users_data.values())[:1000]

    # --- ЗАПИС ЮЗЕРІВ ТА КОМАНД ---
    print(f"3. Збереження {len(users_list)} юзерів та створення команд...")
    db_users = {} # anilist_id -> db_id
    
    for i, u in enumerate(users_list):
        role = "author" if i < 150 else "reader"
        email = f"{u['name'].lower().replace(' ', '_')}@test.com"
        
        cur.execute("""
            INSERT INTO users (email, username, password_hash, avatar_url, role, is_banned, created_at)
            VALUES (%s, %s, %s, %s, %s, false, NOW())
            ON CONFLICT (username) DO NOTHING RETURNING id;
        """, (email, u['name'], DEFAULT_PASSWORD_HASH, u['avatar']['large'], role))
        
        res = cur.fetchone()
        if res:
            db_users[u['id']] = res[0]
        else:
            cur.execute("SELECT id FROM users WHERE username = %s", (u['name'],))
            db_users[u['id']] = cur.fetchone()[0]

    db_authors =[db_id for i, db_id in enumerate(db_users.values()) if i < 150]
    
    # Створюємо команди
    db_teams =[]
    for team_name in TEAM_NAMES:
        cur.execute("""
            INSERT INTO teams (name, description, created_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (name) DO NOTHING RETURNING id;
        """, (team_name, "Найкраща команда перекладачів українською!"))
        
        res = cur.fetchone()
        if res:
            db_teams.append(res[0])
        else:
            cur.execute("SELECT id FROM teams WHERE name = %s", (team_name,))
            db_teams.append(cur.fetchone()[0])

    # Розподіляємо авторів по командах
    team_members_map = {team_id: [] for team_id in db_teams} # team_id -> [user_id]
    for author_id in db_authors:
        team_id = random.choice(db_teams)
        internal_role = random.choice(INTERNAL_ROLES)
        team_members_map[team_id].append(author_id)
        
        cur.execute("""
            INSERT INTO team_members (user_id, team_id, internal_role)
            VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;
        """, (author_id, team_id, internal_role))

    # --- ЗАПИС МАНГИ ТА ТЕГІВ ---
    print("4. Переклад та збереження манг і тегів (це займе трохи часу)...")
    db_manga_map = {} # anilist_id -> db_id
    
    total_mangas = len(mangas_data)
    for idx, m in enumerate(mangas_data):
        title_orig = m['title'].get('english') or m['title'].get('romaji')
        print(f"[{idx+1}/{total_mangas}] Обробка: {title_orig}...")

        
        # Перекладаємо тільки назву (це швидко)
        title_ua = translate_text(title_orig)
        description = m['description'] if m['description'] else "Опис відсутній."
        
        status = STATUS_MAP.get(m['status'], 'ongoing')
        format_val = FORMAT_MAP.get(m['format'], 'manga')
        team_id = random.choice(db_teams)
        year = m['startDate']['year'] if m['startDate']['year'] else 2020


        cur.execute("""
            INSERT INTO mangas (title_ua, title_orig, description, cover_url, status, format, release_year, team_id, display_status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', NOW())
            RETURNING id;
        """, (title_ua, title_orig, description, m['coverImage']['large'], status, format_val, year, team_id))

        manga_id = cur.fetchone()[0]
        db_manga_map[m['id']] = manga_id

        # Збираємо теги
        tags = set(m.get('genres', []))
        for t in m.get('tags',[]):
            tags.add(t['name'])

        for tag_en in tags:
            tag_uk = translate_text(tag_en)
            cur.execute("""
                INSERT INTO tags (name, name_uk, name_en) VALUES (%s, %s, %s)
                ON CONFLICT (name_en) DO UPDATE SET name_en = EXCLUDED.name_en RETURNING id;
            """, (tag_en, tag_uk, tag_en))
            tag_id = cur.fetchone()[0]
            
            cur.execute("INSERT INTO manga_tags (manga_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (manga_id, tag_id))

        # Chapter logic
        num_chapters = random.randint(5, 25)
        team_users = team_members_map[team_id]
        for ch_num in range(1, num_chapters + 1):
            uploader_id = random.choice(team_users) if team_users else None
            pages_url = f"https://example.com/manga/{manga_id}/ch/{ch_num}/pages.zip"
            cur.execute("""
                INSERT INTO chapters (manga_id, chapter_number, uploader_id, display_status, view_count, created_at, pages_url)
                VALUES (%s, %s, %s, 'active', %s, NOW(), %s) ON CONFLICT DO NOTHING;
            """, (manga_id, float(ch_num), uploader_id, random.randint(10, 5000), pages_url))

        # Commit after each manga to show progress
        conn.commit()

    # --- ЗАПИС РЕЙТИНГІВ ТА СПИСКІВ ---
    print("5. Збір реальних списків юзерів (Оцінки та Статуси)...")
    for anilist_uid, u in users_data.items():
        if anilist_uid not in db_users:
            continue
            
        db_user_id = db_users[anilist_uid]
        list_data = make_request(QUERY_USER_LIST, {"userId": anilist_uid})
        time.sleep(0.8) # Rate limit protection

        if not list_data or 'errors' in list_data or not list_data['data']['MediaListCollection']:
            continue
            
        for lst in list_data['data']['MediaListCollection']['lists']:
            list_status = LIST_STATUS_MAP.get(lst['status'], 'planned')
            for entry in lst['entries']:
                anilist_manga_id = entry['mediaId']
                score = int(entry['score'])
                
                # only if manga exist in DB (Top 200)
                if anilist_manga_id in db_manga_map:
                    db_manga_id = db_manga_map[anilist_manga_id]
                    
                    cur.execute("""
                        INSERT INTO user_manga_statuses (user_id, manga_id, status, is_favorite, created_at)
                        VALUES (%s, %s, %s, false, NOW()) ON CONFLICT DO NOTHING;
                    """, (db_user_id, db_manga_id, list_status))
                    
                    if score > 0:
                        cur.execute("""
                            INSERT INTO ratings (user_id, manga_id, score, created_at)
                            VALUES (%s, %s, %s, NOW()) ON CONFLICT DO NOTHING;
                        """, (db_user_id, db_manga_id, score))

    conn.commit()
    cur.close()
    conn.close()
    print("the end!")

if __name__ == '__main__':
    main()