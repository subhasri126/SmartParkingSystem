import os

files = [
    "dashboard-script.js",
    "destination-script.js",
    "script.js",
    "explore-script.js",
    "destination-experience-script.js",
    "auth-script.js",
    r"app\my-trips\my-trips.js",
    r"app\reviews\reviews.js",
    r"app\explore\explore.js",
    r"app\home\home.js"
]

base_dir = r"d:\travel\travel"

for file_rel in files:
    file_path = os.path.join(base_dir, file_rel)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content.replace('http://localhost:5000', 'http://localhost:3000')
            
            if content != new_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file_rel}")
            else:
                print(f"No changes in {file_rel}")
        except Exception as e:
            print(f"Error processing {file_rel}: {e}")
    else:
        print(f"File not found: {file_rel}")
