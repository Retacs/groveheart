"""Local preview server that also serves clean URLs (/about -> about.html), like GitHub Pages.
Run it from the repository root: python3 tools/serve.py"""

import http.server
import pathlib

class CleanUrls(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = pathlib.Path(super().translate_path(path))
        if not local.exists() and local.with_suffix(".html").exists():
            return str(local.with_suffix(".html"))
        return str(local)

http.server.ThreadingHTTPServer(("", 8080), CleanUrls).serve_forever()
