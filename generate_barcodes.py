import pandas as pd

INPUT_FILE = "products.xlsx"
OUTPUT_FILE = "products_with_barcodes.xlsx"

# 12-digit starting number (without check digit)
START_NUMBER = 890100000001


def calculate_ean13_check_digit(number12):
    digits = [int(d) for d in str(number12)]

    odd = sum(digits[::2])
    even = sum(digits[1::2])

    total = odd + even * 3
    return (10 - (total % 10)) % 10


df = pd.read_excel(INPUT_FILE)

barcodes = []

current = START_NUMBER

for _ in range(len(df)):
    check = calculate_ean13_check_digit(current)
    barcode = f"{current}{check}"
    barcodes.append(barcode)
    current += 1

df["Barcode"] = barcodes

df.to_excel(OUTPUT_FILE, index=False)

print(f"Generated {len(df)} barcodes.")
print(f"Saved as {OUTPUT_FILE}")
