# backend/schemas.py
# MODIFICADO PARA SOLUCIONAR ERROR DE MEMORIA (OOM)

from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Esquemas de Producto (sin cambios) ---
class ProductoBase(BaseModel):
    descripcion: str = Field(..., min_length=1)
    unidades: int = Field(..., gt=0)
    precio_unitario: float = Field(..., ge=0)
    total: float
class ProductoCreate(ProductoBase): pass
class Producto(ProductoBase):
    id: int
    cotizacion_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Esquemas de Cotización (sin cambios) ---
class CotizacionBase(BaseModel):
    nombre_cliente: str = Field(..., min_length=1)
    direccion_cliente: str
    tipo_documento: str
    nro_documento: str = Field(..., min_length=1)
    moneda: str
    monto_total: float
class CotizacionCreate(CotizacionBase):
    productos: List[ProductoCreate] = Field(..., min_length=1)
class Cotizacion(CotizacionBase):
    id: int
    owner_id: int
    numero_cotizacion: str
    fecha_creacion: datetime
    productos: List[Producto] = []
    model_config = ConfigDict(from_attributes=True)

# --- Esquema de Cuenta Bancaria (sin cambios) ---
class BankAccount(BaseModel):
    banco: str
    tipo_cuenta: Optional[str] = None
    moneda: Optional[str] = None
    cuenta: str
    cci: str

# --- Esquema de Perfil (sin cambios) ---
class ProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_ruc: Optional[str] = None
    business_phone: Optional[str] = None
    primary_color: Optional[str] = None
    pdf_note_1: Optional[str] = None
    pdf_note_1_color: Optional[str] = None
    pdf_note_2: Optional[str] = None
    bank_accounts: Optional[List[BankAccount]] = None

# --- Esquemas de Usuario ---
class UserBase(BaseModel):
    email: EmailStr
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Esquema completo del usuario, usado para el perfil del propio usuario (/users/me)
class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    deactivation_reason: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_ruc: Optional[str] = None
    business_phone: Optional[str] = None
    logo_filename: Optional[str] = None
    primary_color: Optional[str] = None
    pdf_note_1: Optional[str] = None
    pdf_note_1_color: Optional[str] = None
    pdf_note_2: Optional[str] = None
    bank_accounts: Optional[List[BankAccount]] = None
    cotizaciones: List[Cotizacion] = [] # Este campo carga todas las cotizaciones
    model_config = ConfigDict(from_attributes=True)

# --- Esquemas de Admin ---
class AdminUserView(BaseModel):
    id: int
    email: str
    is_active: bool
    is_admin: bool
    deactivation_reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class UserStatusUpdate(BaseModel):
    is_active: bool
    deactivation_reason: Optional[str] = None

# CORRECCIÓN CLAVE:
# Este es el nuevo esquema para la vista de detalles del admin.
# Hereda de UserBase e incluye todos los campos del perfil,
# PERO EXCLUYE deliberadamente el campo 'cotizaciones'.
# Esto evita que el backend intente cargar todas las cotizaciones y se quede sin memoria.
class AdminUserDetailView(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    deactivation_reason: Optional[str] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_ruc: Optional[str] = None
    business_phone: Optional[str] = None
    logo_filename: Optional[str] = None
    primary_color: Optional[str] = None
    pdf_note_1: Optional[str] = None
    pdf_note_1_color: Optional[str] = None
    pdf_note_2: Optional[str] = None
    bank_accounts: Optional[List[BankAccount]] = None
    # El campo 'cotizaciones' se omite a propósito aquí.
    model_config = ConfigDict(from_attributes=True)


# --- Esquemas de Token y DocumentoConsulta (sin cambios) ---
class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: Optional[EmailStr] = None
class DocumentoConsulta(BaseModel):
    tipo_documento: str
    numero_documento: str
