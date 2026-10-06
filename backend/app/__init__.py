from flask import Flask
from flask_cors import CORS
from .config import Config
from .metrics import metrics_bp
from .models import db
from .routes.analytics import analytics_bp
from .routes.candidates import candidates_bp
from .routes.health import health_bp
from .routes.jobs import jobs_bp

def create_app(config_name="production"):
    app = Flask(__name__)
    CORS(app)
    app.config.from_object(Config)

    db.init_app(app)
    with app.app_context():
        db.create_all()

    app.register_blueprint(health_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(jobs_bp, url_prefix="/api")
    app.register_blueprint(candidates_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")

    return app
