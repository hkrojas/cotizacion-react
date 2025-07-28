# backend/models.py
# MODIFICADO PARA AÑADIR ELIMINACIÓN EN CASCADA

from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # Perfil del negocio
    business_name = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    business_ruc = Column(String, nullable=True)
    business_phone = Column(String, nullable=True)
    logo_filename = Column(String, nullable=True)
    primary_color = Column(String, default="#004aad")
    pdf_note_1 = Column(String, default="TODO TRABAJO SE REALIZA CON EL 50% DE ADELANTO")
    pdf_note_1_color = Column(String, default="#FF0000")
    pdf_note_2 = Column(String, default="LOS PRECIOS NO INCLUYEN ENVIOS")
    bank_accounts = Column(JSON, nullable=True)

    # --- MODIFICACIÓN: AÑADIMOS ELIMINACIÓN EN CASCADA ---
    # Si se elimina un usuario, todas sus cotizaciones también se eliminarán.
    cotizaciones = relationship("Cotizacion", back_populates="owner", cascade="all, delete-orphan")

class Cotizacion(Base):
    __tablename__ = "cotizaciones"
    id = Column(Integer, primary_key=True, index=True)
    numero_cotizacion = Column(String, unique=True, index=True)
    nombre_cliente = Column(String)
    direccion_cliente = Column(String)
    tipo_documento = Column(String)
    nro_documento = Column(String)
    moneda = Column(String)
    monto_total = Column(Float)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="cotizaciones")
    productos = relationship("Producto", back_populates="cotizacion", cascade="all, delete-orphan")

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    descripcion = Column(String, index=True)
    unidades = Column(Integer)
    precio_unitario = Column(Float)
    total = Column(Float)
    cotizacion_id = Column(Integer, ForeignKey("cotizaciones.id"))
    cotizacion = relationship("Cotizacion", back_populates="productos")
