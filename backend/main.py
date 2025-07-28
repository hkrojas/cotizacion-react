# backend/main.py
# MODIFICADO PARA MANEJAR MOTIVO DE DESACTIVACIÓN

import requests
import os
import re
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

import crud, models, schemas, security, pdf_generator
from database import SessionLocal, engine
from config import settings

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount("/logos", StaticFiles(directory="logos"), name="logos")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://cotizacion-react-bice.vercel.app"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    
    user.is_admin = (user.email == settings.ADMIN_EMAIL)
    return user

def get_current_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    return current_user

# --- Endpoints de Autenticación ---
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # --- NUEVA VERIFICACIÓN: COMPROBAR SI EL USUARIO ESTÁ ACTIVO ---
    if not user.is_active:
        reason = user.deactivation_reason or "Contacte al administrador."
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Su cuenta ha sido desactivada. Motivo: {reason}"
        )

    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ... (El resto de los endpoints hasta /admin/users/{user_id}/status no cambian) ...

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/consultar-documento")
def consultar_documento(consulta: schemas.DocumentoConsulta, current_user: models.User = Depends(get_current_user)):
    token = settings.API_TOKEN
    if not token:
        raise HTTPException(status_code=500, detail="API token not configured")
    
    headers = {'Authorization': f'Bearer {token}'}
    tipo, numero = consulta.tipo_documento, consulta.numero_documento
    url = f"https://api.apis.net.pe/v2/reniec/dni?numero={numero}" if tipo == "DNI" else f"https://api.apis.net.pe/v2/sunat/ruc?numero={numero}"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        if tipo == "DNI":
            nombre_completo = f"{data.get('nombres', '')} {data.get('apellidoPaterno', '')} {data.get('apellidoMaterno', '')}".strip()
            return {"nombre": nombre_completo, "direccion": ""}
        else:
            return {"nombre": data.get('razonSocial', ''), "direccion": data.get('direccion', '')}
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=503, detail="Error al consultar la API externa")

@app.post("/cotizaciones/", response_model=schemas.Cotizacion)
def create_new_cotizacion(cotizacion: schemas.CotizacionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_cotizacion(db=db, cotizacion=cotizacion, user_id=current_user.id)

@app.get("/cotizaciones/", response_model=List[schemas.Cotizacion])
def read_cotizaciones(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_cotizaciones_by_owner(db=db, owner_id=current_user.id)

@app.get("/cotizaciones/{cotizacion_id}", response_model=schemas.Cotizacion)
def read_single_cotizacion(cotizacion_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_cotizacion = crud.get_cotizacion_by_id(db, cotizacion_id=cotizacion_id, owner_id=current_user.id)
    if db_cotizacion is None:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return db_cotizacion

@app.put("/cotizaciones/{cotizacion_id}", response_model=schemas.Cotizacion)
def update_single_cotizacion(cotizacion_id: int, cotizacion: schemas.CotizacionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    updated_cotizacion = crud.update_cotizacion(db, cotizacion_id=cotizacion_id, cotizacion_data=cotizacion, owner_id=current_user.id)
    if updated_cotizacion is None:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return updated_cotizacion

@app.delete("/cotizaciones/{cotizacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_cotizacion(cotizacion_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    success = crud.delete_cotizacion(db, cotizacion_id=cotizacion_id, owner_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    return {"ok": True}

@app.put("/profile/", response_model=schemas.User)
def update_profile(profile_data: schemas.ProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@app.post("/profile/logo/", response_model=schemas.User)
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    allowed_mime_types = ["image/jpeg", "image/png"]
    allowed_extensions = [".jpg", ".jpeg", ".png"]
    
    if file.content_type not in allowed_mime_types:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido. Solo se aceptan JPG o PNG.")

    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Extensión de archivo no permitida.")

    logo_dir = "logos"
    os.makedirs(logo_dir, exist_ok=True)
    
    filename = f"user_{current_user.id}_logo{file_extension}"
    file_path = os.path.join(logo_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    current_user.logo_filename = filename
    db.commit()
    db.refresh(current_user)
    return current_user

def sanitize_filename(name: str) -> str:
    name = name.replace(' ', '_')
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    return name

@app.get("/cotizaciones/{cotizacion_id}/pdf")
def get_cotizacion_pdf(cotizacion_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cotizacion = db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id, models.Cotizacion.owner_id == current_user.id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    pdf_buffer = pdf_generator.create_pdf_buffer(cotizacion, current_user)
    
    sanitized_client_name = sanitize_filename(cotizacion.nombre_cliente)
    filename = f"Cotizacion_{cotizacion.numero_cotizacion}_{sanitized_client_name}.pdf"
    
    headers = {"Content-Disposition": f"inline; filename=\"{filename}\""}
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

# --- Endpoints de Administrador ---
@app.get("/admin/users/", response_model=List[schemas.AdminUserView])
def get_users_for_admin(db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    users = crud.get_all_users(db)
    for user in users:
        user.is_admin = (user.email == settings.ADMIN_EMAIL)
    return users

@app.get("/admin/users/{user_id}", response_model=schemas.AdminUserDetailView)
def get_user_details_for_admin(user_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = (user.email == settings.ADMIN_EMAIL)
    return user

# --- MODIFICACIÓN: AHORA RECIBE EL MOTIVO DE DESACTIVACIÓN ---
@app.put("/admin/users/{user_id}/status", response_model=schemas.AdminUserView)
def update_user_status_for_admin(user_id: int, status_update: schemas.UserStatusUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    user = crud.update_user_status(
        db, 
        user_id=user_id, 
        is_active=status_update.is_active,
        deactivation_reason=status_update.deactivation_reason
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = (user.email == settings.ADMIN_EMAIL)
    return user

@app.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_for_admin(user_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.email == settings.ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete the main admin account")
    
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found during deletion")
    return

@app.get("/admin/cotizaciones/{cotizacion_id}/pdf")
def get_admin_cotizacion_pdf(cotizacion_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_current_admin_user)):
    cotizacion = db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id).first()
    if not cotizacion:
        raise HTTPException(status_code=404, detail="Cotización no encontrada")
    
    quote_owner = cotizacion.owner
    if not quote_owner:
         raise HTTPException(status_code=404, detail="No se encontró el dueño de la cotización")

    pdf_buffer = pdf_generator.create_pdf_buffer(cotizacion, quote_owner)
    
    sanitized_client_name = sanitize_filename(cotizacion.nombre_cliente)
    filename = f"Cotizacion_{cotizacion.numero_cotizacion}_{sanitized_client_name}.pdf"
    
    headers = {"Content-Disposition": f"inline; filename=\"{filename}\""}
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)
