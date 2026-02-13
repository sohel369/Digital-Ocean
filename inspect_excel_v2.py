import pandas as pd
import os

file_path = r'd:\New folder\React.js-compatible 7 - backend\Geograpic Size and Population of  14 Different Countries.xlsx'

try:
    xl = pd.ExcelFile(file_path)
    for sheet_name in xl.sheet_names:
        print(f"\n--- Sheet: {sheet_name} ---")
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        print(f"Shape: {df.shape}")
        print("First 20 rows:")
        print(df.head(20).to_string())
except Exception as e:
    print(f"Error: {e}")
