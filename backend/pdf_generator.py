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

# --- FUNCIÓN PARA COTIZACIÓN (ESTILO EXACTO DE LA RAMA PRINCIPAL) ---
def create_cotizacion_pdf(cotizacion: models.Cotizacion, user: models.User):
    buffer = io.BytesIO()
    margen_izq, margen_der = 40, 40
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=margen_izq, rightMargin=margen_der, topMargin=20, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    # Estilos replicando el diseño original
    style_regular = ParagraphStyle(name='Regular', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=12)
    style_bold = ParagraphStyle(name='Bold', parent=style_regular, fontName='Helvetica-Bold')
    style_header_center = ParagraphStyle(name='HeaderCenter', parent=style_bold, fontSize=11, alignment=TA_CENTER)
    style_header_info = ParagraphStyle(name='HeaderInfo', parent=style_regular, fontSize=10, alignment=TA_CENTER, leading=14)

    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if cotizacion.moneda == "SOLES" else "$"

    logo = ""
    if user.logo_filename and os.path.exists(f"logos/{user.logo_filename}"):
        try: logo = Image(f"logos/{user.logo_filename}", width=151, height=76)
        except Exception: logo = ""
    
    # --- Cabecera ---
    business_name_p = Paragraph(user.business_name or "Nombre del Negocio", style_header_center)
    business_info_p = Paragraph(f"{user.business_address or ''}<br/>{user.email or ''}<br/>{user.business_phone or ''}", style_header_info)
    
    header_data = [
        [logo, business_name_p],
        ['', business_info_p]
    ]
    header_table = Table(header_data, colWidths=[ancho_total * 0.4, ancho_total * 0.6])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, 1)),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
    ]))

    # --- Caja de Cotización ---
    cotizacion_box_data = [
        [Paragraph(f"RUC {user.business_ruc or 'NO ESPECIFICADO'}", style_bold)],
        [Paragraph("COTIZACIÓN", style_bold)],
        [Paragraph(f"N° {cotizacion.numero_cotizacion}", style_bold)]
    ]
    cotizacion_box_table = Table(cotizacion_box_data, colWidths=[ancho_total * 0.3])
    cotizacion_box_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 1.5, color_principal),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    # --- Combinar cabecera y caja de cotización ---
    top_table = Table([[header_table, cotizacion_box_table]], colWidths=[ancho_total * 0.7, ancho_total * 0.3])
    top_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

    fecha_emision = cotizacion.fecha_creacion.strftime("%d/%m/%Y")
    fecha_vencimiento = (cotizacion.fecha_creacion + relativedelta(months=1)).strftime("%d/%m/%Y")

    # --- Datos del Cliente ---
    data_cliente = [
        [Paragraph("<b>Señores:</b>", style_regular), Paragraph(cotizacion.nombre_cliente, style_regular), Paragraph("<b>Emisión:</b>", style_regular), Paragraph(fecha_emision, style_regular)],
        [Paragraph(f"<b>{cotizacion.tipo_documento}:</b>", style_regular), Paragraph(cotizacion.nro_documento, style_regular), Paragraph("<b>Vencimiento:</b>", style_regular), Paragraph(fecha_vencimiento, style_regular)],
        [Paragraph("<b>Dirección:</b>", style_regular), Paragraph(cotizacion.direccion_cliente, style_regular), Paragraph("<b>Moneda:</b>", style_regular), Paragraph(cotizacion.moneda, style_regular)]
    ]
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.12, ancho_total * 0.58, ancho_total * 0.15, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    # --- Tabla de Productos ---
    header_style_white = ParagraphStyle(name='HeaderWhite', parent=style_bold, textColor=colors.white)
    data_productos = [[Paragraph(h, header_style_white) for h in ["Descripción", "Cantidad", "P.Unit", "IGV", "Precio"]]]
    for prod in cotizacion.productos:
        precio_unitario_sin_igv = prod.precio_unitario / 1.18
        igv_producto = prod.total - (prod.total / 1.18)
        data_productos.append([
            Paragraph(prod.descripcion, style_regular), Paragraph(str(prod.unidades), style_regular),
            Paragraph(f"{simbolo} {precio_unitario_sin_igv:.2f}", style_regular), Paragraph(f"{simbolo} {igv_producto:.2f}", style_regular), Paragraph(f"{simbolo} {prod.total:.2f}", style_regular)
        ])
    tabla_productos = Table(data_productos, colWidths=[ancho_total * 0.40, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, 0), color_principal),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    # --- Totales ---
    total_gravado = cotizacion.monto_total / 1.18
    total_igv = cotizacion.monto_total - total_gravado
    data_total = [
        [Paragraph("Total Gravado", style_regular), Paragraph(f"{simbolo} {total_gravado:.2f}", style_regular)],
        [Paragraph("Total IGV", style_regular), Paragraph(f"{simbolo} {total_igv:.2f}", style_regular)],
        [Paragraph("<b>Importe Total</b>", style_regular), Paragraph(f"<b>{simbolo} {cotizacion.monto_total:.2f}</b>", style_regular)]
    ]
    tabla_total = Table(data_total, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'), ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    # --- Monto Total a Pagar ---
    monto_bold_style = ParagraphStyle(name='MontoBold', parent=style_bold, alignment=TA_CENTER)
    data_monto = [[Paragraph(f"IMPORTE TOTAL A PAGAR {simbolo} {cotizacion.monto_total:.2f}", monto_bold_style)]]
    tabla_monto = Table(data_monto, colWidths=[ancho_total])
    tabla_monto.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    # --- Footer ---
    note_1_color = colors.HexColor(user.pdf_note_1_color or "#FF0000")
    style_red_bold = ParagraphStyle(name='RedBold', parent=style_bold, textColor=note_1_color)
    terminos_1 = Paragraph(user.pdf_note_1 or "", style_red_bold)
    terminos_2 = Paragraph(user.pdf_note_2 or "", style_regular)
    
    bank_info_text = "<b>Datos para la Transferencia</b><br/>"
    if user.business_name: bank_info_text += f"Beneficiario: {user.business_name.upper()}<br/><br/>"
    if user.bank_accounts and isinstance(user.bank_accounts, list):
        for account in user.bank_accounts:
            banco, tipo_cuenta, moneda, cuenta, cci = account.get('banco', ''), account.get('tipo_cuenta') or 'Cta Ahorro', account.get('moneda') or 'Soles', account.get('cuenta', ''), account.get('cci', '')
            if banco:
                bank_info_text += f"<b>{banco}</b><br/>"
                label_cuenta = f"Cuenta Detracción en {moneda}" if 'nación' in banco.lower() else f"{tipo_cuenta} en {moneda}"
                if cuenta: bank_info_text += f"{label_cuenta}: {cuenta}<br/>"
                if cci: bank_info_text += f"CCI: {cci}<br/>"
                bank_info_text += "<br/>"
    banco_info = Paragraph(bank_info_text, style_regular)

    elementos = [
        top_table, Spacer(1, 20), tabla_cliente, Spacer(1, 20),
        tabla_productos, Spacer(1, 5), tabla_total, Spacer(1, 5), tabla_monto, Spacer(1, 20),
        terminos_1, terminos_2, Spacer(1, 12), banco_info
    ]
    doc.build(elementos)
    buffer.seek(0)
    return buffer

# --- FUNCIÓN PARA COMPROBANTES (ESTILO EXACTO DE LA RAMA PRINCIPAL) ---
def create_comprobante_pdf(comprobante: models.Comprobante, user: models.User):
    buffer = io.BytesIO()
    margen_izq, margen_der = 40, 40
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=margen_izq, rightMargin=margen_der, topMargin=20, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    style_regular = ParagraphStyle(name='Regular', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=12)
    style_bold = ParagraphStyle(name='Bold', parent=style_regular, fontName='Helvetica-Bold')
    style_header_center = ParagraphStyle(name='HeaderCenter', parent=style_bold, fontSize=11, alignment=TA_CENTER)
    style_header_info = ParagraphStyle(name='HeaderInfo', parent=style_regular, fontSize=10, alignment=TA_CENTER, leading=14)

    payload = comprobante.payload_enviado
    if not payload: raise ValueError("El comprobante no tiene payload para generar el PDF.")

    client, company, details = payload.get('client', {}), payload.get('company', {}), payload.get('details', [])
    color_principal = colors.HexColor(user.primary_color or '#004aad')
    simbolo = "S/" if payload.get('tipoMoneda') == "PEN" else "$"
    moneda_texto = "SOLES" if payload.get('tipoMoneda') == "PEN" else "DÓLARES"
    tipo_doc_str = 'FACTURA ELECTRÓNICA' if payload.get('tipoDoc') == '01' else 'BOLETA DE VENTA ELECTRÓNICA'

    logo = ""
    if user.logo_filename and os.path.exists(f"logos/{user.logo_filename}"):
        try: logo = Image(f"logos/{user.logo_filename}", width=151, height=76)
        except Exception: logo = ""
    
    business_name_p = Paragraph(company.get('razonSocial', ''), style_header_center)
    business_info_p = Paragraph(f"{company.get('address', {}).get('direccion', '')}<br/>{user.email or ''}<br/>{user.business_phone or ''}", style_header_info)
    
    header_data = [[logo, business_name_p], ['', business_info_p]]
    header_table = Table(header_data, colWidths=[ancho_total * 0.4, ancho_total * 0.6])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('SPAN', (0, 0), (0, 1)),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'), ('ALIGN', (1, 0), (1, -1), 'CENTER'),
    ]))

    comprobante_box_data = [
        [Paragraph(f"RUC: {company.get('ruc', '')}", style_bold)],
        [Paragraph(tipo_doc_str, style_bold)],
        [Paragraph(f"N° {comprobante.serie}-{comprobante.correlativo}", style_bold)]
    ]
    comprobante_box_table = Table(comprobante_box_data, colWidths=[ancho_total * 0.3])
    comprobante_box_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 1.5, color_principal), ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    top_table = Table([[header_table, comprobante_box_table]], colWidths=[ancho_total * 0.7, ancho_total * 0.3])
    top_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))

    fecha_emision = datetime.fromisoformat(payload.get('fechaEmision')).strftime("%d/%m/%Y")
    tipo_doc_cliente = "RUC" if client.get('tipoDoc') == "6" else "DNI"
    data_cliente = [
        [Paragraph("<b>Señores:</b>", style_regular), Paragraph(client.get('rznSocial', ''), style_regular), Paragraph("<b>Emisión:</b>", style_regular), Paragraph(fecha_emision, style_regular)],
        [Paragraph(f"<b>{tipo_doc_cliente}:</b>", style_regular), Paragraph(str(client.get('numDoc', '')), style_regular), Paragraph("<b>Moneda:</b>", style_regular), Paragraph(moneda_texto, style_regular)],
        [Paragraph("<b>Dirección:</b>", style_regular), Paragraph(client.get('address', {}).get('direccion', ''), style_regular), "", ""]
    ]
    tabla_cliente = Table(data_cliente, colWidths=[ancho_total * 0.12, ancho_total * 0.58, ancho_total * 0.15, ancho_total * 0.15])
    tabla_cliente.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    header_style_white = ParagraphStyle(name='HeaderWhite', parent=style_bold, textColor=colors.white)
    table_header = [Paragraph(h, header_style_white) for h in ["Descripción", "Cantidad", "P. Unit.", "Total"]]
    table_data = []
    for item in details:
        table_data.append([
            Paragraph(item.get('descripcion', ''), style_regular), Paragraph(str(item.get('cantidad', '')), style_regular), 
            Paragraph(f"{simbolo} {item.get('mtoPrecioUnitario', 0):.2f}", style_regular), Paragraph(f"{simbolo} {item.get('mtoValorVenta', 0):.2f}", style_regular)
        ])
    tabla_productos = Table([table_header] + table_data, colWidths=[ancho_total * 0.55, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, 0), color_principal),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    totals_data = [
        [Paragraph("Op. Gravada:", style_regular), Paragraph(f"{simbolo} {payload.get('mtoOperGravadas', 0):.2f}", style_regular)],
        [Paragraph("IGV (18%):", style_regular), Paragraph(f"{simbolo} {payload.get('mtoIGV', 0):.2f}", style_regular)],
        [Paragraph("<b>Importe Total:</b>", style_regular), Paragraph(f"<b>{simbolo} {payload.get('mtoImpVenta', 0):.2f}</b>", style_regular)]
    ]
    tabla_total = Table(totals_data, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'), ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    legend_text = payload.get('legends', [{}])[0].get('value', '')
    monto_letras_style = ParagraphStyle(name='MontoLetras', parent=style_bold, alignment=TA_CENTER)
    data_monto_letras = [[Paragraph(legend_text, monto_letras_style)]]
    tabla_monto_letras = Table(data_monto_letras, colWidths=[ancho_total])
    tabla_monto_letras.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    qr_data = "|".join([str(v) for v in [company.get('ruc'), payload.get('tipoDoc'), comprobante.serie, comprobante.correlativo, payload.get('mtoIGV'), payload.get('mtoImpVenta'), datetime.fromisoformat(payload.get('fechaEmision')).strftime('%Y-%m-%d'), client.get('tipoDoc'), client.get('numDoc')]])
    qr_img = qrcode.make(qr_data, box_size=4, border=1)
    qr_img_buffer = io.BytesIO(); qr_img.save(qr_img_buffer, format='PNG'); qr_img_buffer.seek(0)
    qr_code_image = Image(qr_img_buffer, width=1*inch, height=1*inch)
    hash_style = ParagraphStyle(name='Hash', parent=style_regular, fontSize=7, alignment=TA_CENTER)
    hash_p = Paragraph(f"<b>Hash:</b><br/>{comprobante.sunat_hash or ''}", hash_style)
    
    qr_and_hash_table = Table([[qr_code_image], [Spacer(1, 6)], [hash_p]], colWidths=[ancho_total * 0.25])
    qr_and_hash_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    
    final_table = Table([["", qr_and_hash_table]], colWidths=[ancho_total * 0.75, ancho_total * 0.25])
    final_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    
    legal_text_str = f"Representación Impresa de la {tipo_doc_str.upper()}. El usuario puede consultar su validez en SUNAT Virtual: www.sunat.gob.pe, en Operaciones sin Clave SOL / Consulta de validez del CPE."
    legal_style = ParagraphStyle(name='LegalText', parent=style_regular, fontSize=8, alignment=TA_CENTER, borderColor=colors.black, borderPadding=5, borderWidth=1)
    legal_paragraph = Paragraph(legal_text_str, legal_style)

    elementos = [
        top_table, Spacer(1, 20), 
        tabla_cliente, Spacer(1, 20), 
        tabla_productos, Spacer(1, 5), tabla_total, Spacer(1, 5),
        tabla_monto_letras,
        Spacer(1, 20), final_table, Spacer(1, 30),
        legal_paragraph
    ]
    
    doc.build(elementos)
    buffer.seek(0)
    return buffer
