import { renderProfilePanels } from './profile-panels.js';
import { createContact } from './contact.js';

const $ = id => document.getElementById(id);
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

export function createUI(projects, profile, callbacks) {
  const dialogs = [...document.querySelectorAll('dialog')];
  let switching = false;
  let currentInteraction = '';
  let worldReady = false;
  const contactConfig = JSON.parse($('contact-config').textContent);
  const contact = createContact(contactConfig, text => { $('live-status').textContent = text; });
  const panels = new Set(['index', 'about', 'experience', 'education', 'uiasub', 'resume', 'contact', 'privacy', 'settings']);
  function setFragment(fragment) {
    const hash = fragment ? '#' + fragment : '';
    if (location.hash !== hash) history.pushState(null, '', location.pathname + location.search + hash);
  }
  function closeDialogs() {
    switching = true;
    dialogs.forEach(dialog => { if (dialog.open) dialog.close(); });
    switching = false;
  }
  function openDialog(id) {
    closeDialogs();
    callbacks.onPause();
    $(id).showModal();
    $(id).scrollTop = 0;
  }
  dialogs.forEach(dialog => {
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => {
      if (switching || dialogs.some(other => other.open)) return;
      if (!document.body.classList.contains('text-view')) history.replaceState(null, '', location.pathname + location.search);
      if (!document.body.classList.contains('text-view')) callbacks.onResume();
      (worldReady && !document.body.classList.contains('text-view') ? $('world-canvas') : $('fallback')).focus({ preventScroll: true });
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  function showProject(project) {
    const content = $('project-content');
    content.replaceChildren();
    const heading = node('h1', project.title);
    heading.id = 'project-title';
    content.append(heading, node('p', project.summary, 'project-summary'));
    const technologies = node('ul', undefined, 'project-technologies');
    project.technologies.forEach(technology => technologies.append(node('li', technology)));
    content.append(technologies);
    if (project.image) {
      const img = node('img', undefined, 'project-image');
      img.src = '/static/' + project.image;
      img.alt = project.title + ' project image';
      img.addEventListener('error', () => img.remove(), { once: true });
      content.append(img);
    }
    content.append(node('p', project.description));
    if (project.highlights.length) {
      content.append(node('h2', 'Inside the project'));
      const list = node('ul', undefined, 'project-highlights');
      project.highlights.forEach(highlight => list.append(node('li', highlight)));
      content.append(list);
    }
    const links = node('div', undefined, 'project-links');
    const copy = node('button', 'Copy project link', 'quiet');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      const url = new URL('/#project=' + encodeURIComponent(project.id), location.href).href;
      try { await navigator.clipboard.writeText(url); copy.textContent = 'Link copied'; }
      catch { copy.textContent = url; }
    });
    links.append(copy);
    project.links.forEach(link => {
      const anchor = node('a', link.label);
      anchor.href = link.url;
      if (link.url.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
      links.append(anchor);
    });
    content.append(links);
    openDialog('project-dialog');
    setFragment('project=' + encodeURIComponent(project.id));
  }

  function showIndex(selection = projects) {
    const list = $('index-list');
    list.replaceChildren();
    selection.forEach(project => {
      const button = node('button', undefined, 'index-item');
      button.type = 'button';
      const label = node('span');
      label.append(node('span', project.title, 'index-item-title'));
      label.append(node('span', project.technologies.join(' · '), 'index-item-meta'));
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 12h14m-6-6 6 6-6 6'); svg.append(path);
      button.append(label, svg);
      button.addEventListener('click', () => showProject(project));
      list.append(button);
    });
    $('project-count').textContent = `${selection.length} projects`;
    openDialog('index-dialog');
    setFragment('index');
  }

  renderProfilePanels(profile, projects, showProject);
  function showPanel(name) {
    if (name === 'index') { showIndex(); return; }
    if (!panels.has(name)) return;
    openDialog(name + '-dialog');
    setFragment(name);
    if (name === 'contact') contact.prepare();
  }
  function textView(enabled) {
    closeDialogs();
    document.body.classList.toggle('text-view', enabled);
    $('return-world').hidden = !enabled || !worldReady;
    if (enabled) { callbacks.onPause(); $('live-status').textContent = ''; $('fallback').focus({ preventScroll: true }); }
    else { callbacks.onResume(); $('world-canvas').focus({ preventScroll: true }); }
    setFragment(enabled ? 'text' : '');
  }
  function readFragment() {
    const hash = location.hash.slice(1);
    if (hash !== 'text' && document.body.classList.contains('text-view')) {
      document.body.classList.remove('text-view');
      $('return-world').hidden = true;
      callbacks.onResume();
    }
    if (hash.startsWith('project=')) {
      const id = new URLSearchParams(hash).get('project');
      const project = projects.find(project => project.id === id);
      if (project) { showProject(project); return; }
    }
    if (hash === 'text') { textView(true); return; }
    if (panels.has(hash)) { showPanel(hash); return; }
    closeDialogs();
  }
  document.addEventListener('click', event => {
    const readingLink = event.target.closest('.fallback-nav a');
    if (readingLink && document.body.classList.contains('text-view')) {
      event.preventDefault();
      document.getElementById(readingLink.hash.slice(1))?.scrollIntoView();
      return;
    }
    const target = event.target.closest('[data-panel], [data-project]');
    if (!target) return;
    const project = target.dataset.project && projects.find(project => project.id === target.dataset.project);
    if (project) { event.preventDefault(); showProject(project); }
    else if (panels.has(target.dataset.panel)) { event.preventDefault(); showPanel(target.dataset.panel); }
  });
  addEventListener('popstate', readFragment);
  addEventListener('hashchange', readFragment);

  $('back-to-index').addEventListener('click', () => showIndex());
  $('settings-button').addEventListener('click', () => showPanel('settings'));
  $('text-view-button').addEventListener('click', () => textView(true));
  $('return-world').addEventListener('click', () => textView(false));
  $('print-resume').addEventListener('click', () => window.print());
  $('reset-view').addEventListener('click', callbacks.onResetCamera);
  $('return-start').addEventListener('click', () => { callbacks.onResetPosition(); $('settings-dialog').close(); });
  $('interact-button').addEventListener('click', callbacks.onInteract);
  $('reduced-motion').addEventListener('change', event => callbacks.onReducedMotion(event.target.checked));
  $('quality').addEventListener('change', event => callbacks.onQuality(event.target.value));
  for (const id of ['index-button', 'about-button', 'contact-button', 'settings-button']) $(id).hidden = false;
  document.body.classList.add('interface-ready');
  // Deep links and contact results must work even if WebGL cannot initialize.
  queueMicrotask(() => {
    if (contactConfig.initialPanel) showPanel(contactConfig.initialPanel);
    else readFragment();
  });

  return {
    showProject, showIndex, showPanel,
    get paused() { return dialogs.some(dialog => dialog.open) || document.body.classList.contains('text-view'); },
    setInteraction(label) {
      if (currentInteraction === label) return;
      currentInteraction = label;
      $('interaction').hidden = !label;
      $('interaction-label').textContent = label || '';
      $('live-status').textContent = label ? `${label}. Press E to interact.` : '';
    },
    announce(text) { $('live-status').textContent = text; },
    setLocation(text) { $('location-label').textContent = text; },
    setSettings(settings) {
      $('reduced-motion').checked = settings.reducedMotion;
      $('quality').value = settings.quality;
    },
    ready() {
      worldReady = true;
      document.body.classList.add('world-ready');
      $('world-ui').hidden = false;
      if (contactConfig.initialPanel) showPanel(contactConfig.initialPanel);
      else readFragment();
    },
  };
}
