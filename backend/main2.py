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
import csv
import io
import uvicorn
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
import re
from sqlalchemy import create_engine, text
import tempfile
import os
from datetime import datetime, timedelta
import pdfplumber

app = FastAPI()

# === ALLOW CORS UNTUK IONIC ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === DATABASE CONNECTION STRING GLOBAL ===
DB_URL = "postgresql://postgres.uonphwbbgemsvqzrdcwp:Ika_15050107@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
engine = create_engine(
    DB_URL,
    pool_size=40,       # kurang dari 48
    max_overflow=8,     # boleh tambah sementara bila perlu
    pool_timeout=30     # tunggu 30s kalau semua busy
)

# Folder simpan untuk hasil PDF->CSV
SAVE_TEST_FOLDER = r"C:\Users\awang\sde22_Dashboard\backend\test"
os.makedirs(SAVE_TEST_FOLDER, exist_ok=True)

# ---------- Helper untuk buang header yang tak perlu -------------
HEADER_REMOVE_PATTERNS = [
    r"PLAZA\s*:", r"DATE\s*:", r"TIME\s*:", r"PAGE\s*:",
    r"PLAZA COMPUTER SYSTEM", r"INDIVIDUAL TRANSACTION",
    r"PRINT NUMBER", r"Operational Date", r"Lane No",
    r"BOJ\s*:", r"EOJ\s*:", r"Plaza No", r"Job No",
    r"Badge No", r"Name", r"^-+$", r"SDEOF", r"PROGRAM:"
]

def clean_pdf_lines(text: str):
    """Buang header / lines tak perlu dari PDF"""
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if any(re.search(h, line) for h in HEADER_REMOVE_PATTERNS):
            continue
        cleaned.append(line)
    return cleaned

def is_valid_money_format(val):
    """Check if value is a valid monetary format (e.g., 13.50, 0.00, 100.00)"""
    if not val or val.strip() == "":
        return False
    return bool(re.fullmatch(r'\d+\.\d{2}', val.strip()))

def normalize_money(val):
    """Return numeric value as string with 2 decimals, or '0.00' if invalid or empty"""
    if not val or val.strip() == "":
        return "0.00"
    try:
        cleaned = re.sub(r"[^\d.-]", "", val)
        num = float(cleaned)
        return f"{num:.2f}"
    except (ValueError, TypeError):
        return "0.00"

def extract_plaza_no_from_text(text: str) -> str:
    """Cari Plaza No di header PDF. Kembalikan 3 digit atau '000' jika tak jumpa"""
    match = re.search(r'Plaza\s*No\s*:\s*(\d{3})', text)
    if match:
        return match.group(1)
    return "000"

def extract_lane_job_from_text(text: str):
    """
    Cari Lane No dan Job No dalam PDF header.
    Return dict: {"LaneNo": "XXX", "JobNo": "YYY"}
    Jika tak jumpa, return "N/A"
    """
    # Lane No boleh huruf+angka, contoh K04
    lane_match = re.search(r'Lane\s*No\s*:\s*([A-Za-z0-9]+)', text)
    # Job No biasanya nombor sahaja
    job_match = re.search(r'Job\s*No\s*:\s*(\d+)', text)

    lane_no = lane_match.group(1) if lane_match else "NULL"
    job_no = job_match.group(1) if job_match else "NULL"

    return {"LaneNo": lane_no, "JobNo": job_no}


