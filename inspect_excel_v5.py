import pandas as pd

file_path = "Geograpic Size and Population of  14 Different Countries.xlsx"
df = pd.read_excel(file_path, sheet_name='us-states---ranking-by-populati')

# The structure seems to be:
# Country Header Row (contains 'state' or similar)
# Rows of data
# Empty rows
# Next Country Header Row

current_country = "USA" # Default first
countries_found = []

# Strategy: Look for rows where the first column is 'Column1.state'
for i, row in df.iterrows():
    val = str(row[0])
    if "Column1.state" in val:
        # Check previous rows or current row for country indicator
        # Based on previous output, row 487 is 'Column1.state' and mentions 'Andrha Pradesh as Control' in a later column?
        # Actually, let's look at the header row columns
        cols = row.tolist()
        # Find if any column name hints at the country
        hint = ""
        for c in cols:
            if isinstance(c, str) and " as Control" in c:
                hint = c.replace(" as Control", "")
                break
        
        if hint:
            countries_found.append((i, hint))
        elif i == 0:
            countries_found.append((i, "USA"))
        else:
            countries_found.append((i, f"Unknown_{i}"))

print("Countries found:")
for idx, name in countries_found:
    print(f"Index {idx}: {name}")

# Let's inspect rows around these indices
for idx, name in countries_found:
    print(f"\n--- {name} (Starts at {idx}) ---")
    print(df.iloc[idx+1:idx+6, :4]) # Print first few data rows
