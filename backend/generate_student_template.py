import pandas as pd

# Define the columns in the exact preferred order
columns = [
    'Program Name', 
    'Batch Year', 
    'Academic Year', 
    'Semester', 
    'Class', 
    'Division', 
    'Enrollment No', 
    'Roll No', 
    'Student Name', 
    'Is Active'
]

# Sample data
# Note: Batch Year should be an integer (e.g., 2023) because the system looks up Batch by year.
# Academic Year can be "2024-25"
data = []

df = pd.DataFrame(data, columns=columns)

# Save to Excel
file_path = 'Student_Bulk_Upload_Template.xlsx'
df.to_excel(file_path, index=False)

print(f"Template created successfully: {file_path}")