def parse_transaction_line(line: str, plaza_no: str = "000"):
    """
    Parse satu baris transaksi PDF.
    Tambah plaza_no selepas FarePlaza.
    Return row + True/False
    """
    if len(line.strip()) < 10:
        return None, False

    # --- TrxNo ---
    match = re.match(r'^(\d+)', line)
    if not match:
        return None, False
    trx_no = match.group(1)

    # --- Date & Time ---
    dt_match = re.search(r'(\d{1,2}/\d{2}/\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)', line)
    if not dt_match:
        return None, False
    date_part = dt_match.group(1)
    time_part = dt_match.group(2)
    if len(time_part.split(":")) == 2:
        time_part += ":00"
    date_time = f"{date_part} {time_part}"

    # --- Remaining line ---
    start_pos = line.find(f"{date_part} {time_part}")
    if start_pos == -1:
        return None, False
    rest = line[start_pos + len(f"{date_part} {time_part}"):].strip()
    tokens = rest.split()

    # --- Default values ---
    origin = fare = card = trn = dtc = pay_mode = "NULL"
    fare_amount = "0.00"
    card_no = mfg = acc_type = vehicle = paid_amount = balance = code = remark = ""

    idx = 0

    # --- Origin & FarePlaza ---
    if idx < len(tokens) and re.fullmatch(r"\d{3}", tokens[idx]):
        origin = tokens[idx]; idx += 1
    if idx < len(tokens) and re.fullmatch(r"\d{3}", tokens[idx]):
        fare = tokens[idx]; idx += 1

    # ======================================================
    # FIXED SECTION: Card / Trn / Dtc (three single digits)
    # ======================================================

    seq = []            # collects up to 3 consecutive digits
    raw_segment = rest  # used to detect whitespace pattern

    # Helper to peek & consume tokens safely
    def peek():
        return tokens[idx] if idx < len(tokens) else None

    def consume():
        nonlocal idx
        v = tokens[idx]
        idx += 1
        return v

    # Collect up to 3 digit tokens
    while peek() and re.fullmatch(r"\d", peek()) and len(seq) < 3:
        seq.append(consume())

    # Detect patterns
    missing_trn = bool(re.search(r'(\d)(\s{2,})(\d)', raw_segment))
    missing_dtc = bool(re.search(r'(\d)(\d)(\s{2,})', raw_segment))
    ends_with_big_space = bool(re.search(r'\d\s{2,}$', raw_segment))

    # Apply mapping
    if len(seq) == 3:
        card, trn, dtc = seq

    elif len(seq) == 2:
        if missing_trn:
            card = seq[0]
            trn = "NULL"
            dtc = seq[1]
        elif missing_dtc or ends_with_big_space:
            card = seq[0]
            trn = seq[1]
            dtc = "NULL"
        else:
            card = "NULL"
            trn = seq[0]
            dtc = seq[1]

    elif len(seq) == 1:
        card = "NULL"
        trn = "NULL"
        dtc = seq[0]

    else:
        card = trn = dtc = "NULL"

    # --- PayMode ---
    if idx < len(tokens) and tokens[idx].isalpha():
        pay_mode = tokens[idx]; idx += 1

    # --- FareAmount ---
    if idx < len(tokens) and is_valid_money_format(tokens[idx]):
        fare_amount = normalize_money(tokens[idx]); idx += 1

    # --- CardNo ---
    if idx < len(tokens):
        card_no = tokens[idx]; idx += 1

    # Mfg/Tag Id (long number)
    if idx < len(tokens):
        tag_id = tokens[idx]; idx += 1
    else:
        tag_id = "NULL"

    # Paid Amount (money format)
    if idx < len(tokens):
        raw_amt = tokens[idx]
        if is_valid_money_format(raw_amt):
            paid_amount = normalize_money(raw_amt)
        idx += 1
    else:
        paid_amount = "0.00"

    # Balance (money format)
    if idx < len(tokens):
        raw_amt = tokens[idx]
        if is_valid_money_format(raw_amt):
            balance = normalize_money(raw_amt)
        idx += 1
    else:
        balance = "0.00"

    # --- Build final row ---
    row = [
        trx_no, date_time,
        origin, fare, plaza_no,  # <-- tambah PlazaNo di sini
        card, trn, dtc,
        pay_mode, fare_amount,
        card_no, tag_id,
        paid_amount, balance,
    ]

    if origin == "NULL" or fare == "NULL":
        return None, False

    return row, True

# === FUNGSI PEMBERSIH HEADER ===
def clean_header(col):
    col = str(col)
    col = re.sub(r"\s+", "", col)
    col = re.sub(r"&|/|\(|\)|\\n|RM", "", col, flags=re.IGNORECASE)
    return col

