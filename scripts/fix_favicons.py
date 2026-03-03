import os
import base64

ROOT = r"d:\Voyago\travel"

def create_ico(filename):
    # Minimal 1x1 transparent ICO
    b64 = b'AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    with open(filename, 'wb') as f:
        f.write(base64.b64decode(b64))

create_ico(os.path.join(ROOT, "favicon.ico"))

for root, _, files in os.walk(ROOT):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith('.html'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            if '<link rel="icon"' not in content and '</head>' in content:
                rel_path = os.path.relpath(ROOT, root)
                if rel_path == '.':
                    prefix = ''
                else:
                    prefix = rel_path.replace('\\', '/') + '/'
                
                insertion = f'    <!-- Favicon -->\n    <link rel="icon" type="image/x-icon" href="/favicon.ico">\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n</head>'
                # Fixed to use absolute paths since we're using a static frontend and npx http-server from the root level.
                content = content.replace('</head>', insertion)
                
                with open(filepath, 'w', encoding='utf-8') as out_file:
                    out_file.write(content)
                    
print("Favicons processing complete.")
