from flask import Flask, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from utils.db import mongo
from routes.auth_routes import auth_bp
from routes.board_routes import board_bp
from routes.user_routes import user_bp
from routes.course_routes import course_bp
from routes.learningstrat_routes import learningstrat_bp
from routes.attachments import attachments_bp
from routes.study_sessions import study_sessions_bp
import os
from utils.db import init_db
from config import Config
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS via environment variables
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
origins_list = [origin.strip() for origin in raw_origins.split(",")]

CORS(app, resources={
    r"/*": {
        "origins": origins_list,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600
    }
})

# Load configuration
app.config.from_object("config.Config")

# MongoDB configuration - ensure it's set from environment variable
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
if not app.config["MONGO_URI"]:
    raise ValueError("MONGO_URI environment variable is not set")

# Initialize database
init_db(app)

# Additional configuration
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER

app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False 
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 10800 # 3 hours
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400 * 7 # 7 days

# Initialize JWTManager
jwt = JWTManager(app)

# Create upload folder if it doesn't exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Register blueprints for routes
app.register_blueprint(auth_bp)
app.register_blueprint(board_bp)
app.register_blueprint(user_bp)
app.register_blueprint(course_bp)
app.register_blueprint(learningstrat_bp)
app.register_blueprint(attachments_bp)
app.register_blueprint(study_sessions_bp)

if __name__ == "__main__":
    # Railway will provide the PORT environment variable
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=os.getenv("FLASK_DEBUG", "True") == "True", host="0.0.0.0", port=port)
