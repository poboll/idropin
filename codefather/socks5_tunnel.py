"""
SOCKS5 TCP tunnel: forwards TLS connections via Surge's SOCKS5 proxy.
Listens on 0.0.0.0 for multiple (port, target_host, target_port) mappings.
"""
import socket, threading, logging, signal, sys

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('tunnel')

SOCKS5_HOST = '127.0.0.1'
SOCKS5_PORT = 8235

TUNNELS = [
    (4430, 'www.codefather.cn',  443),
    (4431, 'api.codefather.cn',  443),
    (4432, 'pic.code-nav.cn',    443),
]

def socks5_connect(target_host: str, target_port: int) -> socket.socket:
    s = socket.create_connection((SOCKS5_HOST, SOCKS5_PORT), timeout=10)
    s.sendall(b'\x05\x01\x00')
    if s.recv(2) != b'\x05\x00':
        raise ConnectionError('SOCKS5 auth failed')
    host_b = target_host.encode()
    req = b'\x05\x01\x00\x03' + bytes([len(host_b)]) + host_b + target_port.to_bytes(2, 'big')
    s.sendall(req)
    resp = s.recv(10)
    if resp[1] != 0:
        raise ConnectionError(f'SOCKS5 connect error: {resp[1]}')
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
            try:
                sock.shutdown(socket.SHUT_RDWR)
            except Exception:
                pass
            try:
                sock.close()
            except Exception:
                pass

def handle(client: socket.socket, target_host: str, target_port: int):
    try:
        upstream = socks5_connect(target_host, target_port)
    except Exception as e:
        log.warning('upstream connect failed %s:%s %s', target_host, target_port, e)
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
    log.info('listening 0.0.0.0:%d -> %s:%d via SOCKS5 %s:%d',
             local_port, target_host, target_port, SOCKS5_HOST, SOCKS5_PORT)
    while True:
        try:
            client, addr = srv.accept()
        except Exception:
            break
        threading.Thread(target=handle, args=(client, target_host, target_port), daemon=True).start()

if __name__ == '__main__':
    for local_port, target_host, target_port in TUNNELS:
        t = threading.Thread(target=serve, args=(local_port, target_host, target_port), daemon=True)
        t.start()
    log.info('all tunnels started, press Ctrl-C to stop')
    signal.pause()
