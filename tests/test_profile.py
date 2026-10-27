import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from flask import Flask

from app import limiter
from app.contact import ContactForm
from app.profile import format_date, load_profile
from app.projects import APP_ROOT, load_projects
from app.routes import main


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.profile = json.loads((APP_ROOT / 'data' / 'resume.json').read_text(encoding='utf-8'))
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'profile.json'

    def load(self):
        self.path.write_text(json.dumps(self.profile), encoding='utf-8')
        return load_profile(self.path)

    def test_all_previous_roles_are_preserved_once(self):
        profile = load_profile()
        expected = {'uiasub', 'telenor-maritime', 'ixys', 'uia-teaching-assistant', 'elite-foto', 'ria', 'rema-1000'}
        ids = [entry['id'] for entry in profile['work']]
        self.assertTrue(expected.issubset(ids))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(profile['education']), 2)
        self.assertNotIn('projects', profile)
        self.assertEqual(set(profile['projectIds']), {project['id'] for project in load_projects()})

    def test_employment_is_distinguished_from_thesis_and_student_organization(self):
        work = {entry['id']: entry for entry in load_profile()['work']}
        self.assertEqual(work['telenor-maritime']['kind'], 'thesis')
        self.assertEqual(work['uiasub']['kind'], 'student-organization')
        self.assertEqual(work['ixys']['kind'], 'employment')

    def test_new_cv_resolves_dates_and_adds_recent_experience(self):
        work = {entry['id']: entry for entry in load_profile()['work']}
        self.assertEqual(len(work), 9)
        self.assertEqual((work['telenor-maritime']['startDate'], work['telenor-maritime']['endDate']), ('2025-01', '2025-06'))
        self.assertEqual(work['uia-teaching-assistant']['startDate'], '2024-08')
        self.assertEqual(work['uiasub']['endDate'], '2026-03')
        self.assertEqual(work['uiasub-deputy-leader']['startDate'], '2026-03')
        self.assertEqual(work['oceaneering']['startDate'], '2026-06')
        self.assertEqual(work['oceaneering']['endDate'], '2026-08')

    def test_profile_ids_must_be_unique_and_stable(self):
        self.profile['work'].append(copy.deepcopy(self.profile['work'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate profile ID'):
            self.load()
        self.profile['work'].pop()
        self.profile['work'][0]['id'] = 'Invalid ID'
        with self.assertRaisesRegex(ValueError, 'Profile IDs'):
            self.load()

    def test_date_labels_are_nonempty_and_can_be_derived(self):
        self.profile['work'][0]['dateLabel'] = ''
        with self.assertRaisesRegex(ValueError, 'dateLabel'):
            self.load()
        del self.profile['work'][0]['dateLabel']
        self.assertTrue(self.load()['work'][0]['dateLabel'])

    def test_date_format_preserves_recorded_precision(self):
        self.assertEqual(format_date('2022'), '2022')
        self.assertEqual(format_date('2025-08'), 'Aug 2025')
        self.assertEqual(format_date('Present'), 'Present')
        for invalid in ('2025-13', '2025-08-01', '', None):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                format_date(invalid)


class WorkshopRoutesTests(unittest.TestCase):
    def setUp(self):
        # This isolated Flask app never loads .env, SMTP, Redis, or Celery.
        self.app = Flask(__name__, template_folder=str(APP_ROOT / 'templates'), static_folder=str(APP_ROOT / 'static'))
        self.app.config.update(
            TESTING=True, SECRET_KEY='test-only', RATELIMIT_ENABLED=False,
            WTF_CSRF_ENABLED=True,
        )
        limiter.init_app(self.app)
        self.app.register_blueprint(main)
        self.client = self.app.test_client()

    def enable_contact(self):
        self.app.config.update(
            MAIL_SERVER='smtp.invalid', MAIL_USERNAME='sender@example.test',
            MAIL_PASSWORD='test-password', MAIL_RECIPIENT='recipient@example.test',
            RECAPTCHA_PUBLIC_KEY='public-test-key', RECAPTCHA_PRIVATE_KEY='private-test-key',
        )

    def submit(self, **kwargs):
        return self.client.post(
            '/contact', data={'name': 'Visitor', 'email': 'visitor@example.com', 'message': 'Hello'},
            headers={'Accept': 'application/json'}, **kwargs,
        )

    def test_old_pages_redirect_to_workshop_panels(self):
        for path, fragment in {
            '/about': 'experience', '/resume': 'resume', '/contact': 'contact',
            '/privacy': 'privacy', '/portfolio': 'index',
            '/play/godforsakenplace': 'project=godforsakenplace',
        }.items():
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 301)
                self.assertEqual(response.location, '/#' + fragment)

    def test_project_deep_links_have_native_fallback_targets(self):
        html = self.client.get('/').get_data(as_text=True)
        for project in load_projects():
            self.assertIn(f'id="project={project["id"]}"', html)
            self.assertIn(project['title'], html)
        for section in ('experience', 'education', 'about', 'resume', 'contact', 'privacy'):
            self.assertIn(f'id="{section}"', html)

    def test_workshop_receives_profile_and_only_public_recaptcha_key(self):
        self.enable_contact()
        with patch('app.routes.render_template', return_value='rendered') as render:
            self.assertEqual(self.client.get('/').status_code, 200)
        context = render.call_args.kwargs
        self.assertEqual(context['profile'], load_profile())
        self.assertTrue(context['contact_enabled'])
        self.assertEqual(context['recaptcha_site_key'], 'public-test-key')
        self.assertNotIn('private-test-key', str(context))
        self.assertNotIn('test-password', str(context))

    def test_unconfigured_contact_fails_without_validation_or_sending(self):
        with patch.object(ContactForm, 'validate_on_submit', autospec=True) as validate, patch('app.routes.mail.send') as send:
            response = self.submit()
        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.json['ok'])
        validate.assert_not_called()
        send.assert_not_called()

    def test_missing_secret_does_not_prevent_the_workshop_opening(self):
        self.app.config['SECRET_KEY'] = None
        with patch('app.routes.render_template', return_value='rendered') as render:
            response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(render.call_args.kwargs['contact_enabled'])
        with patch('app.routes.mail.send') as send:
            response = self.submit()
        self.assertEqual(response.status_code, 503)
        send.assert_not_called()

    def test_missing_csrf_is_rejected_before_sending(self):
        self.enable_contact()
        with patch('app.routes.mail.send') as send:
            response = self.submit()
        self.assertEqual(response.status_code, 400)
        self.assertIn('csrf_token', response.json['errors'])
        send.assert_not_called()

    def test_missing_recaptcha_is_rejected_before_sending(self):
        self.enable_contact()
        self.app.config.update(TESTING=False, WTF_CSRF_ENABLED=False)
        with patch('app.routes.mail.send') as send:
            response = self.submit()
        self.assertEqual(response.status_code, 400)
        self.assertIn('recaptcha', response.json['errors'])
        send.assert_not_called()

    def test_invalid_fields_are_returned_without_sending(self):
        self.enable_contact()
        self.app.config['WTF_CSRF_ENABLED'] = False
        with patch('app.routes.mail.send') as send:
            response = self.client.post('/contact', data={}, headers={'Accept': 'application/json'})
        self.assertEqual(response.status_code, 400)
        self.assertTrue({'name', 'email', 'message'}.issubset(response.json['errors']))
        send.assert_not_called()

    def test_valid_submission_uses_configured_sender_and_visitor_reply_to(self):
        self.enable_contact()
        with patch.object(ContactForm, 'validate_on_submit', autospec=True, return_value=True), patch('app.routes.mail.send') as send:
            response = self.submit()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'ok': True, 'message': 'Your message has been sent. Thank you!', 'errors': {}})
        message = send.call_args.args[0]
        self.assertEqual(message.sender, 'sender@example.test')
        self.assertEqual(message.reply_to, 'visitor@example.com')
        self.assertEqual(message.recipients, ['recipient@example.test'])
        self.assertIn('Hello', message.body)

    def test_delivery_failure_is_reported_without_private_details(self):
        self.enable_contact()
        with patch.object(ContactForm, 'validate_on_submit', autospec=True, return_value=True), patch('app.routes.mail.send', side_effect=RuntimeError('private SMTP details')):
            response = self.submit()
        self.assertEqual(response.status_code, 503)
        self.assertFalse(response.json['ok'])
        self.assertNotIn('private SMTP details', response.get_data(as_text=True))

    def test_html_submission_returns_contact_panel_in_workshop(self):
        self.enable_contact()
        with patch.object(ContactForm, 'validate_on_submit', autospec=True, return_value=True), patch('app.routes.mail.send'), patch('app.routes.render_template', return_value='rendered') as render:
            response = self.client.post('/contact', data={'name': 'Visitor', 'email': 'visitor@example.com', 'message': 'Hello'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(render.call_args.args, ('home.html',))
        self.assertEqual(render.call_args.kwargs['initial_panel'], 'contact')
        self.assertTrue(render.call_args.kwargs['contact_result']['ok'])
        self.assertIsNone(render.call_args.kwargs['contact_form'].message.data)


if __name__ == '__main__':
    unittest.main()
