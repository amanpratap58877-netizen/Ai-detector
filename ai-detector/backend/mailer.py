import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load Google SMTP settings from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "AI-DETECTOR Security")

def send_password_reset_email(to_email: str, reset_token: str, base_url: str = "http://localhost:5173") -> bool:
    """
    Sends an official password reset email using Google SMTP relay (smtp.gmail.com).
    Requires a Google App Password configured in .env (SMTP_USER & SMTP_PASSWORD).
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[Mailer Notice] SMTP_USER or SMTP_PASSWORD not set in .env. Falling back to Firebase reset.")
        return False

    reset_link = f"{base_url}/login?resetToken={reset_token}&email={to_email}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset Your AI-DETECTOR Password"
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #0b1120;
          margin: 0;
          padding: 32px 16px;
          color: #ffffff;
        }}
        .card {{
          max-width: 500px;
          margin: 0 auto;
          background: #111a33;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }}
        .badge {{
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #818cf8;
          background: rgba(99, 102, 241, 0.15);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          margin-bottom: 20px;
        }}
        h2 {{
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 12px 0;
        }}
        p {{
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }}
        .btn {{
          display: inline-block;
          background: #4f46e5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          margin: 20px 0;
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }}
        .footer {{
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 11px;
          color: #64748b;
        }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">AI-DETECTOR SECURITY</div>
        <h2>Reset Your Password</h2>
        <p>Hello,</p>
        <p>A password reset was requested for your <strong>AI-DETECTOR</strong> account associated with <strong>{to_email}</strong>.</p>
        <p>Click the button below to securely set a new password. This reset link is valid for 1 hour.</p>
        <a href="{reset_link}" class="btn" target="_blank">Reset Password</a>
        <p>If you did not request this password reset, no action is needed. Your account remains completely secure.</p>
        <div class="footer">
          Validated via MySQL Server 8.0 & Google SMTP Relay.
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html_content, "html"))

    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)
            server.ehlo()
            server.starttls()
            server.ehlo()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"[Mailer] Successfully sent password reset email to {to_email} via Google SMTP.")
        return True
    except Exception as e:
        print(f"[Mailer Error] Google SMTP dispatch failed: {e}")
        return False