# === FUNGSI TARIKH 6AM-TO-6AM ===
def parse_date_range(start_date, end_date, filter_6am=True):
    if start_date and not end_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d") + (timedelta(hours=6) if filter_6am else timedelta())
        end_dt = start_dt + timedelta(days=1)
    elif start_date and end_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d") + (timedelta(hours=6) if filter_6am else timedelta())
        end_dt = datetime.strptime(end_date, "%Y-%m-%d") + (timedelta(hours=6) if filter_6am else timedelta(days=1))
    else:
        now = datetime.now()
        start_dt = (now - timedelta(days=2)).replace(hour=6 if filter_6am else 0, minute=0, second=0)
        end_dt = now.replace(hour=6 if filter_6am else 23, minute=0 if filter_6am else 59, second=0 if filter_6am else 59)
    return start_dt, end_dt

# === /upload ENDPOINT ===
@app.post("/upload")
async def upload_csv(files: list[UploadFile] = File(...), preview: bool = Query(False)):
    """
    preview=True → hanya tapis & simpan CSV
    preview=False → tapis + masukkan ke database
    """
    try:
        dfs = []
        for file in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name

            temp = pd.read_csv(tmp_path, header=None, dtype=str, encoding='utf-8', skip_blank_lines=True)
            row6 = temp.iloc[5].fillna("")
            row7 = temp.iloc[6].fillna("")

            combined_header = []
            for h6, h7 in zip(row6, row7):
                combined_header.append(str(h7).strip() or str(h6))

            temp.columns = combined_header
            temp = temp.iloc[7:].reset_index(drop=True)
            dfs.append(temp)
            os.remove(tmp_path)

        # === GABUNG SEMUA CSV ===
        df = pd.concat(dfs, ignore_index=True)
        df.columns = [clean_header(c) for c in df.columns]

        # Buang column tak perlu
        drop_cols = ["Exit", "Class", "Exceptional"]
        df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors='ignore')

        # Susunan column akhir
        final_cols = [
            "TrxNo", "PlazaNo", "LaneNo", "EntryPlaza", "JobNo", "TransactionDateTime",
            "Trx", "AVC", "PaymentMode", "FareAmount", "MfgNoTagID", "PaidAmount",
            "Balance", "AccountType", "VehicleNo", "Code", "Remark", "PenaltyCode"
        ]
        final_cols = [c for c in final_cols if c in df.columns]
        df = df[final_cols]

        # === PEMBERSIH NILAI NUMERIC ===
        money_cols = ["FareAmount", "PaidAmount", "Balance"]
        for col in money_cols:
            if col in df.columns:
                df[col] = (
                    df[col]
                    .astype(str)
                    .replace(r"[^\d.\-]", "", regex=True)
                    .replace(r"^\s*$", np.nan, regex=True)
                )
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

        # === FORMAT SEMULA TARIKH ===
        if "TransactionDateTime" in df.columns:
            df["TransactionDateTime"] = (
                df["TransactionDateTime"]
                .astype(str)
                .str.replace(r"\s*(AM|PM)", "", regex=True)
                .str.strip()
            )
            df["TransactionDateTime"] = pd.to_datetime(df["TransactionDateTime"], dayfirst=True, errors="coerce")
            df["TransactionDateTime"] = df["TransactionDateTime"].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Bersih whitespace & nilai kosong
        df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
        df.replace(
            ["", " ", "NaN", "nan", "NULL", "null", "None", "N/A", "-", "--"],
            np.nan,
            inplace=True,
        )

        non_numeric_cols = [c for c in df.columns if c not in money_cols]
        df[non_numeric_cols] = df[non_numeric_cols].fillna("NULL")

        # === AMBIL DATA SEDIA ADA ===
        try:
            existing_df = pd.read_sql("SELECT * FROM public.sde22", engine)
        except Exception:
            existing_df = pd.DataFrame(columns=df.columns)

        # === SAMAKAN STRUKTUR ===
        for col in df.columns:
            if col not in existing_df.columns:
                existing_df[col] = np.nan
        existing_df = existing_df[df.columns]

        # === TUKAR SEMUA KE STRING ===
        df = df.astype(str)
        existing_df = existing_df.astype(str)

        # === BUANG DUPLIKAT (PERBANDINGAN PENUH SATU BARIS) ===
        merged_df = df.merge(
            existing_df.drop_duplicates(),
            on=list(df.columns),
            how='left',
            indicator=True
        )
        new_rows = merged_df[merged_df['_merge'] == 'left_only'].drop(columns=['_merge'])

        # === SIMPAN CSV HASIL TAPIS ===
        save_folder = r"C:\Users\awang\SDE22_Dashboard\backend\test"
        os.makedirs(save_folder, exist_ok=True)
        temp_csv_path = os.path.join(save_folder, "filtered_new_rows_TNG.csv")
        new_rows.to_csv(temp_csv_path, index=False, encoding='utf-8-sig')

        if new_rows.empty:
            return {
                "status": "success",
                "rows": 0,
                "message": "Semua data telah wujud, tiada data baru dimasukkan."
            }

        # === KALAU MODE PREVIEW ===
        if preview:
            return {
                "status": "preview",
                "rows": len(new_rows),
                "message": f"{len(new_rows)} rekod baru ditemui (belum dimasukkan)."
            }

        # === DAPATKAN ID BERDASARKAN DB ===
        with engine.begin() as conn:
            result = conn.execute(text("SELECT COALESCE(MAX(id), 0) FROM public.sde22"))
            current_max_id = result.scalar()

        # === ASSIGN ID BARU ===
        new_rows = new_rows.copy()
        new_rows.insert(0, "id", range(current_max_id + 1, current_max_id + 1 + len(new_rows)))

        # === TAMBAH COLUMN ORIGINPLAZA & CardNo ===
        for col in ["OriginPlaza", "CardNo"]:
            if col not in new_rows.columns:
                new_rows[col] = "NULL"

        # === MASUKKAN DATA BARU KE DB ===
        new_rows.to_sql("sde22", engine, schema="public", if_exists="append", index=False)

        # === DOUBLE-CHECK: BUANG DUPLIKAT DALAM DATABASE KECUALI ID ===
        with engine.begin() as conn:
            conn.execute(text("""
                WITH duplicates AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY "TrxNo", "TransactionDateTime", "OriginPlaza", "EntryPlaza",
                                            "PlazaNo", "Trx", "AVC", "PaymentMode", "FareAmount",
                                            "MfgNoTagID", "PaidAmount", "Balance", "AccountType", "VehicleNo",
                                            "Code", "Remark", "PenaltyCode", "LaneNo", "JobNo", "CardNo"
                               ORDER BY id
                           ) AS rn
                    FROM public.sde22
                )
                DELETE FROM public.sde22
                WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
            """))

        return {
            "status": "success",
            "rows": len(new_rows),
            "message": "Success",
            "csv_saved": temp_csv_path
        }

    except Exception as e:
        import traceback
        print("❌ ERROR:", traceback.format_exc())
        return {"status": "error", "message": str(e)}


