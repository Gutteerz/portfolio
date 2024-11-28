from flask import Blueprint, render_template, request, flash, redirect, url_for

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('home.html')

@main.route('/about')
def about():
    return render_template('about.html')

@main.route('/portfolio')
def portfolio():
    return render_template('portfolio.html')

@main.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')

        if not name or not email or not message:
            flash('All fields are required!', 'error')
        else:
            # Handle form submission logic here
            flash('Message sent successfully!', 'success')
            return redirect(url_for('main.contact'))

    return render_template('contact.html')
