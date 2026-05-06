# database.py
# This file handles all database connections and queries
# It fetches student scores and attendance from PostgreSQL

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))


def fetch_all_students_data():
    conn = get_connection()
    cursor = conn.cursor()

    # use correct camelCase column names from Prisma
    cursor.execute("""
        SELECT 
            r."studentId",
            r.score,
            s."gradeId"
        FROM "Result" r
        JOIN "Student" s ON r."studentId" = s.id
        ORDER BY r."studentId", r.id ASC
    """)
    results = cursor.fetchall()

    cursor.execute("""
        SELECT 
            "studentId",
            COUNT(CASE WHEN present = true THEN 1 END) * 100.0 / COUNT(*) as rate
        FROM "Attendance"
        GROUP BY "studentId"
    """)
    attendance_rows = cursor.fetchall()
    
    conn.close()

    attendance_map = {}
    for row in attendance_rows:
        attendance_map[row[0]] = float(row[1])

    student_map = {}
    for row in results:
        sid, score, grade_id = row
        if sid not in student_map:
            student_map[sid] = {
                "student_id": sid,
                "scores": [],
                "grade_id": grade_id,
                "attendance_rate": attendance_map.get(sid, 0.0)
            }
        student_map[sid]["scores"].append(score)

    return list(student_map.values())


def fetch_single_student_data(student_id: str):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT score FROM "Result"
        WHERE "studentId" = %s
        ORDER BY id ASC
    """, (student_id,))
    score_rows = cursor.fetchall()

    cursor.execute("""
        SELECT 
            COUNT(CASE WHEN present = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)
        FROM "Attendance"
        WHERE "studentId" = %s
    """, (student_id,))
    att_row = cursor.fetchone()

    cursor.execute("""
        SELECT "gradeId" FROM "Student" WHERE id = %s
    """, (student_id,))
    grade_row = cursor.fetchone()

    conn.close()

    scores = [row[0] for row in score_rows]
    attendance_rate = float(att_row[0]) if att_row and att_row[0] else 0.0
    grade_id = grade_row[0] if grade_row else 1

    return scores, attendance_rate, grade_id