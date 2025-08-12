# backend/facturacion_service.py

import requests
import json
import base64
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session
from num2words import num2words
import models, security, schemas
from config import settings

class FacturacionException(Exception):
    """Excepción personalizada para errores de facturación."""
    pass

def get_apisperu_token(db: Session, user: models.User) -> str:
    """
    Obtiene un token válido de Apis Perú para el usuario.
    Si el token existente ha expirado o no existe, solicita uno nuevo.
    """
    if user.apisperu_token and user.apisperu_token_expires:
        if datetime.now(timezone.utc) < user.apisperu_token_expires:
            return user.apisperu_token

    if not user.apisperu_user or not user.apisperu_password:
        raise FacturacionException("Credenciales de Apis Perú no configuradas en el perfil.")

    try:
        decrypted_password = security.decrypt_data(user.apisperu_password)
    except Exception:
        raise FacturacionException("Error al desencriptar la contraseña de Apis Perú.")

    login_payload = {"username": user.apisperu_user, "password": decrypted_password}

    try:
        response = requests.post(f"{settings.APISPERU_URL}/auth/login", json=login_payload)
        response.raise_for_status()
        data = response.json()
        new_token = data.get("token")
        if not new_token:
            raise FacturacionException("La respuesta de la API de login no contiene un token.")

        user.apisperu_token = new_token
        user.apisperu_token_expires = datetime.now(timezone.utc) + timedelta(hours=23, minutes=50)
        db.commit()
        return new_token
    except requests.exceptions.RequestException as e:
        raise FacturacionException(f"Error de conexión con Apis Perú: {e}")
    except Exception as e:
        raise FacturacionException(f"Error al iniciar sesión en Apis Perú: {e}")

