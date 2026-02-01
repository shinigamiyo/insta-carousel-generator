import pathlib
import re
from urllib.parse import quote_plus

import requests

FONTS = {
    "Inter": [400, 500, 600, 700],
    "Poppins": [400, 500, 600, 700],
    "Roboto": [400, 500, 700],
    "Montserrat": [400, 500, 600, 700],
    "Raleway": [400, 500, 600, 700],
    "Playfair Display": [400, 600, 700],
    "Manrope": [400, 500, 600, 700],
    "Space Grotesk": [400, 500, 600, 700],
    "Lora": [400, 600, 700],
    "DM Sans": [400, 500, 700],
    "Oswald": [400, 500, 600],
}

OUTPUT_DIR = pathlib.Path('public/fonts')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

session = requests.Session()
session.headers.update(
    {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
        'Accept': 'text/css,*/*;q=0.1',
    }
)

CSS_TEMPLATE = 'https://fonts.googleapis.com/css2?family={family}:wght@{weights}&display=swap'
BLOCK_PATTERN = re.compile(r"@font-face\s*{[^}]+}")
URL_PATTERN = re.compile(r"src: url\(([^)]+)\) format\('([^']+)'\);")
WEIGHT_PATTERN = re.compile(r"font-weight:\s*(\d+);")

for family, weights in FONTS.items():
    weight_list = ';'.join(str(w) for w in sorted(set(weights)))
    css_url = CSS_TEMPLATE.format(family=quote_plus(family), weights=weight_list)
    print(f"Fetching {family}...")
    resp = session.get(css_url, timeout=30)
    resp.raise_for_status()
    css = resp.text
    for block in BLOCK_PATTERN.findall(css):
        weight_match = WEIGHT_PATTERN.search(block)
        if not weight_match:
            continue
        weight = int(weight_match.group(1))
        if weight not in weights:
            continue
        url_match = URL_PATTERN.search(block)
        if not url_match:
            continue
        url, fmt = url_match.groups()
        if fmt != 'woff2':
            # fallback to accept other formats if woff2 unavailable
            pass
        filename = f"{family.replace(' ', '')}-{weight}.{url.split('.')[-1]}"
        dest = OUTPUT_DIR / filename
        if dest.exists():
            continue
        print(f"  downloading weight {weight}")
        font_resp = session.get(url, timeout=60)
        font_resp.raise_for_status()
        dest.write_bytes(font_resp.content)

print('Done.')
