from flask import Flask
from dotenv import load_dotenv
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

mail = Mail()
limiter = None  # Declare limiter globally


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "default_secret_key")

    # Configure Flask-Mail
    mail.init_app(app)

    # Initialize Flask-Limiter with in-memory storage
    global limiter
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["2000 per day", "500 per hour"],  # Global rate limits
    )

    # Import and register routes
    from .routes import main
    app.register_blueprint(main)

    return app
