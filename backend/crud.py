# backend/crud.py
# CORREGIDO: Se ha solucionado un error de variable no definida.

from sqlalchemy.orm import Session, noload, subqueryload
from sqlalchemy import func, case
from datetime import datetime, timedelta
import models, schemas, security

# --- Funciones de Usuario (sin cambios) ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User)\
        .options(noload(models.User.cotizaciones))\
        .filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)
    if not user: return None
    if not security.verify_password(password, user.hashed_password): return None
    return user

# --- Funciones de Cotización (sin cambios) ---
def get_next_cotizacion_number(db: Session):
    last_cotizacion = db.query(models.Cotizacion).order_by(models.Cotizacion.id.desc()).first()
    if not last_cotizacion or not last_cotizacion.numero_cotizacion: return "0001"
    last_num = int(last_cotizacion.numero_cotizacion)
    return f"{last_num + 1:04d}"

def create_cotizacion(db: Session, cotizacion: schemas.CotizacionCreate, user_id: int):
    numero_cotizacion = get_next_cotizacion_number(db)
    db_cotizacion = models.Cotizacion(**cotizacion.model_dump(exclude={"productos"}), owner_id=user_id, numero_cotizacion=numero_cotizacion)
    db.add(db_cotizacion)
    db.commit(); db.refresh(db_cotizacion)
    for producto_data in cotizacion.productos:
        db.add(models.Producto(**producto_data.model_dump(), cotizacion_id=db_cotizacion.id))
    db.commit(); db.refresh(db_cotizacion)
    return db_cotizacion

def get_cotizaciones_by_owner(db: Session, owner_id: int):
    return db.query(models.Cotizacion).options(noload(models.Cotizacion.productos)).filter(models.Cotizacion.owner_id == owner_id).order_by(models.Cotizacion.id.desc()).all()

def get_cotizacion_by_id(db: Session, cotizacion_id: int, owner_id: int):
    return db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id, models.Cotizacion.owner_id == owner_id).first()

def update_cotizacion(db: Session, cotizacion_id: int, cotizacion_data: schemas.CotizacionCreate, owner_id: int):
    db_cotizacion = get_cotizacion_by_id(db, cotizacion_id=cotizacion_id, owner_id=owner_id)
    if not db_cotizacion: return None
    for key, value in cotizacion_data.model_dump(exclude={"productos"}).items():
        setattr(db_cotizacion, key, value)
    db.query(models.Producto).filter(models.Producto.cotizacion_id == cotizacion_id).delete()
    for producto_data in cotizacion_data.productos:
        db.add(models.Producto(**producto_data.model_dump(), cotizacion_id=cotizacion_id))
    db.commit(); db.refresh(db_cotizacion)
    return db_cotizacion

def delete_cotizacion(db: Session, cotizacion_id: int, owner_id: int):
    db_cotizacion = get_cotizacion_by_id(db, cotizacion_id=cotizacion_id, owner_id=owner_id)
    if not db_cotizacion: return False
    db.delete(db_cotizacion); db.commit()
    return True

# --- Funciones de Administrador ---
def get_admin_dashboard_stats(db: Session):
    total_users = db.query(func.count(models.User.id)).scalar()
    active_users = db.query(func.count(models.User.id)).filter(models.User.is_active == True).scalar()
    total_cotizaciones = db.query(func.count(models.Cotizacion.id)).scalar()
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_users_last_30_days = db.query(func.count(models.User.id)).filter(models.User.creation_date >= thirty_days_ago).scalar()
    
    return schemas.AdminDashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_cotizaciones=total_cotizaciones,
        new_users_last_30_days=new_users_last_30_days
    )

def get_all_users(db: Session):
    results = db.query(
        models.User,
        func.count(models.Cotizacion.id).label("cotizaciones_count")
    ).outerjoin(models.Cotizacion, models.User.id == models.Cotizacion.owner_id)\
     .group_by(models.User.id)\
     .order_by(models.User.id)\
     .all()
    
    users_with_counts = []
    for user, count in results:
        user.cotizaciones_count = count
        users_with_counts.append(user)
        
    return users_with_counts

def get_user_by_id_for_admin(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

# --- FUNCIÓN CORREGIDA ---
# Se cambió la variable 'reason' por 'deactivation_reason' para que coincida con el parámetro de la función.
def update_user_status(db: Session, user_id: int, is_active: bool, deactivation_reason: str = None):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_active = is_active
        db_user.deactivation_reason = deactivation_reason if not is_active else None
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
