# Barcode Generator & Label Sheet Creator

A Python toolset to automatically generate standard EAN-13 barcode numbers for product catalogs and build print-ready **A4 PDF barcode label sheets** for retail/inventory management.

---

## 📁 Project Structure

```text
barcode-generator/
│
├── index.html                            # Web Application Frontend Interface
├── styles.css                            # Modern Design System & Print Stylesheet
├── app.js                                # Frontend Interactive Controller & EAN-13 Generator
├── server.py                             # Local HTTP Server to serve Web Frontend UI
│
├── generate_barcodes.py                  # Script 1: Assigns EAN-13 barcodes with check digits to products
├── generate_labels.py                    # Script 2: Reads product spreadsheet and creates printable A4 PDF grid
│
├── products.xlsx                         # Sample input Excel file (product list without barcodes)
├── products_with_barcodes.xlsx           # Generated output Excel file containing assigned barcodes
├── name_qty_barcode_salesprice_template.xlsx # Template Excel layout for reference
├── labels_output.pdf                     # Sample output A4 PDF containing print-ready barcode label grid
│
├── .gitignore                            # Git ignore rules (ignores virtual environment)
└── README.md                             # Project documentation
```

---

## ✨ Features

- **🌐 Interactive Web Frontend**: Full-featured single page web application for barcode creation, editing, excel parsing, and printing.
- **🏷️ Real-time Printable A4 Grid Preview**: WYSIWYG live layout engine supporting A4 3×8 (24 labels), 2×7 (14 labels), 4×10 (40 labels), or single thermal labels.
- **EAN-13 Barcode Generator**: Calculates correct 13th check-digit using modulo-10 algorithm for 12-digit numeric base sequences.
- **Stock-based Multipliers**: Automatically duplicates each label based on product quantity on hand.
- **Excel/CSV Drag & Drop**: Reads `.xlsx` and `.csv` spreadsheets directly in the browser via SheetJS.
- **Single Barcode Generator**: Instant SVG vector barcode generator for CODE128, EAN-13, EAN-8, UPC, CODE39.
- **Flexible Column Mapping**: Intelligently identifies columns regardless of casing or variations (`Name`/`Product Name`, `Quantity`/`Stock`/`Qty`, `Barcode`/`Code`, `Price`/`Sales Price`).
- **High-Resolution Vector Output**: Uses `reportlab` to render crisp barcodes, text, and pricing boxes suitable for label stickers or paper sheets.

---

## 🛠️ Prerequisites & Installation

Ensure you have Python 3.8+ installed. Install required Python packages:

```bash
pip install python-barcode reportlab pandas openpyxl pillow
```

*Note: If using Linux system Python, you may need `--break-system-packages` or run within a virtual environment.*

---

## 🚀 Usage Guide

### Step 1: Launch the Interactive Web Frontend Interface

You can open `index.html` directly in any web browser, or start the included local web server:

```bash
python server.py
```

Then open **`http://localhost:8000`** in your browser.

From the web frontend, you can:
- **Upload Excel/CSV product spreadsheets** (`.xlsx`, `.csv`) with drag & drop.
- **Auto-generate EAN-13 barcodes** with modulo-10 check digits.
- **Customize label layout grid** (A4 3x8, 2x7, 4x10, Thermal 50x25mm).
- **Live Preview & Direct Print** (`Ctrl+P` / Print Labels button).
- **Export updated Excel file** with barcodes assigned.

---

### Step 2: Generate Barcode Numbers via CLI Script

If your product spreadsheet does not have barcode numbers assigned, run `generate_barcodes.py`:

```bash
python generate_barcodes.py
```

- **Input**: `products.xlsx`
- **Output**: `products_with_barcodes.xlsx`
- **Behavior**: Starts from a 12-digit sequence (`890100000001`), computes the official EAN-13 check digit, appends it, and saves an updated Excel sheet.

---

### Step 2: Generate Print-Ready A4 PDF Label Sheet

To convert a spreadsheet with product names, barcodes, prices, and quantities into a printable PDF grid:

```bash
python generate_labels.py products_with_barcodes.xlsx labels_output.pdf
```

- **Input**: Any `.xlsx` or `.csv` spreadsheet containing product info.
- **Output**: Multi-page A4 PDF file ready for printing.

---

## 📋 Input File Format Requirements

Your input Excel or CSV file should contain the following columns (column headers are case-insensitive and flexible):

| Attribute | Accepted Header Names | Example Value |
| :--- | :--- | :--- |
| **Product Name** | `name`, `product name`, `product` | Wireless Mouse |
| **Barcode** | `barcode`, `barcode number`, `code` | 8901000000013 |
| **Price** | `price`, `sales price`, `sale price` | 499.00 |
| **Quantity** | `quantity`, `qty`, `stock`, `on hand` | 5 |

---

## ⚙️ Layout Configuration

Grid dimensions and label formatting can be modified directly in `generate_labels.py`:

```python
# Configuration variables inside generate_labels.py
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 8 * mm        # Page margin
COLS = 3               # Number of columns per A4 page
ROWS = 8               # Number of rows per A4 page
GAP_X = 2.5 * mm       # Horizontal gap between label columns
GAP_Y = 2.5 * mm       # Vertical gap between label rows
BARCODE_TYPE = "code128" # Barcode encoding format
```
