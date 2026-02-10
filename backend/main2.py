import psycopg2

# Guna DB_URL kau
DB_URL = "postgresql://postgres.uonphwbbgemsvqzrdcwp:Ika_15050107@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Tulis CSV terus
with open("C:/Users/awang/Documents/SDE22_Dashboard/sde22_jan2026.csv", "w", encoding="utf-8") as f:
    cur.copy_expert("""
        COPY (
            SELECT *
            FROM public.sde22
            WHERE "TransactionDateTime" >= '2026-01-01'
              AND "TransactionDateTime" < '2026-02-01'
            ORDER BY "TransactionDateTime"
        )
        TO STDOUT WITH CSV HEADER
    """, f)

cur.close()
conn.close()

print("✅ CSV siap: sde22_jan2026.csv")
