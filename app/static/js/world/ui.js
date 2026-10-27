const $ = id => document.getElementById(id);
const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};

export function createUI(projects, callbacks) {
  const dialogs = [...document.querySelectorAll('dialog')];
  let switching = false;
  let currentInteraction = '';
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
      if (location.hash.startsWith('#project=')) history.replaceState(null, '', location.pathname + location.search);
      callbacks.onResume();
      $('world-canvas').focus({ preventScroll: true });
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
    const page = node('a', 'Open project page');
    page.href = project.detailUrl;
    links.append(page);
    project.links.forEach(link => {
      const anchor = node('a', link.label);
      anchor.href = link.url;
      if (link.url.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener'; }
      links.append(anchor);
    });
    content.append(links);
    openDialog('project-dialog');
    history.replaceState(null, '', '#project=' + encodeURIComponent(project.id));
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
  }

  $('index-button').addEventListener('click', () => showIndex());
  $('back-to-index').addEventListener('click', () => showIndex());
  $('about-button').addEventListener('click', () => openDialog('about-dialog'));
  $('settings-button').addEventListener('click', () => openDialog('settings-dialog'));
  $('reset-view').addEventListener('click', callbacks.onResetCamera);
  $('return-start').addEventListener('click', () => { callbacks.onResetPosition(); $('settings-dialog').close(); });
  $('interact-button').addEventListener('click', callbacks.onInteract);
  $('reduced-motion').addEventListener('change', event => callbacks.onReducedMotion(event.target.checked));
  $('quality').addEventListener('change', event => callbacks.onQuality(event.target.value));
  for (const id of ['index-button', 'about-button', 'settings-button']) $(id).hidden = false;

  return {
    showProject, showIndex,
    get paused() { return dialogs.some(dialog => dialog.open); },
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
      document.body.classList.add('world-ready');
      $('world-ui').hidden = false;
      const projectId = new URLSearchParams(location.hash.slice(1)).get('project');
      const project = projects.find(project => project.id === projectId);
      if (project) showProject(project);
    },
  };
}
