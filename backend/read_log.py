import os

log_path = r'c:\Users\mando\Downloads\taskflow_v2\taskflow_v2\backend\full_mvn_output.txt'
if os.path.exists(log_path):
    with open(log_path, 'r', encoding='utf-16le', errors='ignore') as f:
        lines = f.readlines()
        for line in lines:
            if '[ERROR]' in line:
                print(line.strip())
else:
    print("Log file not found.")
