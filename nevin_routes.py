import logging
from flask import Blueprint, render_template, request, jsonify, current_app

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear blueprint
nevin_bp = Blueprint('nevin_bp', __name__)

# Servicio Nevin
nevin_service = None

def init_nevin_service(app):
    """Inicializa el servicio Nevin."""
    global nevin_service
    try:
        # Importar aquí para evitar importaciones circulares
        from nevin_service import NevinService
        nevin_service = NevinService(app)
        logger.info("Servicio Nevin inicializado correctamente")
    except Exception as e:
        logger.error(f"Error inicializando servicio Nevin: {str(e)}")
        raise

@nevin_bp.route('/')
def nevin_page():
    """Renderiza la página principal de Nevin."""
    try:
        return render_template('nevin.html',
                           welcome_message="¡Hola! Soy Nevin, tu asistente bíblico.")
    except Exception as e:
        logger.error(f"Error en nevin_page: {str(e)}")
        return render_template('error.html',
                           error="Hubo un problema al cargar la página."), 500

@nevin_bp.route('/query', methods=['POST'])
def nevin_query():
    """Procesa consultas enviadas a Nevin."""
    try:
        if not nevin_service:
            logger.error("Servicio Nevin no inicializado")
            return jsonify({
                'response': "El servicio Nevin no está disponible en este momento.",
                'success': False
            }), 503

        data = request.get_json()
        question = data.get('question', '').strip()

        if not question:
            return jsonify({
                'response': "Por favor, escribe tu pregunta.",
                'success': False
            }), 400

        logger.info(f"Procesando consulta: {question[:50]}...")

        # Procesar la consulta sin user_id
        response = nevin_service.process_query(question)
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error procesando consulta: {str(e)}")
        return jsonify({
            'response': "Hubo un error procesando tu pregunta. Por favor, inténtalo de nuevo.",
            'success': False
        }), 500