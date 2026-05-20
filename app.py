import os
import time

from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", "12345!"),
    "database": os.getenv("MYSQL_DATABASE", "sqmo"),
}

if os.getenv("MYSQL_SSL_MODE", "").lower() in ("required", "true", "1"):
    DB_CONFIG["ssl_disabled"] = False


def connect_to_mysql(retries=20, delay=2):
    for attempt in range(1, retries + 1):
        try:
            return mysql.connector.connect(**DB_CONFIG)
        except mysql.connector.Error:
            if attempt == retries:
                raise
            time.sleep(delay)


db = connect_to_mysql()

if db.is_connected():
    print("Connected to MySQL database")

cursor = db.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS programs (
	id INT AUTO_INCREMENT PRIMARY KEY,
	p_name VARCHAR(100) NOT NULL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS report_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    report_key VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
    UNIQUE (program_id, report_key)
)
""")

# =====================
# PAGE ROUTES
# =====================
@app.route("/")
def landing():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM programs")

    programs = cursor.fetchall()

    cursor.close()
    return render_template("Landing_page.html", programs=programs)

@app.route("/login/<int:id>")
def login_page(id):
    return render_template("Login_page.html", program_id=id)

@app.route("/login_sqmo")
def login_sqmo():
    return render_template("Login_SQMO.html")

@app.route("/sqmostaff_report/<int:program_id>")
def staff_report(program_id):
    return render_template("SQMOStaff_report.html", program_id=program_id)

@app.route("/report_list/<int:program_id>")
def report_list(program_id):
    return render_template("Report_lists.html", program_id=program_id)

@app.route("/sqmostaff_land")
def sqmostaff_land():
    return render_template("SQMOStaff_land.html")

# =====================
# REST API
# =====================
@app.route("/api/links/<int:program_id>/<key>", methods=["GET"])
def get_link(program_id, key):
    cursor = db.cursor()
    cursor.execute("SELECT url FROM report_links WHERE program_id=%s AND report_key=%s", (program_id, key))
    row = cursor.fetchone()
    cursor.close()
    if row:
        return jsonify({"url": row[0]})
    return jsonify({"error": "Not found"}), 404

@app.route("/api/links", methods=["POST"])
def save_link():
    data = request.get_json()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO report_links (program_id, report_key, url)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE url=%s
    """, (data["program_id"], data["report_key"], data["url"], data["url"]))
    db.commit()
    cursor.close()
    return jsonify({"message": "Saved"})

@app.route("/api/links/<int:program_id>/<key>", methods=["DELETE"])
def delete_link(program_id, key):
    cursor = db.cursor()
    cursor.execute("DELETE FROM report_links WHERE program_id=%s AND report_key=%s", (program_id, key))
    db.commit()
    cursor.close()
    return jsonify({"message": "Deleted"})

# =====================
# PROGRAMS API
# =====================
@app.route("/api/programs", methods=["GET"])
def api_get_programs():
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, p_name FROM programs ORDER BY id")
    programs = cursor.fetchall()
    cursor.close()
    return jsonify(programs)

@app.route("/api/programs", methods=["POST"])
def api_add_program():
    data = request.get_json()
    cursor = db.cursor()
    cursor.execute("INSERT INTO programs (p_name) VALUES (%s)", (data["p_name"],))
    db.commit()
    new_id = cursor.lastrowid
    cursor.close()
    return jsonify({"id": new_id, "p_name": data["p_name"]}), 201

@app.route("/api/programs/<int:program_id>", methods=["PUT"])
def api_update_program(program_id):
    data = request.get_json()
    cursor = db.cursor()
    cursor.execute("UPDATE programs SET p_name=%s WHERE id=%s", (data["p_name"], program_id))
    db.commit()
    cursor.close()
    return jsonify({"success": True})

@app.route("/api/programs/<int:program_id>", methods=["DELETE"])
def api_delete_program(program_id):
    cursor = db.cursor()
    cursor.execute("DELETE FROM programs WHERE id=%s", (program_id,))
    db.commit()
    cursor.close()
    return jsonify({"success": True})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
