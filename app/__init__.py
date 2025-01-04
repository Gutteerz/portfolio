from flask import Flask
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from celery import Celery
import os

mail = Mail()
limiter = Limiter(get_remote_address)
celery = None


def make_celery(app):
    celery = Celery(app.import_name, backend=app.config['CELERY_RESULT_BACKEND'],
                    broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    return celery


def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    mail.init_app(app)
    limiter.init_app(app)

    global celery
    celery = make_celery(app)

    # Register Blueprints
    from .routes import main
    app.register_blueprint(main)

    return app
