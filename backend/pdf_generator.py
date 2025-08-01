import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Image, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
from dateutil.relativedelta import relativedelta
import models

def create_pdf_buffer(cotizacion: models.Cotizacion, user: models.User):
    buffer = io.BytesIO()
    margen_izq = 20
    margen_der = 20
    ancho_total = letter[0] - margen_izq - margen_der
    
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                            leftMargin=margen_izq, rightMargin=margen_der,
                            topMargin=20, bottomMargin=20)
    
    styles = getSampleStyleSheet()
    
    # --- NUEVO ESTILO PARA EL TEXTO DE LA CABECERA ---
    # Creamos un estilo centrado para los párrafos de la cabecera
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
    
    # --- CORRECCIÓN: ENVOLVEMOS TEXTOS LARGOS EN PÁRRAFOS ---
    # Esto permite que los textos largos se dividan en varias líneas automáticamente.
    business_name_p = Paragraph(user.business_name or "Nombre del Negocio", header_bold_style)
    business_address_p = Paragraph(user.business_address or "Dirección no especificada", header_text_style)
    contact_info_p = Paragraph(f"{user.email}<br/>{user.business_phone or ''}", header_text_style)

    data_principal = [
        [logo, business_name_p, f"RUC {user.business_ruc or 'NO ESPECIFICADO'}"],
        ["", business_address_p, "COTIZACIÓN"],
        ["", contact_info_p, f"N° {cotizacion.numero_cotizacion}"]
    ]
    # --- FIN DE LA CORRECCIÓN ---

    tabla_principal = Table(data_principal, colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20])
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),
        # Ya no necesitamos especificar la fuente aquí porque el Paragraph se encarga
        ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'), ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11), ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
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
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'), ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('LEFTPADDING', (0, 0), (-1, -1), 3), ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    data_productos = [["Descripción", "Cantidad", "P.Unit", "IGV", "Precio"]]
    for prod in cotizacion.productos:
        igv_producto = prod.total * (18 / 118)
        data_productos.append([
            Paragraph(prod.descripcion, styles['Normal']), prod.unidades,
            f"{simbolo} {prod.precio_unitario:.2f}", f"{simbolo} {igv_producto:.2f}", f"{simbolo} {prod.total:.2f}"
        ])
    
    tabla_productos = Table(data_productos, colWidths=[ancho_total * 0.40, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15])
    tabla_productos.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'), ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), color_principal), ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
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
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10), ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    data_monto = [[f"IMPORTE TOTAL A PAGAR {simbolo} {cotizacion.monto_total:.2f}"]]
    tabla_monto = Table(data_monto, colWidths=[ancho_total])
    tabla_monto.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal), ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    note_1_color = colors.HexColor(user.pdf_note_1_color or "#FF0000")
    style_red_bold = ParagraphStyle(name='RedBold', parent=styles['Normal'], textColor=note_1_color, fontName='Helvetica-Bold')
    terminos_1 = Paragraph(user.pdf_note_1 or "", style_red_bold)
    terminos_2 = Paragraph(user.pdf_note_2 or "", styles['Normal'])
    
    bank_info_text = "<b>Datos para la Transferencia</b><br/>"
    if user.business_name:
        bank_info_text += f"Beneficiario: {user.business_name.upper()}<br/><br/>"

    if user.bank_accounts and isinstance(user.bank_accounts, list):
        for account in user.bank_accounts:
            banco = account.get('banco', '')
            tipo_cuenta = account.get('tipo_cuenta') or 'Cta Ahorro'
            moneda = account.get('moneda') or 'Soles'
            cuenta = account.get('cuenta', '')
            cci = account.get('cci', '')

            if banco:
                bank_info_text += f"<b>{banco}</b><br/>"
                
                if 'nación' in banco.lower():
                    label_cuenta = f"Cuenta Detracción en {moneda}"
                else:
                    label_cuenta = f"{tipo_cuenta} en {moneda}"

                if cuenta and cci:
                    bank_info_text += f"{label_cuenta}: {cuenta} CCI: {cci}<br/>"
                elif cuenta:
                    bank_info_text += f"{label_cuenta}: {cuenta}<br/>"
                
                bank_info_text += "<br/>"

    banco_info = Paragraph(bank_info_text, styles['Normal'])

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
    
    elementos = [
        tabla_principal, Spacer(1, 20), tabla_cliente, Spacer(1, 20),
        tabla_productos, tabla_total, tabla_monto, Spacer(1, 20),
        terminos_1, terminos_2, Spacer(1, 12), banco_info
    ]
    
    doc.build(elementos, onFirstPage=agregar_rectangulo_personalizado, onLaterPages=agregar_rectangulo_personalizado)
    
    buffer.seek(0)
    return buffer
