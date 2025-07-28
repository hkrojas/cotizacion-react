from sqlalchemy.orm import Session
import models, schemas, security

# --- Funciones de Usuario ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.pwd_context.hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email=email)
    if not user:
        return False
    if not security.verify_password(password, user.hashed_password):
        return False
    return user

# --- Funciones de Cotización ---
def get_next_cotizacion_number(db: Session):
    last_cotizacion = db.query(models.Cotizacion).order_by(models.Cotizacion.id.desc()).first()
    if not last_cotizacion or not last_cotizacion.numero_cotizacion:
        return "0001"
    last_num = int(last_cotizacion.numero_cotizacion)
    next_num = last_num + 1
    return f"{next_num:04d}"

def create_cotizacion(db: Session, cotizacion: schemas.CotizacionCreate, user_id: int):
    numero_cotizacion = get_next_cotizacion_number(db)
    db_cotizacion = models.Cotizacion(
        **cotizacion.model_dump(exclude={"productos"}), 
        owner_id=user_id,
        numero_cotizacion=numero_cotizacion
    )
    db.add(db_cotizacion)
    db.commit()
    db.refresh(db_cotizacion)
    for producto_data in cotizacion.productos:
        db_producto = models.Producto(**producto_data.model_dump(), cotizacion_id=db_cotizacion.id)
        db.add(db_producto)
    db.commit()
    db.refresh(db_cotizacion)
    return db_cotizacion

def get_cotizaciones_by_owner(db: Session, owner_id: int):
    return db.query(models.Cotizacion).filter(models.Cotizacion.owner_id == owner_id).order_by(models.Cotizacion.id.desc()).all()

def get_cotizacion_by_id(db: Session, cotizacion_id: int, owner_id: int):
    return db.query(models.Cotizacion).filter(models.Cotizacion.id == cotizacion_id, models.Cotizacion.owner_id == owner_id).first()

def update_cotizacion(db: Session, cotizacion_id: int, cotizacion_data: schemas.CotizacionCreate, owner_id: int):
    db_cotizacion = get_cotizacion_by_id(db, cotizacion_id=cotizacion_id, owner_id=owner_id)
    if not db_cotizacion:
        return None
    for key, value in cotizacion_data.model_dump(exclude={"productos"}).items():
        setattr(db_cotizacion, key, value)
    db.query(models.Producto).filter(models.Producto.cotizacion_id == cotizacion_id).delete()
    for producto_data in cotizacion_data.productos:
        db_producto = models.Producto(**producto_data.model_dump(), cotizacion_id=cotizacion_id)
        db.add(db_producto)
    db.commit()
    db.refresh(db_cotizacion)
    return db_cotizacion

def delete_cotizacion(db: Session, cotizacion_id: int, owner_id: int):
    db_cotizacion = get_cotizacion_by_id(db, cotizacion_id=cotizacion_id, owner_id=owner_id)
    if not db_cotizacion:
        return False
    db.delete(db_cotizacion)
    db.commit()
    return True

# --- NUEVAS FUNCIONES DE ADMINISTRADOR ---
def get_all_users(db: Session):
    return db.query(models.User).all()

def update_user_status(db: Session, user_id: int, is_active: bool):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_active = is_active
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
