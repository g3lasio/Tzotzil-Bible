"""
Aplicación principal Flask con manejo de base de datos
"""
import os
import logging
from flask import Flask, render_template
from extensions import db, login_manager, migrate, init_extensions
from sqlalchemy import text

# Configuración básica de logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_app():
    """Crear y configurar la aplicación Flask"""
    logger.info("Iniciando creación de la aplicación Flask...")
    app = Flask(__name__)

    # Configuración básica
    app.config.update(
        SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', 'default-secret-key'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={
            'pool_pre_ping': True,
            'pool_recycle': 300
        }
    )

    logger.info("Configuración cargada exitosamente")

    # Inicializar extensiones
    if not init_extensions(app):
        logger.error("Error al inicializar las extensiones")
        raise RuntimeError("Failed to initialize extensions")

    # Importar modelos y configurar login_manager
    with app.app_context():
        from models import User

        @login_manager.user_loader
        def load_user(user_id):
            return User.query.get(int(user_id))

        # Registrar blueprints
        from routes import routes
        from auth import auth
        from nevin_routes import nevin_bp, init_nevin_service

        app.register_blueprint(routes)
        app.register_blueprint(auth, url_prefix='/auth')
        app.register_blueprint(nevin_bp, url_prefix='/nevin')

        # Inicializar servicio Nevin
        init_nevin_service(app)

        # Verificar conexión a la base de datos
        try:
            db.session.execute(text('SELECT 1'))
            logger.info("Conexión a la base de datos verificada exitosamente")

            # Crear tablas si no existen
            db.create_all()
            logger.info("Tablas de la base de datos creadas/verificadas exitosamente")

        except Exception as e:
            logger.error(f"Error al inicializar la base de datos: {str(e)}")
            raise

    # Manejadores de error
    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('error.html', error="Página no encontrada"), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('error.html', error="Error interno del servidor"), 500

    logger.info("Aplicación Flask creada exitosamente")
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))  # Volviendo al puerto 5000 por defecto
    app.run(host='0.0.0.0', port=port, debug=True)