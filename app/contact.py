from flask_wtf import FlaskForm, RecaptchaField
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length


# Contact form via Flask-WTF
class ContactForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(max=50)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=100)])
    message = TextAreaField('Message', validators=[DataRequired(), Length(max=1000)])
    recaptcha = RecaptchaField()
    submit = SubmitField('Send')
