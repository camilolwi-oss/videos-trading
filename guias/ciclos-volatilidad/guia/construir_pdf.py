"""Construye la guía paso a paso en PDF.

Uso: python3 construir_pdf.py <dir_imagenes> <dir_resultados_backtest> <salida.pdf>
"""
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (Image, KeepTogether, ListFlowable, ListItem, PageBreak, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

IMG, RES, OUT = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])

FD = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("Sans", FD + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", FD + "DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Sans-It", FD + "DejaVuSans.ttf"))  # no hay cursiva instalada: los pies van en gris
pdfmetrics.registerFont(TTFont("Mono", FD + "DejaVuSansMono.ttf"))
pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="Sans-Bold", italic="Sans-It", boldItalic="Sans-Bold")

INK, MUTED, LINE, SOFT = colors.HexColor("#1F2328"), colors.HexColor("#6E7781"), colors.HexColor("#D8DEE4"), colors.HexColor("#F4F6F8")
BLUE, GREEN, RED, PURPLE, ORANGE = (colors.HexColor(x) for x in ("#2E86C1", "#26A69A", "#EF5350", "#9C6ADE", "#FFA726"))

PW, PH = A4
M = 1.8 * cm
CW = PW - 2 * M

st = {
    "title": ParagraphStyle("title", fontName="Sans-Bold", fontSize=30, leading=36, textColor=INK, spaceAfter=8),
    "subtitle": ParagraphStyle("subtitle", fontName="Sans", fontSize=14, leading=19, textColor=MUTED, spaceAfter=18),
    "h1": ParagraphStyle("h1", fontName="Sans-Bold", fontSize=19, leading=24, textColor=INK, spaceBefore=4, spaceAfter=4),
    "kicker": ParagraphStyle("kicker", fontName="Sans-Bold", fontSize=9.5, leading=12, textColor=BLUE, spaceAfter=2),
    "h2": ParagraphStyle("h2", fontName="Sans-Bold", fontSize=12.5, leading=16, textColor=INK, spaceBefore=10, spaceAfter=4),
    "body": ParagraphStyle("body", fontName="Sans", fontSize=10, leading=14.6, textColor=INK, spaceAfter=6),
    "lead": ParagraphStyle("lead", fontName="Sans", fontSize=11, leading=16, textColor=INK, spaceAfter=8),
    "small": ParagraphStyle("small", fontName="Sans", fontSize=8.6, leading=12, textColor=MUTED, spaceAfter=4),
    "cap": ParagraphStyle("cap", fontName="Sans-It", fontSize=8.6, leading=12, textColor=MUTED, spaceBefore=3, spaceAfter=10),
    "cell": ParagraphStyle("cell", fontName="Sans", fontSize=8.8, leading=12, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Sans-Bold", fontSize=8.8, leading=12, textColor=INK),
    "cellh": ParagraphStyle("cellh", fontName="Sans-Bold", fontSize=8.8, leading=12, textColor=colors.white),
    "note": ParagraphStyle("note", fontName="Sans", fontSize=9.4, leading=13.5, textColor=INK),
    "mono": ParagraphStyle("mono", fontName="Mono", fontSize=8.4, leading=11.5, textColor=INK),
}


def P(text, s="body"):
    return Paragraph(text, st[s])


def img(name, width=CW, base=IMG, caption=None, keep=True):
    path = str(base / name)
    w, h = ImageReader(path).getSize()
    out = [Image(path, width=width, height=width * h / w)]
    if caption:
        out.append(P(caption, "cap"))
    return [KeepTogether(out)] if keep else out


def bullets(items, s="body"):
    return ListFlowable([ListItem(P(x, s), leftIndent=12, value="•") for x in items], bulletType="bullet", start="•",
                        leftIndent=12, bulletFontName="Sans", bulletFontSize=9, bulletColor=MUTED)


def steps(items, compact=False):
    """Lista numerada con el número sobre fondo azul."""
    rows = []
    for k, (t, d) in enumerate(items, 1):
        num = Paragraph(f"<font color='white'><b>{k}</b></font>", ParagraphStyle("n", fontName="Sans-Bold", fontSize=10,
                        alignment=TA_CENTER, leading=12))
        if compact:
            rows.append([num, P(f"<b>{t}.</b> {d}", "note")])
        else:
            rows.append([num, [P(f"<b>{t}</b>", "body"), P(d, "note")] if d else P(f"<b>{t}</b>", "body")])
    tb = Table(rows, colWidths=[0.75 * cm, CW - 0.75 * cm])
    sty = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (1, 0), (1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
           ("TOPPADDING", (0, 0), (-1, -1), 2)]
    for k in range(len(rows)):
        sty += [("BACKGROUND", (0, k), (0, k), BLUE), ("ROUNDEDCORNERS", [3, 3, 3, 3])]
    tb.setStyle(TableStyle(sty))
    return tb


def table(head, rows, widths, zebra=True, head_bg=INK):
    data = [[P(h, "cellh") for h in head]] + [[c if not isinstance(c, str) else P(c, "cell") for c in r] for r in rows]
    tb = Table(data, colWidths=widths, repeatRows=1)
    sty = [("BACKGROUND", (0, 0), (-1, 0), head_bg), ("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
           ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5)]
    if zebra:
        for i in range(1, len(data)):
            if i % 2 == 0:
                sty.append(("BACKGROUND", (0, i), (-1, i), SOFT))
    tb.setStyle(TableStyle(sty))
    return tb


def callout(text, color=BLUE, title=None):
    inner = [P(f"<b>{title}</b>", "note")] if title else []
    inner.append(P(text, "note"))
    tb = Table([[inner]], colWidths=[CW])
    tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SOFT), ("LINEBEFORE", (0, 0), (0, -1), 3, color),
                            ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    return tb


