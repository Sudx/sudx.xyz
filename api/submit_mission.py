import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import libsql_client

# Load environment variables from .env.development.local if it exists for local testing
load_dotenv('.env.development.local')

app = Flask(__name__)
# Configure CORS to allow requests from the admin dashboard and the main site
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8000", "https://sudx.xyz"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# --- Configuration ---
db_url = os.getenv("TURSO_DATABASE_URL")
auth_token = os.getenv("TURSO_AUTH_TOKEN")
# A secret key to protect the admin endpoint
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

def get_db_connection():
    """Establishes a synchronous connection to the Turso database using HTTPS."""
    if not db_url:
        raise ValueError("TURSO_DATABASE_URL environment variable not set.")
    
    http_url = db_url
    if not http_url.startswith("https://"):
        http_url = f"https://{http_url.split('://')[-1]}"

    try:
        return libsql_client.create_client_sync(url=http_url, auth_token=auth_token)
    except Exception as e:
        print(f"Failed to connect to Turso DB: {e}")
        raise

def init_db():
    """Initializes the database and creates the submissions table if it doesn't exist."""
    try:
        with get_db_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    wallet_address TEXT NOT NULL UNIQUE,
                    x_username TEXT NOT NULL,
                    telegram_username TEXT NOT NULL,
                    reddit_username TEXT,
                    email TEXT,
                    submission_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("Database initialized and 'submissions' table ensured.")
    except Exception as e:
        print(f"Error during initial DB setup: {e}")

# Initialize the database when the application starts
init_db()

@app.route('/api/submit_mission', methods=['POST'])
def handle_submission():
    """Handles the incoming mission submission from the website."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    wallet_address = data.get('walletAddress')
    x_username = data.get('xUsername')
    telegram_username = data.get('telegramUsername')
    reddit_username = data.get('redditUsername', '')
    email = data.get('email', '')

    if not all([wallet_address, x_username, telegram_username]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        with get_db_connection() as conn:
            rs = conn.execute(
                "INSERT OR IGNORE INTO submissions (wallet_address, x_username, telegram_username, reddit_username, email) VALUES (?, ?, ?, ?, ?)",
                (wallet_address, x_username, telegram_username, reddit_username, email)
            )
            
            # Defensive check to ensure we have a valid result
            if rs and hasattr(rs, 'rows_affected'):
                if rs.rows_affected > 0:
                    message = "Submission successful!"
                else:
                    message = "This wallet has already been submitted."
            else:
                # Fallback message if the result set is not as expected
                message = "Submission status could not be determined, but the request was sent."

            return jsonify({"message": message}), 200
            
    except Exception as e:
        # Import traceback for detailed logging
        import traceback
        print(f"--- DETAILED SUBMISSION ERROR ---")
        print(f"Error object: {e}")
        print(traceback.format_exc())
        print(f"--- END OF ERROR ---")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/get_submissions', methods=['GET'])
def get_submissions():
    """Fetches all submissions from the database. Protected by an API key."""
    # 1. Security Check
    auth_header = request.headers.get('Authorization')
    if not auth_header or auth_header != f"Bearer {ADMIN_API_KEY}":
        return jsonify({"error": "Unauthorized"}), 401

    # 2. Fetch Data
    try:
        with get_db_connection() as conn:
            rs = conn.execute("SELECT id, wallet_address, x_username, telegram_username, reddit_username, email, submission_timestamp FROM submissions ORDER BY submission_timestamp DESC")
            # Convert ResultSet to a list of dictionaries
            submissions = [dict(zip(rs.columns, row)) for row in rs.rows]
            return jsonify(submissions), 200
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        return jsonify({"error": "Failed to fetch data from database."}), 500

# This part is not strictly necessary for Vercel, but good for local testing
if __name__ == '__main__':
    app.run(port=5002, debug=True)