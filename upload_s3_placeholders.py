import boto3
import psycopg2
import requests
from io import BytesIO

# --- НАЛАШТУВАННЯ (Візьми зі свого .env) ---
S3_CONFIG = {
    "endpoint_url": "https://75bd49196d86e56afa7b86afa4da8437.r2.cloudflarestorage.com/", # напр. https://<id>.r2.cloudflarestorage.com
    "aws_access_key_id": "83603c0bf49bcf5263a79738a100497b",
    "aws_secret_access_key": "5abec256b72c9b4d3386972ec22fab81c9aff277d9a399438d730f1a86a66e11",
    "bucket_name": "tangeread",
}

DB_CONFIG = {
    "dbname": "tangeread_c",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

def main():
    # 1. Підключення до S3
    s3 = boto3.client(
        's3',
        endpoint_url=S3_CONFIG["endpoint_url"],
        aws_access_key_id=S3_CONFIG["aws_access_key_id"],
        aws_secret_access_key=S3_CONFIG["aws_secret_access_key"],
    )

    # 2. Підключення до БД
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 3. Отримуємо всі шляхи до папок розділів
    print("Отримання списку розділів...")
    cur.execute("SELECT pages_url FROM chapters WHERE pages_url NOT LIKE 'http%'")
    paths = [r[0] for r in cur.fetchall()]
    print(f"Знайдено {len(paths)} папок для заповнення.")

    # 4. Підготовка плейсхолдерів (скачаємо один раз в пам'ять)
    print("Завантаження шаблонів сторінок...")
    placeholders = []
    for i in range(1, 4):
        resp = requests.get(f"https://placehold.co/800x1200/1a1a1a/white?text=Page+{i}")
        placeholders.append(resp.content)

    # 5. Завантаження на S3
    bucket = S3_CONFIG["bucket_name"]
    
    for idx, folder in enumerate(paths):
        # Очищуємо шлях (прибираємо зайві слеші на початку/в кінці)
        folder_clean = folder.strip("/")
        
        for p_num, content in enumerate(placeholders, 1):
            # Формуємо ім'я файлу: tangeread-media/mangas/1/chapters/1/page_1.jpg
            file_key = f"tangeread-media/{folder_clean}/page_{p_num}.jpg"
            
            try:
                s3.put_object(
                    Bucket=bucket,
                    Key=file_key,
                    Body=content,
                    ContentType='image/jpeg'
                )
            except Exception as e:
                print(f"Помилка завантаження {file_key}: {e}")

        if (idx + 1) % 50 == 0:
            print(f"Прогрес: {idx + 1}/{len(paths)} розділів заповнено...")

    print("✅ Успіх! Тепер у кожній папці на S3 є по 3 картинки.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()