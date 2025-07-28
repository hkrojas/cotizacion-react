# backend/database.py
# MODIFICADO PARA USAR EL ARCHIVO DE CONFIGURACIÓN CENTRALIZADO

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings # Importamos la configuración centralizada

# Usamos la URL de la base de datos desde el objeto de settings
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()