class Kicker(Paragraph):
    """Etiqueta de sección que anota en qué página cae (para el índice)."""


def section(kicker, title):
    return [Kicker(kicker.upper(), st["kicker"]), P(title, "h1"), Spacer(1, 4)]


def dot(color):
    return f"<font color='{color.hexval().replace('0x', '#')}'>■</font>"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Sans", 8)
    canvas.setFillColor(MUTED)
    if doc.page > 1:
        canvas.drawString(M, 1.1 * cm, "Ciclos + Volatilidad · guía paso a paso")
        canvas.drawRightString(PW - M, 1.1 * cm, str(doc.page))
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(M, 1.45 * cm, PW - M, 1.45 * cm)
    canvas.restoreState()


def story():
    S = []

    # ─── Portada ──────────────────────────────────────────────────────────────────
    S += [Spacer(1, 1.2 * cm), P("INDICADOR PARA TRADINGVIEW · PINE SCRIPT V6", "kicker"), P("Ciclos + Volatilidad", "title"),
          P("Guía paso a paso: instalarlo, leerlo y operar su señal", "subtitle")]
    S += img("f2_operacion.png")
    S += [Spacer(1, 6),
          P("El indicador busca un patrón concreto: la volatilidad se <b>comprime</b>, se <b>libera</b> y el precio "
            "<b>rompe al alza</b> la caja de calma, con la tendencia a favor. Esa es la única señal. Los ciclos de tiempo de "
            "Hurst, el ciclo de volatilidad y el exponente de Hurst se muestran como <b>contexto</b> en un panel.", "lead"),
          Spacer(1, 10),
          callout("Las imágenes de esta guía se generaron con datos reales de BTC 4h (Bitstamp) aplicando exactamente las mismas "
                  "reglas del indicador. No son capturas de TradingView: los colores y formas son los del indicador, pero la "
                  "apariencia exacta del gráfico depende de tu tema y configuración.", MUTED, "Sobre las imágenes"),
          PageBreak()]

    # ─── Índice y resumen ─────────────────────────────────────────────────────────
    S += section("Antes de empezar", "Qué vas a aprender")
    TOC = [("Paso 1", "Instalar el indicador en TradingView"), ("Paso 2", "Configurar el gráfico y los ajustes"),
           ("Paso 3", "Entender cómo nace una señal"), ("Paso 4", "Leer el gráfico durante una operación"),
           ("Paso 5", "Leer el panel"), ("Paso 6", "Operar la señal con un riesgo fijo"), ("Paso 7", "Crear las alertas"),
           ("Paso 8", "Usar el contexto: ciclo, volatilidad y Hurst"), ("Para tener en cuenta", "Resultados y límites"),
           ("Dudas", "Preguntas frecuentes")]
    S += [table(["Sección", "Qué haces", "Página"], [[k, t, str(PAGES.get(k.upper(), "–"))] for k, t in TOC],
                [3.6 * cm, CW - 5.6 * cm, 2 * cm]), Spacer(1, 16)]
    S += [P("Las reglas, en seis líneas", "h2"),
          steps([("Compresión", "El percentil del ATR(14) en las últimas 100 velas cae a 5 o menos: el mercado está en calma."),
                 ("Liberación", "Ese percentil vuelve a superar 20: la volatilidad despierta."),
                 ("Ruptura", "En 12 velas o menos, una vela <b>cierra</b> por encima del máximo de la caja de compresión."),
                 ("Filtros", "Precio sobre la EMA200 y momentum de al menos 2 de 3 (EMAs 20/50 alineadas, ATR subiendo, volumen creciente)."),
                 ("Entrada y stop", "Compra en la apertura de la vela siguiente. Stop en el mínimo de la caja."),
                 ("Salida", "Cuando una vela cierra por debajo de la EMA100, o a las 180 velas.")]),
          PageBreak()]

    # ─── Paso 1 · Instalar ────────────────────────────────────────────────────────
    S += section("Paso 1", "Instalar el indicador en TradingView")
    S += img("f7_instalacion.png", width=CW * 0.7, caption="Dónde está cada cosa (esquema). Los números coinciden con los pasos de abajo.")
    S += [steps([("Copia el código completo",
                  "Abre el archivo <font name='Mono'>ciclos_volatilidad.pine</font> (o el enlace «raw» de GitHub de abajo), "
                  "selecciona todo con Ctrl+A (Cmd+A en Mac) y cópialo con Ctrl+C. Son unas 1 080 líneas: si copias solo una "
                  "parte, no compila."),
                 ("Abre el Pine Editor", "En la parte inferior de TradingView, pestaña «Pine Editor». Crea un indicador nuevo."),
                 ("Pega reemplazando todo", "Dentro del editor, Ctrl+A para seleccionar el código de ejemplo y Ctrl+V para "
                  "reemplazarlo por el del indicador."),
                 ("Pulsa «Añadir al gráfico»", "El indicador aparece sobre el precio, con su panel arriba a la derecha."),
                 ("Guárdalo", "Ctrl+S. Después lo tendrás siempre en Indicadores → Mis scripts.")]),
          Spacer(1, 6), P("Enlace al código en bruto (para copiarlo entero):", "small"),
          P("https://raw.githubusercontent.com/camilolwi-oss/videos-trading/claude/friendly-rubin-kszpt5/guias/ciclos-volatilidad/"
            "ciclos_volatilidad.pine", "mono"), Spacer(1, 10),
          callout("<b>CE10246 «An indicator must contain at least one plot…»</b>: pegaste solo una parte del código. Vuelve a "
                  "copiar con Ctrl+A.<br/><b>Cualquier otro error</b>: haz una captura del mensaje (con el número de línea) y "
                  "envíala para corregirlo. El código se revisó con un parser de Pine v6, pero no se compiló dentro de "
                  "TradingView.", RED, "Si aparece un error"),
          PageBreak()]

    # ─── Paso 2 · Configurar ──────────────────────────────────────────────────────
    S += section("Paso 2", "Configurar el gráfico y los ajustes")
    S += [P("Gráfico recomendado", "h2"),
          bullets(["<b>Símbolo:</b> BITSTAMP:BTCUSD (los datos del backtest son de Bitstamp). Otros exchanges funcionan, pero "
                   "el volumen cambia y con él el filtro de momentum.",
                   "<b>Temporalidad: 4 horas.</b> Es la única validada. En diario casi no hay señales; en otras temporalidades "
                   "usa la fila 7 del panel (backtest del gráfico) como primera referencia.",
                   "<b>Escala:</b> la logarítmica ayuda a ver tendencias largas, pero no cambia nada del cálculo."]),
          P("Ajustes (rueda dentada del indicador)", "h2"),
          P("Los valores por defecto son los del backtest. Lo normal es <b>no tocar el grupo 2</b>.", "body"),
          table(["Grupo", "Qué contiene", "Cuándo cambiarlo"],
                [["1 · General", "Idioma (Español / English), mostrar panel, posición del panel, mostrar la EMA200.",
                  "Cambia el idioma o mueve el panel si tapa velas."],
                 ["2 · Señal (validada)", "ATR 14 · percentil 100 · compresión ≤ 5 · liberación > 20 · 12 velas para romper · "
                  "EMA de tendencia 200 · momentum mínimo 2 · EMA de salida 100 · salida a las 180 velas · riesgo mínimo 0,5 ATR · "
                  "comisión 0,1 %.",
                  "Solo si sabes lo que haces. En diario, «Compresión ≤» a 8 da más señales. En símbolos sin volumen, "
                  "«Momentum mínimo» a 1."],
                 ["3 · Ciclos de tiempo", "Motor de ciclos de Hurst: barras analizadas (5 000), ventana ±10 %, fuerza de pivote, "
                  "mínimos candidatos, relaciones Madre → N1 → N2 → N3.", "Igual que en el indicador de ciclos original. No afecta a la señal."],
                 ["4 · Ciclo de volatilidad y Hurst", "ATR del ciclo (28), longitud (90), umbral de agotamiento (90), ventana del "
                  "período dominante (400); Hurst: ventana R/S 100, media 10, barras 500.", "Rara vez. No afecta a la señal."],
                 ["5 · Alertas", "Entrada, salida, compresión/liberación, ventana del ciclo, agotamiento.",
                  "Activa las que quieras recibir (paso 7)."]],
                [3.4 * cm, 7.6 * cm, CW - 11 * cm]),
          Spacer(1, 10),
          callout("La comisión del grupo 2 solo se usa para calcular el backtest de la fila 7 del panel. No envía órdenes ni "
                  "opera por ti: el indicador solo dibuja y avisa.", BLUE, "Importante"),
          PageBreak()]

    # ─── Paso 3 · Cómo nace una señal ─────────────────────────────────────────────
    S += section("Paso 3", "Entender cómo nace una señal")
    S += [P("Debajo del precio, el indicador calcula en cada vela el <b>percentil del ATR</b>: compara la volatilidad actual con "
            "la de las últimas 100 velas (0 = la más baja, 100 = la más alta). Ese cálculo no se dibuja, pero es el que decide "
            "cuándo aparece la caja.", "body")]
    S += img("f1_secuencia.png", width=CW * 0.76, caption="Ejemplo real: BTC 4h del 10 al 18 de octubre de 2023. Abajo, el percentil que el indicador "
             "calcula por dentro.")
    S += [steps([("Compresión (caja morada)", "El percentil cae a 5 o menos. Se abre la caja y se estira con cada vela mientras "
                  "dure la calma: su techo es el máximo y su suelo el mínimo de ese periodo."),
                 ("Liberación (la caja pasa a azul)", "El percentil vuelve a cruzar 20 hacia arriba. La caja queda fija y empieza "
                  "una cuenta atrás de 12 velas."),
                 ("Ruptura al alza (la caja pasa a verde) y ▲", "Una vela cierra por encima del techo. Si además el precio está "
                  "sobre la EMA200 y el momentum es ≥ 2/3, aparece el triángulo verde: es la señal.")], compact=True),
          Spacer(1, 2)]
    S += [KeepTogether([P("Los cinco colores de la caja", "h2")] + img("f4_estados_caja.png", caption="En TradingView es una "
          "sola caja que cambia de color según avanza. Roja o gris: no hay operación.", keep=False))]
    S += [PageBreak()]

    # ─── Paso 4 · Leer el gráfico ─────────────────────────────────────────────────
    S += section("Paso 4", "Leer el gráfico durante una operación")
    S += [P("Cuando hay una operación abierta aparecen dos líneas que solo existen mientras dura: el <b>stop</b> y la "
            "<b>EMA de salida</b>. Cuando la operación termina, desaparecen y se marca una ✖.", "body")]
    S += img("f2_operacion.png", caption="La misma señal de octubre de 2023, de principio a fin: +5,6R en 29 días.")
    S += [table(["", "Qué ves", "Qué significa"],
                [["1", f"{dot(GREEN)} Caja verde", "La compresión que se rompió al alza."],
                 ["2", f"{dot(GREEN)} Triángulo ▲ bajo la vela", "Señal larga. Se entra en la <b>apertura de la vela siguiente</b> "
                  "(punto negro), no en el cierre de la vela del triángulo."],
                 ["3", f"{dot(RED)} Línea roja horizontal", "Stop: el mínimo de la caja. Si el precio lo toca, se sale con unos −1R."],
                 ["4", f"{dot(GREEN)} Línea verde que sube", "EMA100: la salida dinámica. Mientras el precio cierre por encima, la "
                  "operación sigue abierta y deja correr la tendencia."],
                 ["5", "✖ gris sobre la vela", "Salida: una vela cerró por debajo de la EMA100 (o se cumplieron 180 velas)."]],
                [0.8 * cm, 4.6 * cm, CW - 5.4 * cm]),
          PageBreak()]
    S += [P("Cuando sale mal", "h2"),
          P("La mayoría de las operaciones no son como la anterior. Casi la mitad terminan en pérdida, pero la pérdida está "
            "acotada por el stop: ronda −1R. El sistema gana porque las ganadoras, cuando llegan, valen varias veces eso.", "body")]
    S += img("f3_perdida.png", caption="Septiembre de 2024: la ruptura no continuó, el precio volvió a la caja y tocó el stop en "
             "dos días y medio (−1,0R).")
    S += [callout("No muevas el stop hacia abajo «para darle aire», no promedies a la baja y no cierres antes de tiempo porque "
                  "la operación va bien: las cifras del backtest dependen de respetar las tres líneas tal como se dibujan.",
                  ORANGE, "La regla de oro"),
          PageBreak()]

    # ─── Paso 5 · Panel ───────────────────────────────────────────────────────────
    S += section("Paso 5", "Leer el panel")
    S += [P("El panel está arriba a la derecha (lo puedes mover en el grupo 1). Tiene 8 filas. La que más importa es la "
            "<b>fila 2</b>: te dice qué hacer ahora.", "body")]
    S += img("f5_panel.png", caption="El panel el 25 de octubre de 2023 a las 12:00, en mitad de la operación del paso 4. "
             "Valores calculados con datos reales.")
    S += [table(["Fila", "Qué muestra", "Cómo usarla"],
                [["1", "Título y símbolo.", "—"],
                 ["2", "<b>Qué hacer ahora</b> (ver tabla siguiente).", "Es la única fila que da instrucciones."],
                 ["3", "Filtros: tendencia EMA200 y momentum x/3 con el detalle ✓/✗.", "En verde si se cumplen. Solo cuentan en el "
                  "momento de la ruptura; con la operación abierta no importan."],
                 ["4", "Ciclo dominante: duración, aciertos, próximo pivote ± ventana y estado. <b>Pasa el ratón</b> por encima "
                  "para ver todos los niveles (Madre, N1, N2, N3).", "Contexto (paso 8). No filtra la señal."],
                 ["5", "Volatilidad: percentil y fase, línea de ciclo de volatilidad y su ritmo (pico y valle estimados).",
                  "Contexto. «AGOTAMIENTO» en morado = volatilidad en máximos."],
                 ["6", "Exponente de Hurst: tendencia, rango o aleatorio.", "Contexto."],
                 ["7", "Backtest de este gráfico con las mismas reglas.", "Úsalo para ver cómo se comporta en otros símbolos o "
                  "temporalidades. Depende de cuántas velas cargue tu plan de TradingView."],
                 ["8", "Referencia del backtest validado (BTC 4h 2017–2026).", "Para comparar con la fila 7."]],
                [1.1 * cm, 8 * cm, CW - 9.1 * cm]),
          Spacer(1, 6),
          P("Los textos del panel salen con el formato de números de Pine: punto decimal y sin separador de miles "
            "(por ejemplo <font name='Mono'>+5.32R</font> o <font name='Mono'>28073</font>).", "small"),
          PageBreak(), P("Los cinco mensajes de la fila 2", "h2")] + img("f8_flujo.png", caption="Los cinco estados por los que "
          "pasa el indicador, en orden. La fila 2 del panel te dice siempre en cuál estás.") + [
          table(["Mensaje", "Qué hacer"],
                [[f"{dot(MUTED)} <b>ESPERAR</b>: sin compresión de volatilidad", "Nada. Es lo más frecuente: unas 5 señales al año en 4h."],
                 [f"{dot(PURPLE)} <b>COMPRESIÓN</b> n barras · caja mín – máx", "Prepárate. Anota el techo de la caja: será el nivel a romper."],
                 [f"{dot(BLUE)} <b>LIBERACIÓN</b>: esperar cierre &gt; precio", "Vigila los cierres de vela. Tienes 12 velas. "
                  "Si la fila 3 no está en verde, aunque rompa no habrá señal."],
                 [f"{dot(GREEN)} <b>SEÑAL LARGA</b>: entrar en la apertura · stop", "Compra al abrir la próxima vela y pon el stop "
                  "indicado (paso 6)."],
                 [f"{dot(GREEN)} <b>EN OPERACIÓN</b> desde … · ahora +x R", "Mantén. Sal cuando una vela cierre bajo la EMA100 (el "
                  "precio aparece en la misma fila) o cuando toque el stop."]],
                [7.2 * cm, CW - 7.2 * cm]),
          PageBreak()]

    # ─── Paso 6 · Operar ──────────────────────────────────────────────────────────
    S += section("Paso 6", "Operar la señal con un riesgo fijo")
    S += [P("El indicador mide todo en <b>R</b>: lo que arriesgas en cada operación (de la entrada al stop). Para que +2R o "
            "−1R signifiquen lo mismo en todas las operaciones, el tamaño de la posición se calcula a partir del stop.", "body"),
          P("La fórmula", "h2"),
          callout("<b>Tamaño de la posición = (capital × % de riesgo) ÷ (precio de entrada − stop)</b>", BLUE),
          Spacer(1, 6),
          P("Ejemplo con la operación del paso 4", "h2"),
          table(["Dato", "Valor"],
                [["Capital", "10 000 USD"], ["Riesgo por operación", "1 % = 100 USD"], ["Entrada (apertura siguiente)", "28 073"],
                 ["Stop (mínimo de la caja)", "26 800"], ["Distancia al stop", "1 273 USD por BTC (4,5 %)"],
                 ["Tamaño", "100 ÷ 1 273 = <b>0,0786 BTC</b> (≈ 2 205 USD)"],
                 ["Resultado", "+5,6R ≈ +560 USD si se respetan entrada, stop y salida"]],
                [6 * cm, CW - 6 * cm]),
          Spacer(1, 8), P("Lista de comprobación", "h2"),
          steps([("Al ver «LIBERACIÓN»", "Mira la fila 3. Si los filtros no están en verde, lo más probable es que no haya señal."),
                 ("Al aparecer el ▲ (cierre de vela)", "Lee la fila 2: te da el stop exacto. Calcula el tamaño con la fórmula."),
                 ("En la apertura de la vela siguiente", "Compra y coloca el stop en el exchange (orden stop real, no mental)."),
                 ("Durante la operación", "No hagas nada mientras el precio cierre sobre la línea verde. Revisa al cierre de cada vela de 4h."),
                 ("Salida", "Cuando aparezca la ✖ (cierre bajo la EMA100) vende en la apertura siguiente. Si tocó el stop, ya saliste."),
                 ("Después", "Anota el resultado en R. Las rachas de 3–5 pérdidas seguidas son normales en este sistema.")]),
          Spacer(1, 6),
          callout("Arriesgar el 1 % por operación dio, en el backtest, una caída máxima del 3,7 %. Con el 2 % se duplica. "
                  "Más de eso hace que una racha normal de pérdidas duela de verdad.", ORANGE, "¿Cuánto arriesgar?"),
          PageBreak()]

    # ─── Paso 7 · Alertas ─────────────────────────────────────────────────────────
    S += section("Paso 7", "Crear las alertas")
    S += [P("Así no tienes que mirar el gráfico cada 4 horas. Hay dos formas; la primera es la recomendada porque los "
            "mensajes llegan en tu idioma y con el precio del stop.", "body"),
          P("Opción A · Una sola alerta para todo (recomendada)", "h2"),
          steps([("Abre el diálogo de alertas", "Icono del reloj en la barra derecha de TradingView, o Alt+A."),
                 ("Condición", "Elige <b>Ciclos+Vol</b> y, debajo, <b>«Cualquier llamada a la función alert()»</b>."),
                 ("Notificaciones", "Activa las que uses: app móvil, correo, sonido, webhook…"),
                 ("Crear", "Los tipos de aviso se eligen en los ajustes del indicador (grupo 5).")]),
          Spacer(1, 6), P("Opción B · Una alerta por evento", "h2"),
          P("En «Condición» elige Ciclos+Vol y luego el evento concreto: <i>Señal larga</i>, <i>Salida</i>, <i>Liberación</i>, "
            "<i>Compresión</i> o <i>Agotamiento</i>. Selecciona «Una vez por cierre de barra».", "body"),
          P("Qué avisa cada alerta", "h2"),
          table(["Alerta", "Ejemplo de mensaje", "Por defecto"],
                [["Señal de entrada", "BTCUSD · SEÑAL LARGA: entrar en la apertura · stop 61246 · salida: cierre &lt; EMA100", "Activada"],
                 ["Salida", "BTCUSD · SALIDA de la operación: +5.63R", "Activada"],
                 ["Compresión y liberación", "BTCUSD · Liberación: esperar cierre &gt; 27980 (filtros aún no cumplen)", "Activada"],
                 ["Ventana de ciclo", "BTCUSD · Entra la ventana del ciclo dominante", "Activada"],
                 ["Agotamiento y ciclo de volatilidad", "BTCUSD · Agotamiento: volatilidad en máximos (percentil ≥ 90)", "Desactivada"]],
                [4.2 * cm, CW - 6.6 * cm, 2.4 * cm]),
          Spacer(1, 8),
          callout("Si cambias un ajuste del indicador después de crear la alerta, bórrala y créala de nuevo: TradingView guarda "
                  "la configuración que había al crearla.", BLUE, "Ojo"),
          PageBreak()]

    # ─── Paso 8 · Contexto ────────────────────────────────────────────────────────
    S += section("Paso 8", "Usar el contexto: ciclo, volatilidad y Hurst")
    S += [P("Estas tres lecturas vienen de los indicadores originales y se calculan completas, pero <b>no activan ni bloquean "
            "la señal</b>: en el backtest, usarlas como filtro no mejoró los resultados fuera de muestra. Sirven para entender "
            "el momento del mercado.", "body"),
          P("La banda del ciclo dominante", "h2")]
    S += img("f6_banda_ciclo.png", width=CW * 0.84, caption="Situación con los datos hasta el 1 de noviembre de 2026: el ciclo dominante de 75 días "
             "proyecta su próxima ventana de mínimo alrededor del 27 de noviembre.")
    S += [table(["Color de la banda", "Significado"],
                [[f"{dot(MUTED)} Gris", "La ventana todavía no llegó. La etiqueta dice cuánto falta."],
                 [f"{dot(ORANGE)} Naranja", "Estamos dentro de la ventana (±10 % de la duración del ciclo)."],
                 [f"{dot(GREEN)} Verde", "Zona ideal: la mitad central de la ventana, donde según Hurst es más probable el mínimo."]],
                [4 * cm, CW - 4 * cm]),
          Spacer(1, 6),
          bullets(["La banda se recalcula en la última vela. Si aparecen mínimos nuevos, <b>puede moverse</b>: por eso no forma parte de la señal.",
                   "En el backtest, las señales que coincidieron con una ventana activa rindieron algo más (+2,2R frente a +1,8R), "
                   "pero la diferencia no es estadísticamente fiable.",
                   "Pasa el ratón por la fila 4 del panel para ver todos los niveles y cuántos pivotes acertó cada uno."]),
          P("Volatilidad y Hurst", "h2"),
          bullets(["<b>Fase de volatilidad</b> (fila 5): compresión (≤ 5) → normal → expansión (≥ 70) → <b>agotamiento</b> (≥ 90). "
                   "El agotamiento suele coincidir con movimientos extremos; es un aviso para no perseguir el precio.",
                   "<b>Ciclo de volatilidad</b>: la volatilidad de fondo, más lenta. Sobre 50 = régimen agitado; bajo 50 = tranquilo. "
                   "El «ritmo» es su período dominante, con el próximo pico y valle estimados. Si aparece «≥», la estimación es poco fiable.",
                   "<b>Hurst</b> (fila 6): por encima de 0,55 el mercado tiende a seguir su dirección; por debajo de 0,45, a revertir."]),
          PageBreak()]

    # ─── Resultados y límites ─────────────────────────────────────────────────────
    S += section("Para tener en cuenta", "Resultados y límites")
    S += img("curva_4h.png", base=RES, caption="Backtest walk-forward en BTC 4h, 2017–2026, con comisiones de 0,1 % por lado. Arriba, "
             "el capital arriesgando 1 % y 2 % por operación. Abajo, cada operación sobre el precio (verde ganadora, roja perdedora).")
    S += [table(["Periodo", "Ops", "Acierto", "R por op.", "Factor de beneficio", "Peor racha"],
                [["2017–2021 (elección de reglas)", "29", "62 %", "+2,25", "10,4", "−2,4R"],
                 ["2022–2026 (comprobación)", "23", "43 %", "+1,71", "5,6", "−3,8R"],
                 ["<b>Total</b>", "<b>52</b>", "<b>54 %</b>", "<b>+2,01</b>", "<b>7,7</b>", "<b>−3,8R</b>"]],
                [5.6 * cm, 1.4 * cm, 1.9 * cm, 2.2 * cm, 3.3 * cm, CW - 14.4 * cm]),
          Spacer(1, 8),
          bullets(["Una sola operación (enero de 2023, +21R) pesa mucho. Sin ella, el periodo 2022–2026 baja a unos +0,8R por operación.",
                   "Mantener BTC ganó mucho más en estos años (×77 frente a ×2,7 arriesgando 1 %). La ventaja del sistema es el "
                   "control del riesgo: su peor caída fue del 3,7 %, frente a caídas de más del 75 % de BTC.",
                   "Solo largos y solo validado en BTC 4h. En otros activos y temporalidades no hay validación.",
                   "<b>Resultados pasados no garantizan resultados futuros.</b> Esta guía es material educativo, no una "
                   "recomendación de inversión."]),
          Spacer(1, 4), P("El informe completo está en <font name='Mono'>guias/ciclos-volatilidad/BACKTEST.md</font>.", "small"),
          PageBreak()]

    # ─── Preguntas frecuentes ────────────────────────────────────────────────────
    S += section("Dudas", "Preguntas frecuentes")
    faq = [("¿Repinta?", "La señal, el stop y la salida no: se calculan con velas cerradas y no cambian después. Lo que sí se "
            "recalcula es la banda del ciclo y el panel de contexto, que no intervienen en la señal."),
           ("Hace semanas que no hay señales. ¿Funciona?", "Sí. En BTC 4h hay unas 5 señales al año. Mira la fila 2: si dice "
            "ESPERAR, es lo esperado."),
           ("Hubo una ruptura pero no salió el triángulo.", "Mira la fila 3 en ese momento: faltaba la tendencia (precio bajo la "
            "EMA200) o el momentum era menor que 2/3. También se descarta si el stop queda a menos de 0,5 ATR."),
           ("El backtest de la fila 7 no coincide con la referencia.", "Es normal: depende de cuántas velas carga tu plan de "
            "TradingView y del exchange. La referencia usa Bitstamp desde 2017."),
           ("¿Puedo usarlo en acciones, forex o en 1 hora?", "Puedes, y la fila 7 te da una primera idea, pero solo BTC 4h está "
            "validado. En símbolos sin volumen baja «Momentum mínimo» a 1."),
           ("No veo el panel.", "Revisa «Mostrar panel» en el grupo 1 y su posición. Si otro indicador tiene una tabla en la "
            "misma esquina, cambia la posición."),
           ("¿Opera solo?", "No. Es un indicador: dibuja y avisa. Las órdenes las pones tú en tu exchange."),
           ("¿Por qué no hay cortos?", "En el backtest, las rupturas a la baja perdieron dinero en BTC. Por eso la caja roja no "
            "genera operación.")]
    for q, a in faq:
        S += [KeepTogether([P(q, "h2"), P(a, "body")])]
    S += [Spacer(1, 8), P("Glosario rápido", "h2"),
          table(["Término", "Qué es"],
                [["R", "Unidad de riesgo: la distancia entre la entrada y el stop. +2R = ganaste el doble de lo que arriesgabas."],
                 ["ATR", "Rango medio verdadero: cuánto se mueve el precio por vela, de media."],
                 ["Percentil del ATR", "Dónde está la volatilidad de hoy entre las últimas 100 velas (0 = mínima, 100 = máxima)."],
                 ["EMA", "Media móvil exponencial. EMA200 = tendencia de fondo; EMA100 = salida."],
                 ["Factor de beneficio", "Ganancias totales ÷ pérdidas totales. Por encima de 1, el sistema gana."],
                 ["Walk-forward", "Backtest que, en cada momento, solo usa datos del pasado, y que se comprueba en un periodo "
                  "que no se usó para elegir las reglas."]],
                [3.6 * cm, CW - 3.6 * cm])]

    return S


class Doc(SimpleDocTemplate):
    def afterFlowable(self, fl):
        if isinstance(fl, Kicker):
            FOUND.setdefault(fl.getPlainText(), self.page)


PAGES, FOUND = {}, {}
for _ in range(2):  # 1ª pasada: averigua las páginas; 2ª: las escribe en el índice
    FOUND.clear()
    doc = Doc(str(OUT), pagesize=A4, leftMargin=M, rightMargin=M, topMargin=1.6 * cm, bottomMargin=2 * cm,
              title="Ciclos + Volatilidad · guía paso a paso", author="videos-trading",
              subject="Cómo instalar, leer y operar el indicador Ciclos + Volatilidad en TradingView")
    doc.build(story(), onFirstPage=footer, onLaterPages=footer)
    PAGES = dict(FOUND)
print("PDF:", OUT, PAGES)
