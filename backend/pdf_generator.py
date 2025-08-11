# backend/pdf_generator.py
import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle, SimpleDocTemplate, Image, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.units import inch
from datetime import datetime
from dateutil.relativedelta import relativedelta
import models
import qrcode
from num2words import num2words


def create_pdf_buffer(document_data, user: models.User, document_type: str):
    """
    PDF unificado (cotización/comprobante) con encabezado 3x3:
      - Col 1: logo (celdas fusionadas)
      - Col 2: Nombre (fila 1) / Dirección (fila 2) / Email + Cel (fila 3)
      - Col 3: RUC (fila 1) / Título (fila 2) / Número (fila 3)
    Sin bordes. Rectángulo redondeado decorativo arriba a la derecha.
    """
    buffer = io.BytesIO()

    # Márgenes y ancho útil
    margen_izq = 20
    margen_der = 20
    ancho_total = letter[0] - margen_izq - margen_der

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=margen_izq,
        rightMargin=margen_der,
        topMargin=20,
        bottomMargin=20,
    )

    styles = getSampleStyleSheet()
    # Estilos (tamaños equivalentes a los del original)
    header_text_style = ParagraphStyle(name='HeaderText', parent=styles['Normal'], alignment=TA_CENTER, fontSize=11)
    header_bold_style = ParagraphStyle(name='HeaderBold', parent=header_text_style, fontName='Helvetica-Bold')
    body = styles['Normal']  # 10pt por defecto
    body_bold = ParagraphStyle(name='BodyBold', parent=body, fontName='Helvetica-Bold')

    color_principal = colors.HexColor(user.primary_color or '#004aad')

    # --- Datos según tipo de documento ---
    is_comprobante = (document_type == 'comprobante')

    if is_comprobante:
        payload = document_data.payload_enviado
        if not payload:
            raise ValueError("El comprobante no tiene payload para generar el PDF.")
        client = payload.get('client', {})
        company = payload.get('company', {})
        details = payload.get('details', [])
        simbolo = "S/" if payload.get('tipoMoneda') == "PEN" else "$"
        moneda_texto = "SOLES" if payload.get('tipoMoneda') == "PEN" else "DÓLARES"
        doc_title_str = 'FACTURA' if payload.get('tipoDoc') == '01' else 'BOLETA'
        doc_number_str = f"N° {document_data.serie}-{document_data.correlativo}"
        fecha_emision = datetime.fromisoformat(payload.get('fechaEmision')).strftime("%d/%m/%Y")
        fecha_vencimiento = fecha_emision
        nombre_cliente = client.get('rznSocial', '')
        tipo_doc_cliente_str = "RUC" if client.get('tipoDoc') == "6" else "DNI"
        nro_doc_cliente = str(client.get('numDoc', ''))
        direccion_cliente = client.get('address', {}).get('direccion', '')
        monto_total = float(payload.get('mtoImpVenta', 0))
        total_gravado = float(payload.get('mtoOperGravadas', 0))
        total_igv = float(payload.get('mtoIGV', 0))
        ruc_para_cuadro = company.get('ruc') or (user.business_ruc or '')
    else:
        simbolo = "S/" if document_data.moneda == "SOLES" else "$"
        moneda_texto = document_data.moneda
        doc_title_str = "COTIZACIÓN"
        doc_number_str = f"N° {document_data.numero_cotizacion}"
        fecha_emision = document_data.fecha_creacion.strftime("%d/%m/%Y")
        fecha_vencimiento = (document_data.fecha_creacion + relativedelta(months=1)).strftime("%d/%m/%Y")
        nombre_cliente = document_data.nombre_cliente
        tipo_doc_cliente_str = document_data.tipo_documento
        nro_doc_cliente = document_data.nro_documento
        direccion_cliente = document_data.direccion_cliente
        monto_total = float(document_data.monto_total)
        total_igv = monto_total * (18 / 118)
        total_gravado = monto_total - total_igv
        ruc_para_cuadro = user.business_ruc or ''

    # --- 1) Encabezado 3x3 (sin bordes) ---
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
    contact_info_p = Paragraph(f"{(user.email or '').strip()}<br/>{(user.business_phone or '').strip()}", header_text_style)

    ruc_p = Paragraph(f"RUC {ruc_para_cuadro}", header_text_style)
    titulo_p = Paragraph(doc_title_str, header_bold_style)
    numero_p = Paragraph(doc_number_str, header_bold_style)

    data_principal = [
        [logo, business_name_p, ruc_p],
        ["", business_address_p, titulo_p],
        ["", contact_info_p, numero_p],
    ]

    tabla_principal = Table(
        data_principal,
        colWidths=[ancho_total * 0.30, ancho_total * 0.50, ancho_total * 0.20],
    )
    tabla_principal.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('SPAN', (0, 0), (0, -1)),               # Logo ocupa las 3 filas
        ('FONTNAME', (2, 1), (2, 1), 'Helvetica-Bold'),  # Título
        ('FONTNAME', (2, 2), (2, 2), 'Helvetica-Bold'),  # N°
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        # Sin GRID ni BOX => sin bordes
    ]))

    # --- 2) Datos del Cliente ---
    nombre_cliente_p = Paragraph(nombre_cliente, body)
    direccion_cliente_p = Paragraph(direccion_cliente, body)

    data_cliente = [
        ["Señores:", nombre_cliente_p, " Emisión:", fecha_emision],
        [f"{tipo_doc_cliente_str}:", nro_doc_cliente, " Vencimiento:", fecha_vencimiento],
        ["Dirección:", direccion_cliente_p, " Moneda:", moneda_texto],
    ]
    tabla_cliente = Table(
        data_cliente,
        colWidths=[ancho_total * 0.10, ancho_total * 0.60, ancho_total * 0.15, ancho_total * 0.15],
    )
    tabla_cliente.setStyle(TableStyle([
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
    ]))

    # --- 3) Tabla de Productos ---
    # Header REALMENTE centrado (Paragraphs con alignment=TA_CENTER)
    centered_header = ParagraphStyle(name='CenteredHeader', parent=body_bold, alignment=TA_CENTER, textColor=colors.white)
    data_productos = [[
        Paragraph("Descripción", centered_header),
        Paragraph("Cantidad", centered_header),
        Paragraph("P.Unit", centered_header),
        Paragraph("IGV", centered_header),
        Paragraph("Precio", centered_header),
    ]]

    if is_comprobante:
        for item in details:
            precio_total_linea = float(item.get('mtoValorVenta', 0)) + float(item.get('igv', 0))
            data_productos.append([
                Paragraph(item.get('descripcion', ''), body),
                item.get('cantidad', 0),
                f"{simbolo} {item.get('mtoPrecioUnitario', 0):.2f}",
                f"{simbolo} {item.get('igv', 0):.2f}",
                f"{simbolo} {precio_total_linea:.2f}",
            ])
    else:
        for p in document_data.productos:
            igv_producto = p.total * (18 / 118)
            data_productos.append([
                Paragraph(p.descripcion, body),
                p.unidades,
                f"{simbolo} {p.precio_unitario:.2f}",
                f"{simbolo} {igv_producto:.2f}",
                f"{simbolo} {p.total:.2f}",
            ])

    tabla_productos = Table(
        data_productos,
        colWidths=[ancho_total * 0.40, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15, ancho_total * 0.15],
        repeatRows=1,
    )
    tabla_productos.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),     # encabezado centrado
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),    # cuerpo centrado (como tu diseño base)
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BACKGROUND', (0, 0), (-1, 0), color_principal),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, 0), 5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
    ]))

    # --- 4) Totales ---
    data_total = [
        ["Total Gravado", f"{simbolo} {total_gravado:.2f}"],
        ["Total IGV ", f"{simbolo} {total_igv:.2f}"],
        ["Importe Total", f"{simbolo} {monto_total:.2f}"],
    ]
    tabla_total = Table(data_total, colWidths=[ancho_total * 0.85, ancho_total * 0.15])
    tabla_total.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTNAME', (0, 2), (1, 2), 'Helvetica-Bold'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    # --- 5) Importe Total a Pagar ---
    tabla_monto = Table([[f"IMPORTE TOTAL A PAGAR {simbolo} {monto_total:.2f}"]], colWidths=[ancho_total])
    tabla_monto.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, color_principal),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, color_principal),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))

    # --- 6) Notas y bancos ---
    note_1_color = colors.HexColor(user.pdf_note_1_color or "#FF0000")
    style_red_bold = ParagraphStyle(name='RedBold', parent=body, textColor=note_1_color, fontName='Helvetica-Bold')
    terminos_1 = Paragraph(user.pdf_note_1 or "", style_red_bold)
    terminos_2 = Paragraph(user.pdf_note_2 or "", body)

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
                label_cuenta = f"Cuenta Detracción en {moneda}" if 'nación' in banco.lower() else f"{tipo_cuenta} en {moneda}"
                if cuenta and cci:
                    bank_info_text += f"{label_cuenta}: {cuenta} CCI: {cci}<br/>"
                elif cuenta:
                    bank_info_text += f"{label_cuenta}: {cuenta}<br/>"
                bank_info_text += "<br/>"
    banco_info = Paragraph(bank_info_text, body)

    # --- 7) Rectángulo redondeado (decorativo) ---
    def dibujar_rectangulo(canvas, doc_):
        canvas.saveState()
        x = margen_izq + (ancho_total * 0.80)
        y = doc_.height + doc_.topMargin - 82
        w = ancho_total * 0.20
        h = 80
        canvas.setStrokeColor(color_principal)
        canvas.setLineWidth(1.5)
        canvas.roundRect(x, y, w, h, 5, stroke=1, fill=0)
        canvas.restoreState()

    # Build
    elementos = [
        tabla_principal, Spacer(1, 20),
        tabla_cliente, Spacer(1, 20),
        tabla_productos, tabla_total, tabla_monto, Spacer(1, 20),
        terminos_1, terminos_2, Spacer(1, 12), banco_info
    ]

    doc.build(elementos, onFirstPage=dibujar_rectangulo, onLaterPages=dibujar_rectangulo)

    buffer.seek(0)
    return buffer


# Wrappers
def create_cotizacion_pdf(cotizacion: models.Cotizacion, user: models.User):
    return create_pdf_buffer(cotizacion, user, 'cotizacion')

def create_comprobante_pdf(comprobante: models.Comprobante, user: models.User):
    return create_pdf_buffer(comprobante, user, 'comprobante')