# === /plaza-list ENDPOINT ===
@app.get("/plaza-list")
def get_plaza_list():
    try:
        query = """
            SELECT DISTINCT "PlazaNo"
            FROM public.sde22
            WHERE "PlazaNo" IS NOT NULL
            ORDER BY "PlazaNo";
        """
        df = pd.read_sql(text(query), engine)
        plaza_list = df["PlazaNo"].tolist()
        return {"plazaList": plaza_list}
    except Exception:
        import traceback
        print("❌ ERROR in /plaza-list:\n", traceback.format_exc())
        return {"status": "error", "message": "Ralat semasa ambil plaza list."}

# === /wtng ENDPOINT (stable + batch processing + filters, safe TransactionDateTime) ===
@app.get("/wtng")
def get_wtng_data(
    start_date: str = None,
    end_date: str = None,
    plazas: str = Query(None, description="Senarai PlazaNo dipisah koma"),
    payment_modes: str = Query(None, description="Senarai PaymentMode dipisah koma"),
    batch_size: int = 1000
):
    try:
        # --- 1️⃣ Buat dua range masa ---
        start_dt_normal, end_dt_normal = parse_date_range(start_date, end_date, filter_6am=False)
        start_dt_special, end_dt_special = parse_date_range(start_date, end_date, filter_6am=True)

        # --- 2️⃣ Sediakan filter list ---
        plaza_list = [p.strip() for p in plazas.split(",")] if plazas else []
        pm_list = [p.strip() for p in payment_modes.split(",")] if payment_modes else []

        # --- 3️⃣ Query template ---
        query_template = """
            SELECT
                "id", "Trx", "TrxNo", "PlazaNo", "EntryPlaza", "LaneNo",
                "TransactionDateTime", "PaidAmount", "MfgNoTagID",
                "FareAmount", "VehicleNo", "PaymentMode",
                "Balance", "Code", "PenaltyCode", "Remark", "AVC",
                "OriginPlaza", "CardNo"
            FROM public.sde22
            WHERE 1=1
        """

        # --- 4️⃣ Query khusus ---
        query_special = query_template + """
            AND "PaymentMode" IN ('TNG', 'CSC', 'ABT')
            AND "TransactionDateTime" >= :start_special
            AND "TransactionDateTime" < :end_special
        """
        query_normal = query_template + """
            AND "PaymentMode" NOT IN ('TNG', 'CSC', 'ABT')
            AND "TransactionDateTime" >= :start_normal
            AND "TransactionDateTime" < :end_normal
        """

        # --- 5️⃣ Params ---
        params_special = {"start_special": start_dt_special, "end_special": end_dt_special}
        params_normal = {"start_normal": start_dt_normal, "end_normal": end_dt_normal}

        if plaza_list:
            query_special += " AND \"PlazaNo\" = ANY(:plazas)"
            query_normal += " AND \"PlazaNo\" = ANY(:plazas)"
            params_special["plazas"] = plaza_list
            params_normal["plazas"] = plaza_list

        if pm_list:
            query_special += " AND \"PaymentMode\" = ANY(:payment_modes)"
            query_normal += " AND \"PaymentMode\" = ANY(:payment_modes)"
            params_special["payment_modes"] = pm_list
            params_normal["payment_modes"] = pm_list

        # --- 6️⃣ Ambil data batch untuk special ---
        offset = 0
        dfs_special = []
        while True:
            params_special.update({"limit": batch_size, "offset": offset})
            batch_df = pd.read_sql(
                text(query_special + " ORDER BY \"TransactionDateTime\" LIMIT :limit OFFSET :offset"),
                engine,
                params=params_special
            )
            if batch_df.empty:
                break
            dfs_special.append(batch_df)
            offset += batch_size
        df_special = pd.concat(dfs_special, ignore_index=True) if dfs_special else pd.DataFrame()

        # --- 7️⃣ Ambil data batch untuk normal ---
        offset = 0
        dfs_normal = []
        while True:
            params_normal.update({"limit": batch_size, "offset": offset})
            batch_df = pd.read_sql(
                text(query_normal + " ORDER BY \"TransactionDateTime\" LIMIT :limit OFFSET :offset"),
                engine,
                params=params_normal
            )
            if batch_df.empty:
                break
            dfs_normal.append(batch_df)
            offset += batch_size
        df_normal = pd.concat(dfs_normal, ignore_index=True) if dfs_normal else pd.DataFrame()

        # --- 8️⃣ Gabungkan kedua dataframe ---
        df = pd.concat([df_special, df_normal], ignore_index=True)
        if not df.empty and "TransactionDateTime" in df.columns:
            df = df.sort_values("TransactionDateTime").reset_index(drop=True)
        else:
            df["TransactionDateTime"] = pd.NaT

        # --- 9️⃣ Pastikan OriginPlaza & CardNo ada ---
        for col in ["OriginPlaza", "CardNo"]:
            if col not in df.columns:
                df[col] = "NULL"
            else:
                df[col] = df[col].fillna("NULL")
        df = df.fillna("NULL")

        # --- 🔟 Buat chart / output ---
        chart_entry = df.groupby("EntryPlaza").size().reset_index(name="total").to_dict(orient="records") if not df.empty else []
        chart_plaza = df.groupby("PlazaNo")["PaidAmount"].sum().reset_index().to_dict(orient="records") if not df.empty else []
        chart_avc = df.groupby("AVC").size().reset_index(name="total").to_dict(orient="records") if "AVC" in df.columns and not df.empty else []

        return {
            "status": "success",
            "count": len(df),
            "data": df.to_dict(orient="records"),
            "chart_entry": chart_entry,
            "chart_plaza": chart_plaza,
            "chart_avc": chart_avc
        }

    except Exception:
        import traceback
        print("❌ ERROR in /wtng:\n", traceback.format_exc())
        return {"status": "error", "message": "Ralat semasa ambil data WTNG (stable)."}



