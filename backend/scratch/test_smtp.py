import socket

def test_connection(host, port):
    try:
        print(f"Testing connection to {host}:{port}...")
        socket.create_connection((host, port), timeout=5)
        print("Connection successful!")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection("smtp.gmail.com", 587)
    test_connection("smtp.gmail.com", 465)
