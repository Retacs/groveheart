"""Local preview server that also serves clean URLs (/about -> about.html), like GitHub Pages.
Every page gets the theme bar from tools/theme-switcher.js, which the live site never loads.
Run it from the repository root: python3 tools/serve.py"""

import http.server
import io
import pathlib

SWITCHER = b'<script src="/tools/theme-switcher.js"></script>\n</body>'

class CleanUrls(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = pathlib.Path(super().translate_path(path))
        if not local.exists() and local.with_suffix(".html").exists():
            return str(local.with_suffix(".html"))
        return str(local)

    def send_head(self):
        page = pathlib.Path(self.translate_path(self.path))
        if page.is_dir():
            page /= "index.html"
        if page.suffix != ".html" or not page.is_file():
            return super().send_head()
        html = page.read_bytes().replace(b"</body>", SWITCHER, 1)
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        return io.BytesIO(html)

    def end_headers(self):
        # The browser checks back for every file, so changes show up on the next reload
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

# Only reachable from this computer, not from other devices on the network
http.server.ThreadingHTTPServer(("127.0.0.1", 8080), CleanUrls).serve_forever()
