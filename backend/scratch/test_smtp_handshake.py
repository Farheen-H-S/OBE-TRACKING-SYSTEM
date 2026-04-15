import smtplib
import ssl

def test_smtp_handshake(host, port, use_tls=True):
    try:
        print(f"Testing SMTP handshake to {host}:{port} (TLS={use_tls})...")
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()
        
        server.ehlo()
        print("Handshake successful!")
        server.quit()
    except Exception as e:
        print(f"Handshake failed: {e}")

if __name__ == "__main__":
    test_smtp_handshake("smtp.gmail.com", 587, use_tls=True)
    test_smtp_handshake("smtp.gmail.com", 465, use_tls=False)
