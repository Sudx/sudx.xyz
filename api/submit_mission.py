import os
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from dotenv import load_dotenv
import libsql_client

# Load environment variables from .env.development.local if it exists for local testing
load_dotenv('.env.development.local')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

# --- Database Configuration ---
db_url = os.getenv("TURSO_DATABASE_URL")
auth_token = os.getenv("TURSO_AUTH_TOKEN")

def get_db_connection():
    """Establishes a synchronous connection to the Turso database using HTTPS."""
    if not db_url:
        raise ValueError("TURSO_DATABASE_URL environment variable not set.")
    
    # --- WORKAROUND for WebSocket issues ---
    # Force the connection to use HTTPS instead of WSS (WebSocket)
    # by ensuring the URL starts with https://
    http_url = db_url
    if not http_url.startswith("https://"):
        http_url = f"https://{http_url.split('://')[-1]}"

    print(f"Attempting to connect to Turso DB via HTTPS: {http_url}")

    try:
        client = libsql_client.create_client_sync(url=http_url, auth_token=auth_token)
        print("Successfully connected to Turso DB.")
        return client
    except Exception as e:
        print(f"Failed to connect to Turso DB: {e}")
        raise

def init_db():
    """Initializes the database and creates the submissions table if it doesn't exist."""
    conn = None
    try:
        conn = get_db_connection()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL UNIQUE,
                x_username TEXT NOT NULL,
                telegram_username TEXT NOT NULL,
                reddit_username TEXT,
                submission_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Database initialized and 'submissions' table ensured.")
    except Exception as e:
        # Do not raise here, as it can prevent the app from starting.
        # The error will be caught again when a request is made.
        print(f"Error during initial DB setup: {e}")
    finally:
        if conn and hasattr(conn, 'close'):
            conn.close()

# Initialize the database when the application starts
init_db()

@app.route('/api/submit_mission', methods=['POST'])
def handle_submission():
    """Handles the incoming mission submission from the website."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        wallet_address = data.get('walletAddress')
        x_username = data.get('xUsername')
        telegram_username = data.get('telegramUsername')
        reddit_username = data.get('redditUsername', '') # Optional

        if not all([wallet_address, x_username, telegram_username]):
            return jsonify({"error": "Missing required fields"}), 400

        conn = get_db_connection()
        rs = conn.execute(
            "INSERT OR IGNORE INTO submissions (wallet_address, x_username, telegram_username, reddit_username) VALUES (?, ?, ?, ?)",
            (wallet_address, x_username, telegram_username, reddit_username)
        )
        
        if rs.rows_affected > 0:
            print(f"New submission saved for wallet: {wallet_address}")
            message = "Submission successful!"
        else:
            print(f"Duplicate submission attempted for wallet: {wallet_address}")
            message = "This wallet has already been submitted."

        return jsonify({"message": message}), 200
    except Exception as e:
        print(f"Error saving submission: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500
    finally:
        if conn and hasattr(conn, 'close'):
            conn.close()

# This part is not strictly necessary for Vercel, but good for local testing
if __name__ == '__main__':
    app.run(port=5002, debug=True)
