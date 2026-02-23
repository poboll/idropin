"""
HTTP CONNECT tunnel: listens on local ports, forwards via upstream HTTP proxy.
Designed to run inside Docker alongside cf-proxy.
"""
import socket, threading, logging, os, signal

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('tunnel')

PROXY_HOST = os.environ.get('UPSTREAM_PROXY_HOST', 'host.docker.internal')
PROXY_PORT = int(os.environ.get('UPSTREAM_PROXY_PORT', '8234'))

TUNNELS = [
    (int(os.environ.get('PORT_WWW',  '4430')), 'www.codefather.cn',  443),
    (int(os.environ.get('PORT_API',  '4431')), 'api.codefather.cn',  443),
    (int(os.environ.get('PORT_PIC',  '4432')), 'pic.code-nav.cn',    443),
]

def connect_via_proxy(target_host: str, target_port: int) -> socket.socket:
    s = socket.create_connection((PROXY_HOST, PROXY_PORT), timeout=15)
    req = (
        f'CONNECT {target_host}:{target_port} HTTP/1.1\r\n'
        f'Host: {target_host}:{target_port}\r\n'
        f'Proxy-Connection: Keep-Alive\r\n\r\n'
    ).encode()
    s.sendall(req)
    resp = b''
    while b'\r\n\r\n' not in resp:
        chunk = s.recv(4096)
        if not chunk:
            break
        resp += chunk
    status_line = resp.split(b'\r\n')[0]
    if b'200' not in status_line:
        s.close()
        raise ConnectionError(f'Proxy CONNECT failed: {status_line}')
    return s

def pipe(src: socket.socket, dst: socket.socket):
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        for sock in (src, dst):
            try: sock.shutdown(socket.SHUT_RDWR)
            except Exception: pass
            try: sock.close()
            except Exception: pass

def handle(client: socket.socket, target_host: str, target_port: int):
    try:
        upstream = connect_via_proxy(target_host, target_port)
        log.info('tunnel established: %s:%d', target_host, target_port)
    except Exception as e:
        log.warning('upstream connect failed %s:%d: %s', target_host, target_port, e)
        client.close()
        return
    t = threading.Thread(target=pipe, args=(upstream, client), daemon=True)
    t.start()
    pipe(client, upstream)

def serve(local_port: int, target_host: str, target_port: int):
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(('0.0.0.0', local_port))
    srv.listen(128)
    log.info('0.0.0.0:%d -> %s:%d via %s:%d',
             local_port, target_host, target_port, PROXY_HOST, PROXY_PORT)
    while True:
        try:
            client, addr = srv.accept()
            threading.Thread(target=handle, args=(client, target_host, target_port), daemon=True).start()
        except Exception as e:
            log.error('accept error: %s', e)
            break

if __name__ == '__main__':
    for local_port, target_host, target_port in TUNNELS:
        threading.Thread(target=serve, args=(local_port, target_host, target_port), daemon=True).start()
    log.info('all tunnels ready')
    signal.pause()
