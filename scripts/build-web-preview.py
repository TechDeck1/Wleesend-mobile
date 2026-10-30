#!/usr/bin/env python3
"""Pack the single-page web export (dist/web) into one self-contained HTML file.

Hosted previews only load a page's own files by relative path, so the app's JS
bundle is inlined and every asset it references becomes a data: URI.

Usage: python3 scripts/build-web-preview.py dist/web <output.html>
"""
import base64
import mimetypes
import pathlib
import re
import sys

export_dir = pathlib.Path(sys.argv[1])
out_path = pathlib.Path(sys.argv[2])

bundle_path = next((export_dir / '_expo/static/js/web').glob('entry-*.js'))
bundle = bundle_path.read_text()

mimetypes.add_type('font/ttf', '.ttf')


def to_data_uri(match: re.Match) -> str:
    rel = match.group(1)
    file = export_dir / rel.lstrip('/')
    if not file.exists():
        return match.group(0)
    mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
    return '"data:%s;base64,%s"' % (mime, base64.b64encode(file.read_bytes()).decode())


bundle = re.sub(r'"(/assets/[^"]+)"', to_data_uri, bundle)
bundle = re.sub(r'</(script)', r'<\\/\1', bundle, flags=re.IGNORECASE)

page = """<title>Wleesend</title>
<style>
/* Layout: the app runs full-screen on phones and inside a phone-sized frame on wider screens. */
:root {
  --ground: #E9EBF4;
  --frame: #FFFFFF;
  --edge: #D3D7E6;
  --ink: #171B4D;
  --muted: #5B6080;
  --shadow: rgba(23, 27, 77, 0.16);
  --font-ui: "Lexend", system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ground: #07081C; --frame: #0D0F2B; --edge: #2A2E63; --ink: #F1F2FB; --muted: #A6AACB;
    --shadow: rgba(0, 0, 0, 0.5); color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --ground: #07081C; --frame: #0D0F2B; --edge: #2A2E63; --ink: #F1F2FB; --muted: #A6AACB;
  --shadow: rgba(0, 0, 0, 0.5); color-scheme: dark;
}
html, body { height: 100%; }
body {
  overflow: hidden;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-ui);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.note { display: none; }
#root { display: flex; flex: 1; width: 100%; min-height: 0; background: var(--frame); }
@media (min-width: 560px) and (min-height: 640px) {
  body { justify-content: center; gap: 14px; padding-block: 24px; padding-inline: 16px; }
  .note {
    display: block; margin: 0; max-width: 430px; text-align: center;
    font-size: 13px; line-height: 1.5; color: var(--muted); text-wrap: balance;
  }
  #root {
    flex: none; width: 430px; max-width: 100%; height: min(100%, 932px);
    border: 1px solid var(--edge); border-radius: 36px; overflow: hidden;
    box-shadow: 0 24px 60px var(--shadow);
  }
}
</style>
<p class="note">Wleesend prototype. Tap through it like the app. Prices and transactions are sample data, and no payment is charged.</p>
<div id="root"></div>
<script>
// Expo Router routes by URL path; start every visit at the home screen.
try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
</script>
<script>
""" + bundle + """
</script>
"""

out_path.write_text(page)
print(f'{out_path} {out_path.stat().st_size / 1e6:.1f} MB')
