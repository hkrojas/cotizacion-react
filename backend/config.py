# backend/config.py
# CORREGIDO PARA SOLUCIONAR EL ERROR DE VALIDACIÓN

import os
from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

# Asegúrate de que pydantic-settings esté instalado: pip install pydantic-settings
# Y también python-dotenv: pip install python-dotenv

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
    # --- CORRECCIÓN: Renombramos la variable para que coincida con el .env ---
    API_TOKEN: str = os.getenv("API_TOKEN", "")

    class Config:
        case_sensitive = True
        env_file = ".env"

# Creamos una instancia única de la configuración para ser importada en otros módulos
settings = Settings()

# Verificación para asegurarnos de que las variables críticas se cargaron
if not settings.DATABASE_URL:
    raise ValueError("No se encontró la DATABASE_URL. Asegúrate de que esté definida en tu archivo backend/.env")