def get_companies(token: str) -> list:
    """
    Obtiene la lista de empresas desde la API de Apis Perú.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = requests.get(f"{settings.APISPERU_URL}/companies", headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise FacturacionException(f"Error de conexión al obtener empresas: {e}")

def convert_cotizacion_to_invoice_payload(cotizacion: models.Cotizacion, user: models.User, serie: str, correlativo: str) -> dict:
    if not all([user.business_ruc, user.business_name, user.business_address]):
        raise FacturacionException("Datos de la empresa (RUC, Razón Social, Dirección) incompletos en el perfil.")
    if cotizacion.nro_documento == user.business_ruc:
        raise FacturacionException("No se puede emitir una factura al RUC de la propia empresa.")
    tipo_doc_map = {"DNI": "1", "RUC": "6"}
    client_tipo_doc = tipo_doc_map.get(cotizacion.tipo_documento, "0")
    details = []
    for prod in cotizacion.productos:
        valor_unitario = prod.precio_unitario
        mto_base_igv = prod.total
        igv = mto_base_igv * 0.18
        precio_unitario_con_igv = valor_unitario * 1.18
        details.append({
            "codProducto": f"P{prod.id}", "unidad": "NIU", "descripcion": prod.descripcion, "cantidad": float(prod.unidades),
            "mtoValorUnitario": round(valor_unitario, 2), "mtoValorVenta": round(prod.total, 2), "mtoBaseIgv": round(mto_base_igv, 2),
            "porcentajeIgv": 18, "igv": round(igv, 2), "tipAfeIgv": 10, "totalImpuestos": round(igv, 2),
            "mtoPrecioUnitario": round(precio_unitario_con_igv, 5)
        })
    mto_oper_gravadas = sum(d['mtoValorVenta'] for d in details)
    mto_igv = sum(d['igv'] for d in details)
    total_venta = mto_oper_gravadas + mto_igv
    def get_legend_value(amount, currency):
        currency_name = "SOLES" if currency == "PEN" else "DÓLARES AMERICANOS"
        parts = f"{amount:.2f}".split('.')
        integer_part = int(parts[0])
        decimal_part = parts[1]
        text_integer = num2words(integer_part, lang='es').upper()
        return f"SON {text_integer} CON {decimal_part}/100 {currency_name}"
    tipo_moneda_api = "PEN" if cotizacion.moneda == "SOLES" else "USD"
    legend_value = get_legend_value(total_venta, tipo_moneda_api)
    peru_tz = timezone(timedelta(hours=-5))
    now_in_peru = datetime.now(peru_tz)
    fecha_emision_formateada = now_in_peru.strftime('%Y-%m-%dT%H:%M:%S%z')
    fecha_emision_final = fecha_emision_formateada[:-2] + ':' + fecha_emision_formateada[-2:]
    payload = {
        "ublVersion": "2.1", "tipoOperacion": "0101", "tipoDoc": "01" if cotizacion.tipo_documento == "RUC" else "03",
        "serie": serie, "correlativo": correlativo, "fechaEmision": fecha_emision_final,
        "formaPago": {"moneda": tipo_moneda_api, "tipo": "Contado"}, "tipoMoneda": tipo_moneda_api,
        "client": {
            "tipoDoc": client_tipo_doc, "numDoc": cotizacion.nro_documento, "rznSocial": cotizacion.nombre_cliente,
            "address": {"direccion": cotizacion.direccion_cliente, "provincia": "LIMA", "departamento": "LIMA", "distrito": "LIMA", "ubigueo": "150101"}
        },
        "company": {
            "ruc": user.business_ruc, "razonSocial": user.business_name, "nombreComercial": user.business_name,
            "address": {"direccion": user.business_address, "provincia": "LIMA", "departamento": "LIMA", "distrito": "LIMA", "ubigueo": "150101"}
        },
        "mtoOperGravadas": round(mto_oper_gravadas, 2), "mtoIGV": round(mto_igv, 2), "valorVenta": round(mto_oper_gravadas, 2),
        "totalImpuestos": round(mto_igv, 2), "subTotal": round(total_venta, 2), "mtoImpVenta": round(total_venta, 2),
        "details": details, "legends": [{"code": "1000", "value": legend_value}]
    }
    return payload

def send_invoice(token: str, payload: dict) -> dict:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = requests.post(f"{settings.APISPERU_URL}/invoice/send", headers=headers, json=payload)
        if response.status_code >= 400:
            try:
                error_data = response.json()
                if isinstance(error_data, list): error_message = "; ".join([f"{err.get('field')}: {err.get('message')}" for err in error_data])
                else: error_message = error_data.get('message') or error_data.get('error') or str(error_data)
            except json.JSONDecodeError: error_message = response.text
            raise FacturacionException(f"Error {response.status_code} de la API: {error_message}")
        return response.json()
    except requests.exceptions.RequestException as e:
        raise FacturacionException(f"Error de conexión al enviar la factura: {e}")

def get_document_file(token: str, comprobante: models.Comprobante, user: models.User, doc_type: str) -> bytes:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if doc_type == 'cdr':
        if not comprobante.sunat_response: raise FacturacionException("No hay datos de factura para obtener el CDR.")
        cdr_zip_b64 = comprobante.sunat_response.get('cdrZip')
        if not cdr_zip_b64: raise FacturacionException("No se encontró el CDR en la respuesta de SUNAT.")
        return base64.b64decode(cdr_zip_b64)
    endpoint = f"{settings.APISPERU_URL}/invoice/{doc_type}"
    try:
        invoice_payload = comprobante.payload_enviado
        response = requests.post(endpoint, headers=headers, json=invoice_payload)
        response.raise_for_status()
        return response.content
    except requests.exceptions.RequestException as e:
        raise FacturacionException(f"Error de conexión al obtener el {doc_type.upper()}: {e}")
    except Exception as e:
        raise FacturacionException(f"Error al procesar los datos para la descarga: {e}")

def convert_data_to_guia_payload(guia_data: schemas.GuiaRemisionCreateAPI, user: models.User, serie: str, correlativo: str) -> dict:
    if not all([user.business_ruc, user.business_name, user.business_address]):
        raise FacturacionException("Datos de la empresa (RUC, Razón Social, Dirección) incompletos en el perfil.")

    peru_tz = timezone(timedelta(hours=-5))
    now_in_peru = datetime.now(peru_tz)
    fecha_emision_formateada = now_in_peru.strftime('%Y-%m-%dT%H:%M:%S%z')
    fecha_emision_final = fecha_emision_formateada[:-2] + ':' + fecha_emision_formateada[-2:]

    bienes_corregidos = []
    for bien in guia_data.bienes:
        bien_dict = bien.model_dump()
        bien_dict['cantidad'] = float(bien_dict['cantidad'])
        bienes_corregidos.append(bien_dict)

    company_data = {
        "ruc": user.business_ruc,
        "razonSocial": user.business_name,
        "nombreComercial": user.business_name,
        "address": {
            "direccion": user.business_address,
            "provincia": "LIMA",
            "departamento": "LIMA",
            "distrito": "LIMA",
            "ubigueo": "150101"
        }
    }
    
    payload = {
        "version": "2022",
        "tipoDoc": "09",
        "serie": serie,
        "correlativo": correlativo,
        "fechaEmision": fecha_emision_final,
        "company": company_data,
        "destinatario": guia_data.destinatario.model_dump(),
        "envio": {
            "modTraslado": guia_data.modTraslado,
            "codTraslado": guia_data.codTraslado,
            "desTraslado": "VENTA",
            "fecTraslado": guia_data.fecTraslado.isoformat(),
            "pesoTotal": float(guia_data.pesoTotal),
            "undPesoTotal": "KGM",
            "partida": guia_data.partida.model_dump(),
            "llegada": guia_data.llegada.model_dump()
        },
        "details": bienes_corregidos
    }

    if guia_data.modTraslado == "01": # Transporte Público
        if guia_data.transportista:
            payload["envio"]["transportista"] = guia_data.transportista.model_dump()
    elif guia_data.modTraslado == "02": # Transporte Privado
        if guia_data.conductor:
            payload["envio"]["choferes"] = [guia_data.conductor.model_dump()]
        if guia_data.transportista and guia_data.transportista.placa:
            payload["envio"]["vehiculo"] = {"placa": guia_data.transportista.placa}
    
    return payload

def send_guia_remision(token: str, payload: dict) -> dict:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        response = requests.post(f"{settings.APISPERU_URL}/despatch/send", headers=headers, json=payload)
        
        if response.status_code >= 400:
            try:
                error_data = response.json()
                print("Error detallado de la API:", json.dumps(error_data, indent=2))
                if isinstance(error_data, list):
                    error_message = "; ".join([f"{err.get('field')}: {err.get('message')}" for err in error_data])
                else:
                    error_message = error_data.get('message') or error_data.get('error') or str(error_data)
            except json.JSONDecodeError:
                error_message = response.text
            raise FacturacionException(f"Error de la API: {error_message}")
        
        return response.json()
    except requests.exceptions.RequestException as e:
        raise FacturacionException(f"Error de conexión al enviar la guía de remisión: {e}")