# === /traffic-summary ENDPOINT ===
@app.get("/traffic-summary")
def get_traffic_summary(
    start_date: str = None,
    end_date: str = None,
    plazas: str = Query(None, description="Senarai EntryPlaza dipisah koma")
):
    try:
        start_dt, end_dt = parse_date_range(start_date, end_date, filter_6am=False)

        query = """
            SELECT
                "Trx" AS class,
                "EntryPlaza",
                COUNT(*) AS total_traffic,
                SUM(COALESCE("PaidAmount",0)::numeric) AS total_paid
            FROM public.sde22
            WHERE "TransactionDateTime" >= :start
              AND "TransactionDateTime" < :end
        """
        params = {"start": start_dt, "end": end_dt}

        if plazas:
            plaza_list = [p.strip() for p in plazas.split(",") if p.strip()]
            placeholders = ", ".join([f":p{i}" for i in range(len(plaza_list))])
            for i, val in enumerate(plaza_list):
                params[f"p{i}"] = val
            query += f' AND "EntryPlaza" IN ({placeholders})'

        query += ' GROUP BY "Trx", "EntryPlaza" ORDER BY "Trx", "EntryPlaza"'

        df = pd.read_sql(text(query), engine, params=params)
        if df.empty:
            return {"status": "success", "data": [], "columns": []}

        traffic_pivot = df.pivot_table(
            index="class", columns="EntryPlaza", values="total_traffic", aggfunc="sum", fill_value=0
        )
        paid_pivot = df.pivot_table(
            index="class", columns="EntryPlaza", values="total_paid", aggfunc="sum", fill_value=0
        )

        all_plazas = sorted(df["EntryPlaza"].unique())
        table_data = []

        for cls in traffic_pivot.index:
            row = {"class": cls}
            for plaza in all_plazas:
                row[f"{plaza}_traffic"] = int(traffic_pivot.loc[cls].get(plaza, 0))
                row[f"{plaza}_paid"] = float(paid_pivot.loc[cls].get(plaza, 0))
            table_data.append(row)

        return {"status": "success", "data": table_data, "columns": all_plazas}

    except Exception:
        import traceback
        print("❌ ERROR in /traffic-summary:\n", traceback.format_exc())
        return {"status": "error", "message": "Ralat semasa ambil traffic summary."}


