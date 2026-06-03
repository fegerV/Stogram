#!/usr/bin/env python3
import os, shutil

base = '/home/engine/project/docs'

# Remove old deployment files
dep_old = ['DEPLOYMENT.md', 'MIGRATION_GUIDE.md', 'QUICKSTART.md', 'RAILWAY_DEPLOYMENT.md', 
           'RAILWAY_QUICKSTART.md', 'RAILWAY_SUMMARY.md', 'RENDER_NEON_SETUP.md', 
           'SMTP_SETUP.md', 'VERCEL_DEPLOYMENT_ANALYSIS.md', 'VERCEL_SETUP.md']
for f in dep_old:
    p = os.path.join(base, 'deployment', f)
    if os.path.exists(p):
        os.remove(p)

# Remove old API files
api_old = ['TELEGRAM_EXAMPLES.md', 'TELEGRAM_SETUP.md']
for f in api_old:
    p = os.path.join(base, 'api', f)
    if os.path.exists(p):
        os.remove(p)

# Print remaining
for root, dirs, files in os.walk(base):
    for f in sorted(files):
        p = os.path.relpath(os.path.join(root, f), base)
        if f.endswith('.md'):
            print(p)

print("\nDone!")