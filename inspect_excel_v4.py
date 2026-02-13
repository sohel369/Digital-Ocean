import pandas as pd

file_path = "Geograpic Size and Population of  14 Different Countries.xlsx"
df = pd.read_excel(file_path, sheet_name='us-states---ranking-by-populati')

# Look for rows that might indicate a new country
for i, row in df.iterrows():
    if pd.isna(row[0]) or "state" in str(row[0]).lower() or "country" in str(row[0]).lower():
        print(f"Row {i}: {row.tolist()}")

print("\nLast 10 rows:")
print(df.tail(10))
