#!/usr/bin/env python3
"""Bundle index.html + style.css + js/*.js into one self-contained file."""
import re, pathlib
d = pathlib.Path(__file__).parent
h = (d / 'index.html').read_text()
h = h.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (d / 'style.css').read_text() + '</style>')
h = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: '<script>\n' + (d / m.group(1)).read_text().replace('</script>', '<\\/script>') + '</script>', h)
(d / 'orderflow-terminal.html').write_text(h)
print('wrote', d / 'orderflow-terminal.html', len(h) // 1024, 'KB')
