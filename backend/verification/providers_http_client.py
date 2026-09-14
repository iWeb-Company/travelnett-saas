"""Real loopback HTTP fixture, using installed uvicorn and the standard library."""
import socket
import threading
import time
from types import SimpleNamespace
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import uvicorn


class LocalClient:
    def __init__(self, app):
        self.headers = {}
        self.socket = socket.socket()
        self.socket.bind(('127.0.0.1', 0))
        self.url = f'http://127.0.0.1:{self.socket.getsockname()[1]}'
        self.server = uvicorn.Server(uvicorn.Config(app, log_level='error', lifespan='off'))
        self.thread = threading.Thread(target=self.server.run, kwargs={'sockets': [self.socket]}, daemon=True)
        self.thread.start()
        deadline = time.monotonic() + 5
        while not self.server.started:
            if not self.thread.is_alive() or time.monotonic() >= deadline:
                self.close()
                raise RuntimeError('El servidor HTTP fixture no inició')
            time.sleep(0.01)

    def close(self):
        self.server.should_exit = True
        self.thread.join(timeout=5)
        self.socket.close()

    def request(self, method, path, *, params=None, json=None):
        import json as codec
        data = codec.dumps(json).encode() if json is not None else None
        request = Request(self.url + path + ('?' + urlencode(params) if params else ''),
                          data=data, method=method,
                          headers={**self.headers, 'Content-Type': 'application/json'})
        try:
            response = urlopen(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            text = response.read().decode()
            return SimpleNamespace(status_code=response.status, text=text, json=lambda: codec.loads(text))

    def get(self, path, **kwargs):
        return self.request('GET', path, **kwargs)

    def post(self, path, **kwargs):
        return self.request('POST', path, **kwargs)

    def put(self, path, **kwargs):
        return self.request('PUT', path, **kwargs)

    def delete(self, path, **kwargs):
        return self.request('DELETE', path, **kwargs)