@app.post("/upload-pdf")
async def upload_pdf(files: list[UploadFile] = File(...), preview: bool = Query(False)):
    all_rows = []

    for f in files:
        if f.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Hanya terima PDF")
        pdf_bytes = await f.read()
        text_all = ""
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_all += page_text + "\n"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal baca PDF: {str(e)}")

        plaza_no = extract_plaza_no_from_text(text_all)
        header_info = extract_lane_job_from_text(text_all)
        lane_no = header_info["LaneNo"]
        job_no = header_info["JobNo"]

        candidate_lines = clean_pdf_lines(text_all)

        for line in candidate_lines:
            row, is_valid = parse_transaction_line(line, plaza_no=plaza_no)
            if is_valid:
                all_rows.append(row)

    if not all_rows:
        raise HTTPException(status_code=404, detail="Tiada transaksi berjaya di-parse")

    # Convert ke DataFrame
    headers = [
        "TrxNo", "TransactionDateTime", "OriginPlaza", "EntryPlaza", "PlazaNo",
        "Trx", "AVC", "PaymentMode", "FareAmount", "MfgNoTagID", "PaidAmount", "Balance",
        "AccountType", "VehicleNo", "Code", "Remark", "PenaltyCode", "LaneNo", "JobNo",
        "CardNo"
    ]
    df = pd.DataFrame([
        [
            row[0],                 # TrxNo
            row[1],                 # TransactionDateTime
            row[2],                 # OriginPlaza
            row[3],                 # EntryPlaza
            row[4],                 # PlazaNo
            row[6],                 # Trx (dari row[6], bukan AVC)
            "NULL",                 # AVC
            row[8],                 # PaymentMode
            row[9],                 # FareAmount
            row[11],                # MfgNoTagID
            row[12],                # PaidAmount
            row[13],                # Balance
            "NULL",                 # AccountType
            "NULL",                 # VehicleNo
            "NULL",                 # Code
            "NULL",                 # Remark
            "NULL",                 # PenaltyCode
            lane_no,                # LaneNo
            job_no,                 # JobNo
            row[10]                 # CardNo
        ]
        for row in all_rows
    ], columns=headers)


    # Parse tarikh ikut DD/MM/YYYY
    if "TransactionDateTime" in df.columns:
        df["TransactionDateTime"] = pd.to_datetime(
            df["TransactionDateTime"],
            format="%d/%m/%Y %H:%M:%S",
            errors="coerce"
        )
        df["TransactionDateTime"] = df["TransactionDateTime"].dt.strftime("%Y-%m-%d %H:%M:%S")

    # Duplicate check ala endpoint CSV
    try:
        existing_df = pd.read_sql("SELECT * FROM public.sde22", engine)
    except Exception:
        existing_df = pd.DataFrame(columns=df.columns)

    # Samakan struktur
    for col in df.columns:
        if col not in existing_df.columns:
            existing_df[col] = np.nan
    existing_df = existing_df[df.columns]

    df = df.astype(str)
    existing_df = existing_df.astype(str)

    merged_df = df.merge(
        existing_df.drop_duplicates(),
        on=list(df.columns),
        how='left',
        indicator=True
    )
    new_rows = merged_df[merged_df['_merge'] == 'left_only'].drop(columns=['_merge'])

    # Simpan CSV filtered
    save_folder = r"C:\Users\awang\SDE22_Dashboard\backend\test"
    os.makedirs(save_folder, exist_ok=True)
    temp_csv_path = os.path.join(save_folder, "filtered_new_rows.csv")
    new_rows.to_csv(temp_csv_path, index=False, encoding='utf-8-sig')

    if preview:
        return {"status": "preview", "rows": len(new_rows)}

    if new_rows.empty:
        return {"status": "success", "rows": 0, "message": "Semua data telah wujud, tiada data baru dimasukkan."}

    # Assign ID baru dari max(id)
    with engine.begin() as conn:
        result = conn.execute(text("SELECT COALESCE(MAX(id), 0) FROM public.sde22"))
        current_max_id = result.scalar()

    new_rows = new_rows.copy()
    new_rows.insert(0, "id", range(current_max_id + 1, current_max_id + 1 + len(new_rows)))

    # Masukkan ke DB
    new_rows.to_sql("sde22", engine, schema="public", if_exists="append", index=False)

    # Double-check: delete duplicate kecuali id
    with engine.begin() as conn:
        conn.execute(text("""
            WITH duplicates AS (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY "TrxNo", "TransactionDateTime", "OriginPlaza", "EntryPlaza",
                                        "PlazaNo", "Trx", "AVC", "PaymentMode", "FareAmount",
                                        "MfgNoTagID", "PaidAmount", "Balance", "AccountType", "VehicleNo",
                                        "Code", "Remark", "PenaltyCode", "LaneNo", "JobNo", "CardNo"
                           ORDER BY id
                       ) AS rn
                FROM public.sde22
            )
            DELETE FROM public.sde22
            WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
        """))

    return {
        "status": "success",
        "rows": len(new_rows),
        "csv_saved": temp_csv_path
    }


@app.get("/")
def read_root():
  return {"message": "Backend sde22 is running successfully!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
#12/8/2025
