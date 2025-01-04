from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
from app.contact import sanitize_input, validate_form_data, send_email
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
@main.route("/contact", methods=["GET", "POST"])
@limiter.limit("5 per hour")
def contact():
    if request.method == "POST":
        try:
            # Sanitize inputs
            name = sanitize_input(request.form.get("name"))
            email = sanitize_input(request.form.get("email"))
            message = sanitize_input(request.form.get("message"))
            recaptcha_response = request.form.get("g-recaptcha-response")

            # Validate inputs
            validate_form_data(name, email, message)

            # Verify reCAPTCHA
            if not recaptcha_response:
                flash("reCAPTCHA verification failed. Please try again.", "error")
                return redirect(url_for("main.contact"))

            # Send email
            send_email(name, email, message)
            flash("Your message has been sent successfully!", "success")
            return redirect(url_for("main.contact"))

        except ValueError as e:
            flash(str(e), "error")
        except RuntimeError as e:
            flash("An unexpected error occurred. Please try again later.", "error")

    return render_template("contact.html", recaptcha_public_key=current_app.config["RECAPTCHA_PUBLIC_KEY"])