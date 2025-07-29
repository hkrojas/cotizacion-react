# backend/database.py
# MODIFICADO PARA AÑADIR pool_pre_ping Y MEJORAR LA ESTABILIDAD DE LA CONEXIÓN

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# CORRECCIÓN: Se añade pool_pre_ping=True.
# Esto asegura que la conexión a la base de datos (Neon) esté activa antes de cada consulta,
# evitando errores de "SSL connection has been closed unexpectedly".
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
