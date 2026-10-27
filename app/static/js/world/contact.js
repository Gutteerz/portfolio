/** The existing contact form stays inside the workshop; Google loads on request. */
export function createContact(config, announce) {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  let captchaPromise;
  let widget;
  let sending = false;

  function showErrors(errors = {}) {
    for (const field of ['name', 'email', 'message', 'recaptcha', 'csrf_token']) {
      const node = document.getElementById(`contact-error-${field}`);
      if (node) node.textContent = (errors[field] || []).join(' ');
      const input = form?.elements.namedItem(field);
      if (input && input.type !== 'hidden') input.setAttribute('aria-invalid', errors[field]?.length ? 'true' : 'false');
    }
  }

  async function prepare() {
    if (!form || !config.enabled || widget !== undefined) return;
    if (!captchaPromise) {
      captchaPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.onload = () => window.grecaptcha.ready(resolve);
        script.onerror = () => { script.remove(); captchaPromise = null; reject(new Error('Captcha unavailable')); };
        document.head.append(script);
      });
    }
    try {
      await captchaPromise;
      if (widget === undefined) widget = window.grecaptcha.render('contact-captcha', { sitekey: config.siteKey, size: matchMedia('(max-width: 380px)').matches ? 'compact' : 'normal' });
    } catch {
      status.textContent = 'The verification could not load. You can email me directly using the address above.';
    }
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    const submit = document.getElementById('send-message');
    submit.disabled = true;
    status.textContent = 'Sending your message…';
    showErrors();
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const result = await response.json();
      status.textContent = result.message;
      showErrors(result.errors);
      if (result.ok) form.reset();
      else form.querySelector('[aria-invalid="true"]')?.focus();
    } catch {
      status.textContent = 'The message could not be sent. Please try again, or use the email address above.';
    } finally {
      if (widget !== undefined) window.grecaptcha.reset(widget);
      sending = false;
      submit.disabled = false;
    }
  });

  document.getElementById('copy-email')?.addEventListener('click', async () => {
    const address = document.querySelector('#contact-dialog a[href^="mailto:"]')?.getAttribute('href').slice(7);
    if (!address) return;
    try { await navigator.clipboard.writeText(address); status.textContent = 'Email address copied.'; }
    catch { status.textContent = `Email: ${address}`; }
    announce(status.textContent);
  });
  if (config.result) { status.textContent = config.result.message; showErrors(config.result.errors); }
  return { prepare };
}
