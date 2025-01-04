from flask import flash
from flask_mail import Message
from email_validator import validate_email, EmailNotValidError
from app import mail
import bleach
import requests

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

def sanitize_input(name, email, message):
    return bleach.clean(name), bleach.clean(email), bleach.clean(message)

def validate_contact_form(name, email, message):
    if not name.strip() or not email.strip() or not message.strip():
        flash('All fields are required!', 'error')
        return False
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        flash('Invalid email address. Please enter a valid email.', 'error')
        return False

def verify_recaptcha(response, secret):
    recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify'
    recaptcha_data = {'secret': secret, 'response': response}
    try:
        recaptcha_verify = requests.post(recaptcha_url, data=recaptcha_data).json()
        return recaptcha_verify.get('success', False)
    except requests.RequestException:
        return False