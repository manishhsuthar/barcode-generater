"""
Printo Ghraph - Barcode Label Sheet Generator
------------------------------------------------
Reads a product spreadsheet (name, barcode, price, quantity) and generates
a print-ready A4 PDF with barcode labels laid out in a grid. Each product's
barcode is repeated according to its stock quantity.

USAGE:
    python generate_labels.py products.xlsx labels_output.pdf

Expected input columns (case-insensitive, flexible naming):
    - name / product name
    - barcode
    - price
    - quantity / qty / stock

Install requirements first:
    pip install python-barcode reportlab pandas openpyxl --break-system-packages
"""

import sys
import io
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import barcode
from barcode.writer import ImageWriter

# ---------------- CONFIG ----------------
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 8 * mm
COLS = 3
ROWS = 8
LABEL_W = (PAGE_WIDTH - 2 * MARGIN) / COLS
LABEL_H = (PAGE_HEIGHT - 2 * MARGIN) / ROWS
BARCODE_TYPE = "code128"  # works with any alphanumeric barcode string
# -----------------------------------------


def find_column(df, candidates):
    """Find a column in df matching any of the candidate names (case-insensitive)."""
    lower_map = {c.lower().strip(): c for c in df.columns}
    for cand in candidates:
        if cand in lower_map:
            return lower_map[cand]
    raise ValueError(f"Could not find a column matching any of: {candidates}. "
                      f"Available columns: {list(df.columns)}")


def load_products(input_path):
    if input_path.lower().endswith(".csv"):
        df = pd.read_csv(input_path)
    else:
        df = pd.read_excel(input_path)

    name_col = find_column(df, ["name", "product name", "product"])
    barcode_col = find_column(df, ["barcode", "barcode number", "code"])
    price_col = find_column(df, ["price", "sales price", "sale price"])
    qty_col = find_column(df, ["quantity", "qty", "stock", "on hand", "qty_available"])

    products = []
    for _, row in df.iterrows():
        try:
            qty = int(row[qty_col])
        except (ValueError, TypeError):
            qty = 0
        if qty <= 0:
            continue  # skip products with 0 or invalid stock, no labels needed
        products.append({
            "name": str(row[name_col]).strip(),
            "barcode": str(row[barcode_col]).strip(),
            "price": row[price_col],
            "qty": qty,
        })
    return products


def generate_barcode_image(code_value):
    """Generate a barcode image in-memory, returns an ImageReader for reportlab."""
    buffer = io.BytesIO()
    barcode_class = barcode.get_barcode_class(BARCODE_TYPE)
    bc = barcode_class(code_value, writer=ImageWriter())
    bc.write(buffer, options={
        "module_height": 8.0,
        "font_size": 0,       # we draw our own text, keep barcode clean
        "text_distance": 1,
        "quiet_zone": 1,
    })
    buffer.seek(0)
    return ImageReader(buffer)


def build_label_queue(products):
    """Expand products into individual label entries based on quantity."""
    queue = []
    for p in products:
        for _ in range(p["qty"]):
            queue.append(p)
    return queue


def draw_label(c, x, y, product, barcode_img):
    """Draw a single label at position (x, y) — top-left corner of the label cell."""
    pad = 2 * mm
    inner_w = LABEL_W - 2 * pad
    inner_h = LABEL_H - 2 * pad

    # Border (optional, helps with manual cutting if not using pre-cut sticker sheets)
    c.setLineWidth(0.3)
    c.rect(x, y - LABEL_H, LABEL_W, LABEL_H)

    # Product name (truncate if too long)
    name = product["name"]
    max_chars = 26
    if len(name) > max_chars:
        name = name[:max_chars - 1] + "…"
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + LABEL_W / 2, y - pad - 3 * mm, name)

    # Barcode image
    barcode_h = inner_h * 0.45
    barcode_w = inner_w * 0.9
    bx = x + (LABEL_W - barcode_w) / 2
    by = y - LABEL_H + inner_h * 0.32
    c.drawImage(barcode_img, bx, by, width=barcode_w, height=barcode_h,
                preserveAspectRatio=True, mask='auto')

    # Barcode number (human-readable)
    c.setFont("Helvetica", 6)
    c.drawCentredString(x + LABEL_W / 2, by - 2.5 * mm, product["barcode"])

    # Price
    try:
        price_str = f"Rs. {float(product['price']):.2f}"
    except (ValueError, TypeError):
        price_str = str(product["price"])
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x + LABEL_W / 2, y - LABEL_H + pad + 1 * mm, price_str)


def generate_pdf(products, output_path):
    label_queue = build_label_queue(products)
    total_labels = len(label_queue)
    if total_labels == 0:
        print("No labels to generate (all quantities were 0). Nothing written.")
        return

    print(f"Generating {total_labels} labels from {len(products)} products...")

    c = canvas.Canvas(output_path, pagesize=A4)

    # cache barcode images per unique barcode so we don't regenerate repeatedly
    barcode_cache = {}

    idx = 0
    while idx < total_labels:
        for row in range(ROWS):
            for col in range(COLS):
                if idx >= total_labels:
                    break
                product = label_queue[idx]
                x = MARGIN + col * LABEL_W
                y = PAGE_HEIGHT - MARGIN - row * LABEL_H

                if product["barcode"] not in barcode_cache:
                    barcode_cache[product["barcode"]] = generate_barcode_image(product["barcode"])
                barcode_img = barcode_cache[product["barcode"]]

                draw_label(c, x, y, product, barcode_img)
                idx += 1
            if idx >= total_labels:
                break
        c.showPage()

    c.save()
    print(f"Done. Saved to: {output_path}")
    print(f"Total pages: {(total_labels + (COLS*ROWS) - 1) // (COLS*ROWS)}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python generate_labels.py <input_products.xlsx> <output_labels.pdf>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    products = load_products(input_path)
    generate_pdf(products, output_path)
