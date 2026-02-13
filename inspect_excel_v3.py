import pandas as pd
import json

file_path = "Geograpic Size and Population of  14 Different Countries.xlsx"
xl = pd.ExcelFile(file_path)

res = {}
for sheet_name in xl.sheet_names:
    df = xl.parse(sheet_name)
    res[sheet_name] = {
        "columns": df.columns.tolist(),
        "head": df.head(10).to_dict(orient='records')
    }

print(json.dumps(res, indent=2))
