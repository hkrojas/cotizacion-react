# backend/pdf_generator.py
import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Image, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from dateutil.relativedelta import relativedelta
import models
import qrcode
from PIL import Image as PILImage

# --- FUNCIÓN ORIGINAL DE COTIZACIÓN (SE MANTIENE IGUAL) ---
def create_cotizacion_pdf(cotizacion: models.Cotizacion, user: models.User):
    buffer = io.BytesIO()
    margen_izq = 20
    margen_der = 20
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=margen_izq, rightMargin=margen_der,
                            topMargin=20, bottomMargin=20)
    
    styles = getSampleStyleSheet()
    header_text_style = ParagraphStyle(name='HeaderText', parent=styles['Normal'], alignment=TA_CENTER)
    header_bold_style = ParagraphStyle(name='HeaderBold', parent=header_text_style, fontName='Helvetica-Bold')

    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if cotizacion.moneda == "SOLES" else "$"

    logo = ""
    if user.logo_filename:
        logo_path = f"logos/{user.logo_filename}"
        if os.path.exists(logo_path):
            try:
                logo = Image(logo_path, width=151, height=76)
            except Exception:
                logo = ""
    
    business_name_p = Paragraph(user.business_name or "Nombre del Negocio", header_bold_style)
    business_address_p = Paragraph(user.business_address or "Dirección no especificada", header_text_style)
    contact_info_p = Paragraph(f"{user.email}<br/>{user.business_phone or ''}", header_text_style)

    data_principal = [
        [logo, business_name_p, f"RUC {user.business_ruc or 'NO ESPECIFICADO'}"],
        ["", business_address_p, "COTIZACIÓN"],
        ["", contact_info_p, f"N° {cotizacion.numero_cotizacion}"]
    ]

    tabla_principal = Table(data_principal, colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20])
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'), ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
    ]))

    fecha_emision = cotizacion.fecha_creacion.strftime("%d/%m/%Y")
    fecha_vencimiento = (cotizacion.fecha_creacion + relativedelta(months=1)).strftime("%d/%m/%Y")
    nombre_cliente_p = Paragraph(cotizacion.nombre_cliente, styles['Normal'])
    direccion_cliente_p = Paragraph(cotizacion.direccion_cliente, styles['Normal'])

    data_cliente = [
        ["Señores:", nombre_cliente_p, " Emisión:", fecha_emision],
        [f"{cotizacion.tipo_documento}:", cotizacion.nro_documento, " Vencimiento:", fecha_vencimiento],
        ["Dirección:", direccion_cliente_p, " Moneda:", cotizacion.moneda]
    ]
    
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.10, ancho_total * 0.60, ancho_total * 0.15, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    data_productos = [["Descripción", "Cantidad", "P.Unit", "IGV", "Precio"]]
    for prod in cotizacion.productos:
        igv_producto = prod.total * (18 / 118)
        precio_unitario_sin_igv = prod.precio_unitario / 1.18
        data_productos.append([
            Paragraph(prod.descripcion, styles['Normal']), prod.unidades,
            f"{simbolo} {precio_unitario_sin_igv:.2f}", f"{simbolo} {igv_producto:.2f}", f"{simbolo} {prod.total:.2f}"
        ])
    
    tabla_productos = Table(data_productos, colWidths=[ancho_total * 0.40, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color_principal), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    total_igv = cotizacion.monto_total * (18 / 118)
    total_gravado = cotizacion.monto_total - total_igv
    data_total = [
        ["Total Gravado", f"{simbolo} {total_gravado:.2f}"],
        ["Total IGV ", f"{simbolo} {total_igv:.2f}"],
        ["Importe Total", f"{simbolo} {cotizacion.monto_total:.2f}"]
    ]
    
    tabla_total = Table(data_total, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'), ('ALIGN', (1, 0), (1, -1), 'CENTER')
    ]))

    data_monto = [[f"IMPORTE TOTAL A PAGAR {simbolo} {cotizacion.monto_total:.2f}"]]
    tabla_monto = Table(data_monto, colWidths=[ancho_total])
    tabla_monto.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'), ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))
    
    # ... (Resto de la función de cotización sin cambios)

    elementos = [tabla_principal, Spacer(1, 20), tabla_cliente, Spacer(1, 20), tabla_productos, tabla_total, tabla_monto]
    doc.build(elementos)
    
    buffer.seek(0)
    return buffer

