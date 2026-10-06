import os


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///screener.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MUSE_SPARK_API_KEY = os.environ.get("MUSE_SPARK_API_KEY", "")
    MUSE_SPARK_BASE_URL = os.environ.get(
        "MUSE_SPARK_BASE_URL", "https://opencode.ai/zen/go/v1"
    )
    AI_MODEL = os.environ.get("AI_MODEL", "muse-spark-1.3-contributor")
    AI_API = os.environ.get("AI_API", "responses")
    MIN_SCORE = int(os.environ.get("MIN_SCORE", "0"))
    MAX_CV_SIZE = int(os.environ.get("MAX_CV_SIZE", "5242880"))
    SCORING_WEIGHTS = os.environ.get(
        "SCORING_WEIGHTS", "skills:0.5,experience:0.3,education:0.2"
    )
