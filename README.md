# Barcode Generator & Label Sheet Creator

A Python toolset to automatically generate standard EAN-13 barcode numbers for product catalogs and build print-ready **A4 PDF barcode label sheets** for retail/inventory management.

---

## 📁 Project Structure

```text
barcode-generator/
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

- **EAN-13 Barcode Generator**: Calculates correct 13th check-digit using modulo-10 algorithm for 12-digit numeric base sequences.
- **A4 PDF Grid Layout**: Automatically arranges labels into a customizable 3×8 grid (24 labels per page).
- **Stock-based Multipliers**: Automatically duplicates each label based on product quantity on hand.
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

### Step 1: Generate Barcode Numbers for Products

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
