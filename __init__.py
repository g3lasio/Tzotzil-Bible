
from flask import Flask
from extensions import init_extensions

def create_app():
    app = Flask(__name__)
    init_extensions(app)
    return app
