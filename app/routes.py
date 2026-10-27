import os

from flask import Blueprint, abort, current_app, jsonify, redirect, render_template, request, url_for
from flask_mail import Message

from app import limiter, mail
from app.contact import ContactForm
from app.profile import load_profile
from app.projects import load_projects


main = Blueprint('main', __name__)

LEGACY_PROJECTS = {
    'rtos': 'uiasub-rtos',
    'uiasub-rtos': 'uiasub-rtos',
    'mario': 'mario',
    'autoticket': 'ai-dashcam',
    'ai-dashcam': 'ai-dashcam',
    'smart-clock': 'smart-clock',
    'smart_clock': 'smart-clock',
    'godforsakenplace': 'godforsakenplace',
    'studak': 'studak',
    'portfolio': 'portfolio',
    'portfolio-website': 'portfolio',
}


def contact_settings():
    config = current_app.config
    recipient = config.get('MAIL_RECIPIENT') or os.getenv('MAIL_RECIPIENT')
    sender = config.get('MAIL_DEFAULT_SENDER') or config.get('MAIL_USERNAME')
    enabled = all((
        recipient, sender, config.get('MAIL_SERVER'), config.get('SECRET_KEY'),
        config.get('RECAPTCHA_PUBLIC_KEY'), config.get('RECAPTCHA_PRIVATE_KEY'),
    )) and (not config.get('MAIL_USERNAME') or bool(config.get('MAIL_PASSWORD')))
    return recipient, sender, enabled


def render_workshop(contact_form=None, contact_result=None, initial_panel=''):
    _, _, enabled = contact_settings()
    if contact_form is None:
        contact_form = ContactForm() if current_app.secret_key else ContactForm(meta={'csrf': False})
    return render_template(
        'home.html', projects=load_projects(), profile=load_profile(),
        contact_form=contact_form,
        contact_enabled=enabled,
        recaptcha_site_key=current_app.config.get('RECAPTCHA_PUBLIC_KEY', '') if enabled else '',
        contact_result=contact_result, initial_panel=initial_panel,
    )


def world_redirect(fragment):
    return redirect(url_for('main.home', _anchor=fragment), code=301)


@main.route('/')
@limiter.limit('10 per minute')
def home():
    return render_workshop()


@main.route('/resume')
def resume():
    return world_redirect('resume')


@main.route('/about')
def about():
    return world_redirect('experience')


@main.route('/portfolio')
def portfolio():
    return world_redirect('index')


@main.route('/privacy')
def privacy():
    return world_redirect('privacy')


@main.route('/projects/<project_id>')
def catalog_project(project_id):
    if not any(project['id'] == project_id for project in load_projects()):
        abort(404)
    return world_redirect('project=' + project_id)


@main.route('/portfolio/<slug>')
def legacy_project(slug):
    project_id = LEGACY_PROJECTS.get(slug)
    if project_id is None:
        abort(404)
    return catalog_project(project_id)


@main.route('/play/godforsakenplace')
def play_godforsakenplace():
    return catalog_project('godforsakenplace')


@main.route('/contact', methods=['GET', 'POST'])
@limiter.limit('10 per minute')
def contact():
    if request.method == 'GET':
        return world_redirect('contact')

    recipient, sender, enabled = contact_settings()
    form = ContactForm() if current_app.secret_key else ContactForm(meta={'csrf': False})
    status = 400
    if not enabled:
        result = {'ok': False, 'message': 'The contact form is unavailable. Please use the email link instead.', 'errors': {}}
        status = 503
    elif not form.validate_on_submit():
        result = {'ok': False, 'message': 'Please check the form and try again.', 'errors': form.errors}
    else:
        message = Message(
            subject='New Contact Form Submission', sender=sender,
            reply_to=form.email.data, recipients=[recipient],
            body=f'From: {form.name.data} <{form.email.data}>\n\n{form.message.data}',
        )
        try:
            mail.send(message)
        except Exception:
            current_app.logger.warning('Contact email delivery failed.')
            result = {'ok': False, 'message': 'The message could not be sent. Please try again or use the email link.', 'errors': {}}
            status = 503
        else:
            result = {'ok': True, 'message': 'Your message has been sent. Thank you!', 'errors': {}}
            status = 200
            form = ContactForm(formdata=None)

    if request.accept_mimetypes.best_match(['application/json', 'text/html']) == 'application/json':
        return jsonify(result), status
    return render_workshop(form, result, initial_panel='contact'), status
