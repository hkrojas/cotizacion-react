# backend/config.py
import os
from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# Especificamos la ruta exacta al archivo .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    """
    Clase para gestionar la configuración de la aplicación.
    Carga las variables de entorno desde el archivo .env.
    """
    # Configuración de la base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Configuración de seguridad para JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "un_secreto_muy_seguro_por_defecto")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # Configuración de roles y APIs externas
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "")
    API_TOKEN: str = os.getenv("API_TOKEN", "")

    # --- NUEVAS VARIABLES PARA FACTURACIÓN ---
    # URL base de la API de facturación
    APISPERU_URL: str = "https://facturacion.apisperu.com/api/v1"
    # Clave para encriptar credenciales. ¡DEBE SER SECRETA Y CONSISTENTE!
    # Puedes generar una con: Fernet.generate_key().decode()
    FERNET_KEY: str = os.getenv("FERNET_KEY", "tu_clave_de_encriptacion_aqui")
    # --- FIN DE NUEVAS VARIABLES ---

    class Config:
        case_sensitive = True
        env_file = ".env"

# Creamos una instancia única de la configuración para ser importada en otros módulos
settings = Settings()

# Verificación para asegurarnos de que las variables críticas se cargaron
if not settings.DATABASE_URL:
    raise ValueError("No se encontró la DATABASE_URL. Asegúrate de que esté definida en tu archivo backend/.env")
if settings.FERNET_KEY == "tu_clave_de_encriptacion_aqui":
    print("ADVERTENCIA: La FERNET_KEY no está configurada en .env. Usando valor por defecto.")

