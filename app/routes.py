from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
from app.contact import process_contact_form
from email_validator import validate_email, EmailNotValidError
from app import limiter  # Import the limiter from __init__.py
import bleach
import requests

main = Blueprint('main', __name__)

# Allowed tags and attributes for sanitization (for rich-text inputs if necessary)
ALLOWED_TAGS = []
ALLOWED_ATTRIBUTES = {}


@main.route('/')
@limiter.limit("10 per minute")  # Limit homepage requests to 10 per minute per IP
def home():
    return render_template('home.html')


@main.route('/about')
@limiter.limit("10 per minute")
def about():
    return render_template('about.html')


@main.route('/portfolio')
@limiter.limit("10 per minute")
def portfolio():
    return render_template('portfolio.html')

#Refs to the projects
@main.route('/portfolio/mario')
def mario_project():
    return render_template('projects/mario.html')


@main.route('/portfolio/autoticket')
def ai_dashcam_project():
    return render_template('projects/autoticket.html')


@main.route('/portfolio/smart-clock')
def smart_clock_project():
    return render_template('projects/smart_clock.html')

#WIP contact
@main.route('/contact', methods=['GET', 'POST'])
@limiter.limit("5 per hour")  # Prevent spam with rate limiting
def contact():
    if request.method == 'POST':
        # reCAPTCHA Verification
        recaptcha_response = request.form.get('g-recaptcha-response')
        recaptcha_url = 'https://www.google.com/recaptcha/api/siteverify'
        recaptcha_secret = current_app.config['RECAPTCHA_PRIVATE_KEY']
        recaptcha_data = {'secret': recaptcha_secret, 'response': recaptcha_response}

        try:
            recaptcha_verify = requests.post(recaptcha_url, data=recaptcha_data).json()
            if not recaptcha_verify.get('success'):
                flash('Please complete the reCAPTCHA to proceed.', 'error')
                return redirect(url_for('main.contact'))
        except requests.RequestException:
            flash('An error occurred while verifying reCAPTCHA. Please try again later.', 'error')
            return redirect(url_for('main.contact'))

        # Input sanitization
        raw_name = request.form.get('name')
        raw_email = request.form.get('email')
        raw_message = request.form.get('message')

        name = bleach.clean(raw_name)
        email = bleach.clean(raw_email)
        message = bleach.clean(raw_message)

        # Validate required fields
        if not name.strip() or not email.strip() or not message.strip():
            flash('All fields are required!', 'error')
            return redirect(url_for('main.contact'))

        # Email validation
        try:
            validate_email(email)
        except EmailNotValidError:
            flash('Invalid email address. Please enter a valid email.', 'error')
            return redirect(url_for('main.contact'))

        # Process and send the email
        success = process_contact_form(name, email, message)
        if success:
            flash('Your message has been sent. Thank you!', 'success')
        else:
            flash('An error occurred while sending your message. Please try again later.', 'error')

        return redirect(url_for('main.contact'))

    return render_template('contact.html')
