import pandas as pd
import os

file_path = r'd:\New folder\React.js-compatible 7 - backend\Geograpic Size and Population of  14 Different Countries.xlsx'

try:
    xl = pd.ExcelFile(file_path)
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        df.to_csv(f"sheet_{sheet_name.replace(' ', '_')}.csv", index=False)
        print(f"Saved {sheet_name} to sheet_{sheet_name.replace(' ', '_')}.csv")
except Exception as e:
    print(f"Error: {e}")
