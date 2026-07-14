from pathlib import Path
from bs4 import BeautifulSoup
import json, re, sys
root=Path(__file__).resolve().parents[1]
errors=[]
# Required root files
required=['index.html','styles.css','logic.js','app.js','config.js','backend.js','native-billing-bridge.js','manifest.webmanifest','service-worker.js','vercel.json','404.html']
for name in required:
    if not (root/name).exists(): errors.append(f'Missing required file: {name}')
# Parse HTML files and local references
for file in root.rglob('*.html'):
    soup=BeautifulSoup(file.read_text(encoding='utf-8',errors='replace'),'html.parser')
    if not soup.find('title'): errors.append(f'{file.relative_to(root)} has no title')
    for tag,attr in [('a','href'),('link','href'),('script','src'),('img','src')]:
        for node in soup.find_all(tag):
            value=node.get(attr)
            if not value or value.startswith(('#','http:','https:','mailto:','tel:','data:','javascript:')): continue
            local=value.split('#',1)[0].split('?',1)[0]
            path=(file.parent/local).resolve()
            if value.endswith('/'): path=path/'index.html'
            if not path.exists(): errors.append(f'{file.relative_to(root)} broken {attr}: {value}')
# Screen navigation targets
soup=BeautifulSoup((root/'index.html').read_text(encoding='utf-8'),'html.parser')
screens={node.get('id') for node in soup.select('.screen')}
targets={node.get('data-go') for node in soup.select('[data-go]')}
for target in sorted(targets-screens): errors.append(f'Navigation target has no screen: {target}')
if len(screens)!=31: errors.append(f'Expected 31 screens, found {len(screens)}')
# Every form has an ID and submit binding
js=(root/'app.js').read_text(encoding='utf-8')
for form in soup.find_all('form'):
    fid=form.get('id')
    if not fid: errors.append('Form without id')
    elif f"$('#{fid}').addEventListener('submit'" not in js: errors.append(f'Form not submit-bound: {fid}')
# JSON parse
for name in ['manifest.webmanifest','vercel.json']:
    try: json.loads((root/name).read_text(encoding='utf-8'))
    except Exception as exc: errors.append(f'Invalid JSON {name}: {exc}')
# Payment catalogue
cfg=(root/'config.js').read_text(encoding='utf-8')
if cfg.count('stripePaymentLink')!=4: errors.append('Expected four Stripe mapping fields')
# Legal pages
for name in ['privacy-policy.html','terms-of-use.html','safety-disclaimer.html','subscription-terms.html','refund-cancellation-policy.html','account-deletion.html','community-guidelines.html','support.html','ip-notice.html']:
    if not (root/'legal'/name).exists(): errors.append(f'Missing legal page: {name}')
if errors:
    print('\n'.join(f'ERROR: {e}' for e in errors))
    sys.exit(1)
print(f'PASS: {len(screens)} screens, {len(soup.find_all("form"))} bound forms, all local links and required files present.')