# --- FUNCIÓN DE COMPROBANTE CON DISEÑO CORREGIDO ---
def create_comprobante_pdf(comprobante: models.Comprobante, user: models.User):
    buffer = io.BytesIO()
    margen_izq = 20
    margen_der = 20
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=margen_izq, rightMargin=margen_der, topMargin=20, bottomMargin=20)
    
    styles = getSampleStyleSheet()
    header_text_style = ParagraphStyle(name='HeaderText', parent=styles['Normal'], alignment=TA_CENTER)
    header_bold_style = ParagraphStyle(name='HeaderBold', parent=header_text_style, fontName='Helvetica-Bold')

    payload = comprobante.payload_enviado
    if not payload:
        raise ValueError("El comprobante no tiene un payload guardado para generar el PDF.")

    client = payload.get('client', {})
    company = payload.get('company', {})
    details = payload.get('details', [])
    
    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if payload.get('tipoMoneda') == "PEN" else "$"

    logo = ""
    if user.logo_filename:
        logo_path = f"logos/{user.logo_filename}"
        if os.path.exists(logo_path):
            try: logo = Image(logo_path, width=151, height=76)
            except Exception: logo = ""
    
    business_name_p = Paragraph(company.get('razonSocial', ''), header_bold_style)
    business_address_p = Paragraph(company.get('address', {}).get('direccion', ''), header_text_style)
    contact_info_p = Paragraph(f"{user.email}<br/>{user.business_phone or ''}", header_text_style)
    tipo_doc_str = 'FACTURA ELECTRÓNICA' if payload.get('tipoDoc') == '01' else 'BOLETA DE VENTA ELECTRÓNICA'

    data_principal = [
        [logo, business_name_p, f"RUC {company.get('ruc', '')}"],
        ["", business_address_p, tipo_doc_str],
        ["", contact_info_p, f"N° {comprobante.serie}-{comprobante.correlativo}"]
    ]
    tabla_principal = Table(data_principal, colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20])
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'), ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),
    ]))

    fecha_emision = datetime.fromisoformat(payload.get('fechaEmision')).strftime("%d/%m/%Y")
    nombre_cliente_p = Paragraph(client.get('rznSocial', ''), styles['Normal'])
    direccion_cliente_p = Paragraph(client.get('address', {}).get('direccion', ''), styles['Normal'])
    tipo_doc_cliente = "RUC" if client.get('tipoDoc') == "6" else "DNI"

    data_cliente = [
        ["Señores:", nombre_cliente_p, " Emisión:", fecha_emision],
        [f"{tipo_doc_cliente}:", str(client.get('numDoc', '')), "", ""],
        ["Dirección:", direccion_cliente_p, "", ""]
    ]
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.10, ancho_total * 0.65, ancho_total * 0.10, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    table_header = [("Descripción", "Cantidad", "P. Unit.", "Total")]
    table_data = []
    for item in details:
        table_data.append([
            Paragraph(item.get('descripcion'), styles['Normal']), item.get('cantidad'),
            f"{simbolo} {item.get('mtoPrecioUnitario'):.2f}", f"{simbolo} {item.get('mtoValorVenta'):.2f}"
        ])
    product_table_data = table_header + table_data
    tabla_productos = Table(product_table_data, colWidths=[ancho_total * 0.55, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color_principal), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    totals_data = [
        ["Op. Gravada:", f"{simbolo} {payload.get('mtoOperGravadas'):.2f}"],
        ["IGV (18%):", f"{simbolo} {payload.get('mtoIGV'):.2f}"],
        ["Importe Total:", f"{simbolo} {payload.get('mtoImpVenta'):.2f}"]
    ]
    tabla_total = Table(totals_data, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'RIGHT'), ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold')]))

    legend_text = payload.get('legends', [{}])[0].get('value', '')
    
    qr_data = "|".join([str(v) for v in [company.get('ruc'), payload.get('tipoDoc'), payload.get('serie'), comprobante.correlativo, payload.get('mtoIGV'), payload.get('mtoImpVenta'), datetime.fromisoformat(payload.get('fechaEmision')).strftime('%Y-%m-%d'), client.get('tipoDoc'), client.get('numDoc')]])
    qr_img = qrcode.make(qr_data, box_size=4, border=1)
    qr_img_buffer = io.BytesIO()
    qr_img.save(qr_img_buffer, format='PNG')
    qr_img_buffer.seek(0)
    qr_code_image = Image(qr_img_buffer, width=1.2*inch, height=1.2*inch)

    hash_style = ParagraphStyle(name='Hash', parent=styles['Normal'], fontSize=7)
    hash_p = Paragraph(f"<b>Hash:</b><br/>{comprobante.sunat_hash or ''}", hash_style)
    
    # Tabla final para QR y Hash a la derecha
    final_data = [[Paragraph(legend_text, styles['Normal']), qr_code_image, hash_p]]
    final_table = Table(final_data, colWidths=[ancho_total * 0.60, ancho_total * 0.15, ancho_total * 0.25])
    final_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))

    def agregar_rectangulo(canvas, doc):
        canvas.saveState()
        x = margen_izq + (ancho_total * 0.70)
        y = doc.height + doc.topMargin - 82
        ancho = ancho_total * 0.30
        alto = 80
        canvas.setStrokeColor(color_principal)
        canvas.setLineWidth(1.5)
        canvas.roundRect(x, y, ancho, alto, 5, stroke=1, fill=0)
        canvas.restoreState()

    elementos = [tabla_principal, Spacer(1, 20), tabla_cliente, Spacer(1, 20), tabla_productos, tabla_total, Spacer(1, 20), final_table]
    
    doc.build(elementos, onFirstPage=agregar_rectangulo, onLaterPages=agregar_rectangulo)
    
    buffer.seek(0)
    return buffer
