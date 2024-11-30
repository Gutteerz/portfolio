from flask import flash
from flask_mail import Message
from app import mail
from email_validator import validate_email, EmailNotValidError

def process_contact_form(name, email, message):
    """
    Process the contact form by sending an email.
    """
    try:
        # Compose email
        msg = Message(
            subject=f"New Contact Form Submission from {name}",
            sender=email,
            recipients=["MAIL_RECIPIENT"],
            body=f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        )
        # Send email
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
