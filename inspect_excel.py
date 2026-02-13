import pandas as pd
import os

file_path = r'd:\New folder\React.js-compatible 7 - backend\Geograpic Size and Population of  14 Different Countries.xlsx'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
else:
    try:
        # Load the Excel file
        xl = pd.ExcelFile(file_path)
        print(f"Sheets: {xl.sheet_names}")
        
        for sheet_name in xl.sheet_names:
            print(f"\nProcessing sheet: {sheet_name}")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            print(f"Columns: {df.columns.tolist()}")
            print("First 5 rows:")
            print(df.head(5))
            print("-" * 30)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
