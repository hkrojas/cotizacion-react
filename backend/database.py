# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from pathlib import Path  # Importar Path

# --- CORRECCIÓN ---
# Especificamos la ruta exacta al archivo .env para asegurarnos de que se encuentre
# sin importar desde dónde se ejecute el script.
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
# --- FIN DE LA CORRECCIÓN ---

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Añadimos una verificación para asegurarnos de que la URL se cargó correctamente
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("No se encontró la DATABASE_URL. Asegúrate de que esté definida en tu archivo backend/.env")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
