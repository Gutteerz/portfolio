import os, json
from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
from app.contact import ContactForm
from app import limiter, mail
from flask_mail import Message


main = Blueprint('main', __name__)

# Allowed tags and attributes for sanitization (for rich-text inputs if necessary)
ALLOWED_TAGS = []
ALLOWED_ATTRIBUTES = {}


@main.route('/')
@limiter.limit("10 per minute")  # Limit homepage requests to 10 per minute per IP
def home():
    return render_template('home.html')


@main.route('/resume')
@limiter.limit("10 per minute")
def resume():
    # Load resume data from JSON file
    data_path = os.path.join(current_app.root_path, 'data', 'resume.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        resume_data = json.load(f)
    return render_template('resume.html', resume=resume_data)


@main.route('/about')
@limiter.limit("10 per minute")
def about():
    return render_template('about.html')


@main.route('/portfolio')
@limiter.limit("10 per minute")
def portfolio():
    return render_template('portfolio.html')


@main.route('/privacy')
@limiter.limit("10 per minute")
def privacy():
    return render_template('privacy.html')


@main.route('/portfolio/mario')
def mario_project():
    return render_template('projects/mario.html')


@main.route('/portfolio/autoticket')
def ai_dashcam_project():
    return render_template('projects/autoticket.html')


@main.route('/portfolio/smart-clock')
def smart_clock_project():
    return render_template('projects/smart_clock.html')


@main.route('/portfolio/godforsakenplace')
def godforsakenplace():
    return render_template('projects/godforsakenplace.html')


@main.route('/portfolio/studak')
def studak():
    return render_template('projects/studak.html')


@main.route('/portfolio/portfolio-website')
def portfolio_website_project():
    return render_template('projects/portfolio_project.html')


@main.route('/play/godforsakenplace')
@limiter.limit("10 per minute")
def play_godforsakenplace():
    # Configure the external frontend URL via environment variable
    # Example: GODFORSAKENPLACE_URL=https://play.example.com
    game_url = os.getenv('GODFORSAKENPLACE_URL')
    return render_template('projects/godforsakenplace_play.html', game_url=game_url)


@main.route('/contact', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def contact():
    form = ContactForm()

    if form.validate_on_submit():
        name = form.name.data
        sender_email = form.email.data
        message_body = form.message.data
        recipient = os.getenv("MAIL_RECIPIENT")

        if not recipient:
            flash( "Something went wrong. Please try again later. 100", "danger" )
            return redirect(url_for('main.contact'))

        configured_sender = (
            current_app.config.get("MAIL_DEFAULT_SENDER")
            or current_app.config.get("MAIL_USERNAME")
        )

        if not configured_sender:
            flash("Something went wrong. Please try again later. 101", "danger")
            return redirect(url_for('main.contact'))

        msg = Message(
            subject="New Contact Form Submission",
            sender=configured_sender,
            reply_to=sender_email,
            recipients=[recipient],
            body=f"From: {name} <{sender_email}>\n\n{message_body}"
        )

        try:
            mail.send(msg)
            flash("Your message has been sent. Thank you!", "success")
            return redirect(url_for('main.contact'))
        except Exception as e:
            # Log or handle the error as needed
            flash("An error occurred while sending your message. Please try again.", "danger")

    # Render the template with the form
    return render_template('contact.html', form=form)
