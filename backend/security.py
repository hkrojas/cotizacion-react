# backend/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import settings
from cryptography.fernet import Fernet

# Usamos las variables de configuración desde el objeto de settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- FUNCIONES DE ENCRIPTACIÓN ---
# Creamos una instancia de Fernet para encriptar/desencriptar
cipher_suite = Fernet(settings.FERNET_KEY.encode())

def encrypt_data(data: str) -> bytes:
    """Encripta un string y devuelve bytes."""
    return cipher_suite.encrypt(data.encode())

def decrypt_data(encrypted_data: bytes) -> str:
    """Desencripta bytes y devuelve un string."""
    return cipher_suite.decrypt(encrypted_data).decode()

def verify_password(plain_password, hashed_password):
    """Verifica una contraseña en texto plano contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token de acceso."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
