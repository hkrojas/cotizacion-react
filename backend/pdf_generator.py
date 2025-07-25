import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Image, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from dateutil.relativedelta import relativedelta
from . import models

def create_pdf_buffer(cotizacion: models.Cotizacion, user: models.User):
    buffer = io.BytesIO()
    # Configuración del documento
    margen_izq = 20
    margen_der = 20
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=margen_izq, rightMargin=margen_der,
                            topMargin=20, bottomMargin=20)
    
    styles = getSampleStyleSheet()
    
    # --- DATOS DINÁMICOS ---
    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if cotizacion.moneda == "SOLES" else "$"

    # 1. TABLA PRINCIPAL (logo y datos)
    try:
        logo_path = f"backend/logos/{user.logo_filename}" if user.logo_filename else None
        logo = Image(logo_path, width=151, height=76) if logo_path else ""
    except Exception:
        logo = ""
    
    data_principal = [
        [logo, user.business_name or "Nombre del Negocio", f"RUC {user.business_ruc or 'NO ESPECIFICADO'}"],
        ["", user.business_address or "Dirección no especificada", "COTIZACIÓN"],
        ["", f"{user.email}\n{user.business_phone or ''}", f"N° {cotizacion.numero_cotizacion}"]
    ]
    
    tabla_principal = Table(data_principal, colWidths=[
        ancho_total * 0.30,
        ancho_total * 0.50,
        ancho_total * 0.20
    ])
    
    estilo_principal = TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ])
    tabla_principal.setStyle(estilo_principal)

    # 2. TABLA CLIENTE
    fecha_emision = cotizacion.fecha_creacion.strftime("%d/%m/%Y")
    fecha_vencimiento = (cotizacion.fecha_creacion + relativedelta(months=1)).strftime("%d/%m/%Y")
    
    nombre_cliente_p = Paragraph(cotizacion.nombre_cliente, styles['Normal'])
    direccion_cliente_p = Paragraph(cotizacion.direccion_cliente, styles['Normal'])

    data_cliente = [
        ["Señores:", nombre_cliente_p, " Emisión:", fecha_emision],
        [f"{cotizacion.tipo_documento}:", cotizacion.nro_documento, " Vencimiento:", fecha_vencimiento],
        ["Dirección:", direccion_cliente_p, " Moneda:", cotizacion.moneda]
    ]
    
    tabla_cliente = Table(data_cliente, colWidths=[
        ancho_total * 0.10,
        ancho_total * 0.60,
        ancho_total * 0.15,
        ancho_total * 0.15
    ])
    
    estilo_cliente = TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])
    tabla_cliente.setStyle(estilo_cliente)

    # 3. TABLA PRODUCTOS
    data_productos = [
        ["Descripción", "Cantidad", "P.Unit", "IGV", "Precio"]
    ]
    for prod in cotizacion.productos:
        igv_producto = prod.total * (18 / 118)
        data_productos.append([
            Paragraph(prod.descripcion, styles['Normal']),
            prod.unidades,
            f"{simbolo} {prod.precio_unitario:.2f}",
            f"{simbolo} {igv_producto:.2f}",
            f"{simbolo} {prod.total:.2f}"
        ])
    
    tabla_productos = Table(data_productos, colWidths=[
        ancho_total * 0.40,
        ancho_total * 0.15,
        ancho_total * 0.15,
        ancho_total * 0.15,
        ancho_total * 0.15
    ])
    
    estilo_productos = TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), color_principal),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])
    tabla_productos.setStyle(estilo_productos)

    # 4. TABLA TOTALES
    total_igv = cotizacion.monto_total * (18 / 118)
    total_gravado = cotizacion.monto_total - total_igv
    data_total = [
        ["Total Gravado", f"{simbolo} {total_gravado:.2f}"],
        ["Total IGV ", f"{simbolo} {total_igv:.2f}"],
        ["Importe Total", f"{simbolo} {cotizacion.monto_total:.2f}"]
    ]
    
    tabla_total = Table(data_total, colWidths=[
        ancho_total * 0.85,
        ancho_total * 0.15
    ])
    
    estilo_total = TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])
    tabla_total.setStyle(estilo_total)

    # 5. IMPORTE TOTAL A PAGAR
    data_monto = [
        [f"IMPORTE TOTAL A PAGAR {simbolo} {cotizacion.monto_total:.2f}"],
    ]
    tabla_monto = Table(data_monto, colWidths=[ancho_total])
    estilo_monto = TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ])
    tabla_monto.setStyle(estilo_monto)

    # 6. TÉRMINOS Y DATOS BANCARIOS
    note_1_color = colors.HexColor(user.pdf_note_1_color or "#FF0000")
    style_red_bold = ParagraphStyle(name='RedBold', parent=styles['Normal'], textColor=note_1_color, fontName='Helvetica-Bold')
    terminos_1 = Paragraph(user.pdf_note_1 or "", style_red_bold)
    terminos_2 = Paragraph(user.pdf_note_2 or "", styles['Normal'])
    
    bank_info_text = "<b>Datos para la Transferencia</b><br/>"
    if user.bank_accounts and isinstance(user.bank_accounts, list):
        for account in user.bank_accounts:
            bank_info_text += f"<b>{account.get('banco', '')}</b><br/>"
            bank_info_text += f"Cuenta: {account.get('cuenta', '')}<br/>"
            bank_info_text += f"CCI: {account.get('cci', '')}<br/><br/>"
    banco_info = Paragraph(bank_info_text, styles['Normal'])

    # 7. RECTÁNGULO (función onFirstPage)
    def agregar_rectangulo_personalizado(canvas, doc):
        canvas.saveState()
        x = margen_izq + (ancho_total * 0.80)
        y = doc.height + doc.topMargin - 82
        ancho = ancho_total * 0.20
        alto = 80
        canvas.setStrokeColor(color_principal)
        canvas.setLineWidth(1.5)
        canvas.roundRect(x, y, ancho, alto, 5, stroke=1, fill=0)
        canvas.restoreState()
    
    # Construir PDF
    elementos = [
        tabla_principal,
        Spacer(1, 20),
        tabla_cliente,
        Spacer(1, 20),
        tabla_productos,
        tabla_total,
        tabla_monto,
        Spacer(1, 20),
        terminos_1,
        terminos_2,
        Spacer(1, 12),
        banco_info
    ]
    
    doc.build(elementos, onFirstPage=agregar_rectangulo_personalizado, onLaterPages=agregar_rectangulo_personalizado)
    
    buffer.seek(0)
    return buffer