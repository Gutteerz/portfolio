from flask_mail import Message
from email_validator import validate_email, EmailNotValidError
import bleach
from app import mail

def sanitize_input(data):
    """Sanitize user input to prevent malicious input."""
    return bleach.clean(data)

def validate_form_data(name, email, message):
    """Validate the form data for required fields and valid email."""
    if not name or not email or not message:
        raise ValueError("All fields are required.")
    try:
        validate_email(email)
    except EmailNotValidError as e:
        raise ValueError(f"Invalid email address: {e}")

def send_email(name, email, message):
    """Send the email synchronously."""
    msg = Message(
        subject=f"New Contact Form Submission from {name}",
        sender=email,
        recipients=["your_email@example.com"],  # Replace with your email
        body=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
    )
    try:
        mail.send(msg)
    except Exception as e:
        raise RuntimeError(f"Failed to send email: {e}")