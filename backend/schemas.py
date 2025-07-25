from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime

# --- Esquemas de Producto ---
class ProductoBase(BaseModel):
    descripcion: str
    unidades: int
    precio_unitario: float
    total: float
class ProductoCreate(ProductoBase): pass
class Producto(ProductoBase):
    id: int
    cotizacion_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Esquemas de Cotización ---
class CotizacionBase(BaseModel):
    nombre_cliente: str
    direccion_cliente: str
    tipo_documento: str
    nro_documento: str
    moneda: str
    monto_total: float
class CotizacionCreate(CotizacionBase):
    productos: List[ProductoCreate]
class Cotizacion(CotizacionBase):
    id: int
    owner_id: int
    numero_cotizacion: str
    fecha_creacion: datetime
    productos: List[Producto] = []
    model_config = ConfigDict(from_attributes=True)

# --- Esquema para una cuenta bancaria ---
class BankAccount(BaseModel):
    banco: str
    cuenta: str
    cci: str

# --- Esquema de Perfil Actualizado ---
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

# --- Esquema de Usuario Actualizado ---
class UserBase(BaseModel):
    email: str
class UserCreate(UserBase):
    password: str
class User(UserBase):
    id: int
    is_active: bool
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_ruc: Optional[str] = None
    business_phone: Optional[str] = None
    logo_filename: Optional[str] = None
    primary_color: Optional[str] = None
    pdf_note_1: Optional[str] = None
    pdf_note_1_color: Optional[str] = None
    pdf_note_2: Optional[str] = None
    bank_accounts: Optional[Any] = None
    cotizaciones: List[Cotizacion] = []
    model_config = ConfigDict(from_attributes=True)

# --- Esquemas de Token y DocumentoConsulta ---
class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: Optional[str] = None
class DocumentoConsulta(BaseModel):
    tipo_documento: str
    numero_documento: str