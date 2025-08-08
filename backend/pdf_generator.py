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
from num2words import num2words

# --- FUNCIÓN PARA COTIZACIÓN (ESTILO BASE DE LA RAMA PRINCIPAL) ---
def create_cotizacion_pdf(cotizacion: models.Cotizacion, user: models.User):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=20, rightMargin=20,
                            topMargin=20, bottomMargin=20)
    
    styles = getSampleStyleSheet()
    header_text_style = ParagraphStyle(name='HeaderText', parent=styles['Normal'], alignment=TA_CENTER)
    header_bold_style = ParagraphStyle(name='HeaderBold', parent=header_text_style, fontName='Helvetica-Bold')
    
    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if cotizacion.moneda == "SOLES" else "$"
    ancho_total = letter[0] - 40

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
        [logo, business_name_p, Paragraph(f"RUC {user.business_ruc or 'NO ESPECIFICADO'}", styles['Normal'])],
        ["", business_address_p, Paragraph("COTIZACIÓN", header_bold_style)],
        ["", contact_info_p, Paragraph(f"N° {cotizacion.numero_cotizacion}", header_bold_style)]
    ]

    tabla_principal = Table(data_principal, colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20])
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
    ]))

    fecha_emision = cotizacion.fecha_creacion.strftime("%d/%m/%Y")
    fecha_vencimiento = (cotizacion.fecha_creacion + relativedelta(months=1)).strftime("%d/%m/%Y")
    
    data_cliente = [
        ["Señores:", Paragraph(cotizacion.nombre_cliente, styles['Normal']), "Emisión:", fecha_emision],
        [f"{cotizacion.tipo_documento}:", cotizacion.nro_documento, "Vencimiento:", fecha_vencimiento],
        ["Dirección:", Paragraph(cotizacion.direccion_cliente, styles['Normal']), "Moneda:", cotizacion.moneda]
    ]
    
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.10, ancho_total * 0.60, ancho_total * 0.15, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), 
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
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
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'), ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold')
    ]))

    data_monto = [[f"IMPORTE TOTAL A PAGAR {simbolo} {cotizacion.monto_total:.2f}"]]
    tabla_monto = Table(data_monto, colWidths=[ancho_total])
    tabla_monto.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'), 
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), 
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))
    
    note_1_color = colors.HexColor(user.pdf_note_1_color or "#FF0000")
    style_red_bold = ParagraphStyle(name='RedBold', parent=styles['Normal'], textColor=note_1_color, fontName='Helvetica-Bold')
    terminos_1 = Paragraph(user.pdf_note_1 or "", style_red_bold)
    terminos_2 = Paragraph(user.pdf_note_2 or "", styles['Normal'])
    
    bank_info_text = "<b>Datos para la Transferencia</b><br/>"
    if user.bank_accounts and isinstance(user.bank_accounts, list):
        for account in user.bank_accounts:
            bank_info_text += f"<b>{account.get('banco', '')}</b><br/>"
            bank_info_text += f"{account.get('tipo_cuenta', '')} en {account.get('moneda', '')}: {account.get('cuenta', '')}<br/>"
            bank_info_text += f"CCI: {account.get('cci', '')}<br/><br/>"
    banco_info = Paragraph(bank_info_text, styles['Normal'])
    
    def agregar_rectangulo_personalizado(canvas, doc):
        canvas.saveState()
        x = 20 + (ancho_total * 0.80)
        y = doc.height + doc.topMargin - 82
        ancho = ancho_total * 0.20
        alto = 80
        canvas.setStrokeColor(color_principal)
        canvas.setLineWidth(1.5)
        canvas.roundRect(x, y, ancho, alto, 5, stroke=1, fill=0)
        canvas.restoreState()
    
    elementos = [
        tabla_principal, Spacer(1, 20), 
        tabla_cliente, Spacer(1, 20), 
        tabla_productos, tabla_total, tabla_monto, Spacer(1, 20),
        terminos_1, terminos_2, Spacer(1, 12), banco_info
    ]
    
    doc.build(elementos, onFirstPage=agregar_rectangulo_personalizado, onLaterPages=agregar_rectangulo_personalizado)
    
    buffer.seek(0)
    return buffer

