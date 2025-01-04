from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
from app.contact import process_contact_form, sanitize_input, validate_contact_form, verify_recaptcha
from app import limiter

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
@limiter.limit("5 per hour")
def contact():
    if request.method == 'POST':
        recaptcha_response = request.form.get('g-recaptcha-response')
        if not verify_recaptcha(recaptcha_response, current_app.config['RECAPTCHA_PRIVATE_KEY']):
            flash('Please complete the reCAPTCHA to proceed.', 'error')
            return redirect(url_for('main.contact'))

        name, email, message = sanitize_input(
            request.form.get('name'),
            request.form.get('email'),
            request.form.get('message')
        )

        if not validate_contact_form(name, email, message):
            return redirect(url_for('main.contact'))

        if process_contact_form(name, email, message):
            flash('Your message has been sent. Thank you!', 'success')
        else:
            flash('An error occurred while sending your message. Please try again later.', 'error')

        return redirect(url_for('main.contact'))

    return render_template('contact.html')