# --- FUNCIÓN PARA COMPROBANTES (CON ESTILO UNIFICADO) ---
def create_comprobante_pdf(comprobante: models.Comprobante, user: models.User):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=20, rightMargin=20,
                            topMargin=20, bottomMargin=20)
    
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
    moneda_texto = "SOLES" if payload.get('tipoMoneda') == "PEN" else "DÓLARES"
    tipo_doc_str = 'FACTURA ELECTRÓNICA' if payload.get('tipoDoc') == '01' else 'BOLETA DE VENTA ELECTRÓNICA'
    ancho_total = letter[0] - 40

    logo = ""
    if user.logo_filename:
        logo_path = f"logos/{user.logo_filename}"
        if os.path.exists(logo_path):
            try: logo = Image(logo_path, width=151, height=76)
            except Exception: logo = ""
    
    business_name_p = Paragraph(company.get('razonSocial', ''), header_bold_style)
    business_address_p = Paragraph(company.get('address', {}).get('direccion', ''), header_text_style)
    contact_info_p = Paragraph(f"{user.email}<br/>{user.business_phone or ''}", header_text_style)

    data_principal = [
        [logo, business_name_p, Paragraph(f"RUC: {company.get('ruc', '')}", styles['Normal'])],
        ["", business_address_p, Paragraph(tipo_doc_str, header_bold_style)],
        ["", contact_info_p, Paragraph(f"N° {comprobante.serie}-{comprobante.correlativo}", header_bold_style)]
    ]
    
    tabla_principal = Table(data_principal, colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20])
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
    ]))

    fecha_emision = datetime.fromisoformat(payload.get('fechaEmision')).strftime("%d/%m/%Y")
    tipo_doc_cliente = "RUC" if client.get('tipoDoc') == "6" else "DNI"
    data_cliente = [
        ["Señores:", Paragraph(client.get('rznSocial', ''), styles['Normal']), "Emisión:", fecha_emision],
        [f"{tipo_doc_cliente}:", str(client.get('numDoc', '')), "Moneda:", moneda_texto],
        ["Dirección:", Paragraph(client.get('address', {}).get('direccion', ''), styles['Normal']), "", ""]
    ]
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.10, ancho_total * 0.65, ancho_total * 0.10, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    table_header = [("Descripción", "Cantidad", "P. Unit.", "Total")]
    table_data = []
    for item in details:
        table_data.append([Paragraph(item.get('descripcion'), styles['Normal']), item.get('cantidad'), f"{simbolo} {item.get('mtoPrecioUnitario'):.2f}", f"{simbolo} {item.get('mtoValorVenta'):.2f}"])
    
    tabla_productos = Table([table_header] + table_data, colWidths=[ancho_total * 0.55, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color_principal), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    totals_data = [["Op. Gravada:", f"{simbolo} {payload.get('mtoOperGravadas'):.2f}"], ["IGV (18%):", f"{simbolo} {payload.get('mtoIGV'):.2f}"], ["Importe Total:", f"{simbolo} {payload.get('mtoImpVenta'):.2f}"]]
    tabla_total = Table(totals_data, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'RIGHT'), ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold')]))

    monto_total_num = payload.get('mtoImpVenta', 0.0)
    data_monto_numerico = [[f"IMPORTE TOTAL A PAGAR {simbolo} {monto_total_num:.2f}"]]
    tabla_monto_numerico = Table(data_monto_numerico, colWidths=[ancho_total])
    tabla_monto_numerico.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, 0), (-1, 0), 1.5, color_principal),
    ]))
    
    legend_text = payload.get('legends', [{}])[0].get('value', '')
    data_monto_letras = [[legend_text]]
    tabla_monto_letras = Table(data_monto_letras, colWidths=[ancho_total])
    tabla_monto_letras.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
    ]))

    qr_data = "|".join([str(v) for v in [company.get('ruc'), payload.get('tipoDoc'), comprobante.serie, comprobante.correlativo, payload.get('mtoIGV'), payload.get('mtoImpVenta'), datetime.fromisoformat(payload.get('fechaEmision')).strftime('%Y-%m-%d'), client.get('tipoDoc'), client.get('numDoc')]])
    qr_img = qrcode.make(qr_data, box_size=4, border=1)
    qr_img_buffer = io.BytesIO()
    qr_img.save(qr_img_buffer, format='PNG')
    qr_img_buffer.seek(0)
    qr_code_image = Image(qr_img_buffer, width=1*inch, height=1*inch)
    hash_style = ParagraphStyle(name='Hash', parent=styles['Normal'], fontSize=7, alignment=TA_CENTER)
    hash_p = Paragraph(f"<b>Hash:</b><br/>{comprobante.sunat_hash or ''}", hash_style)
    
    qr_and_hash_table = Table([[qr_code_image], [Spacer(1, 6)], [hash_p]], colWidths=[ancho_total * 0.25])
    qr_and_hash_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    
    final_table = Table([["", qr_and_hash_table]], colWidths=[ancho_total * 0.75, ancho_total * 0.25])
    final_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    
    legal_text_str = f"Representación Impresa de la {tipo_doc_str.upper()}. El usuario puede consultar su validez en SUNAT Virtual: www.sunat.gob.pe, en Operaciones sin Clave SOL / Consulta de validez del CPE."
    legal_style = ParagraphStyle(name='LegalText', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, borderColor=colors.black, borderPadding=5, borderWidth=1)
    legal_paragraph = Paragraph(legal_text_str, legal_style)

    def agregar_rectangulo_comprobante(canvas, doc):
        canvas.saveState()
        x = 20 + (ancho_total * 0.70)
        y = doc.height + doc.topMargin - 82
        ancho = ancho_total * 0.30
        alto = 80
        canvas.setStrokeColor(color_principal)
        canvas.setLineWidth(1.5)
        canvas.roundRect(x, y, ancho, alto, 5, stroke=1, fill=0)
        canvas.restoreState()

    elementos = [
        tabla_principal, Spacer(1, 20), 
        tabla_cliente, Spacer(1, 20), 
        tabla_productos, tabla_total, 
        tabla_monto_numerico, tabla_monto_letras,
        Spacer(1, 20), final_table, Spacer(1, 30),
        legal_paragraph
    ]
    
    doc.build(elementos, onFirstPage=agregar_rectangulo_comprobante, onLaterPages=agregar_rectangulo_comprobante)
    
    buffer.seek(0)
    return buffer
