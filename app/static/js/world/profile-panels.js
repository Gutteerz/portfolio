export function element(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}

function keywords(values = []) {
  const list = element('ul', undefined, 'project-technologies');
  values.forEach(value => list.append(element('li', value)));
  return list;
}

export function experienceEntry(work) {
  const article = element('article', undefined, 'experience-entry');
  article.dataset.workId = work.id;
  article.append(element('h3', work.name), element('p', work.dateLabel, 'entry-date'));
  article.append(element('p', work.position, 'entry-role'), element('p', work.summary));
  if (work.highlights?.length) {
    const list = element('ul', undefined, 'project-highlights');
    work.highlights.forEach(text => list.append(element('li', text)));
    article.append(list);
  }
  article.append(keywords(work.keywords));
  return article;
}

export function educationEntry(education) {
  const article = element('article', undefined, 'experience-entry');
  article.append(element('h3', education.area));
  article.append(element('p', education.dateLabel, 'entry-date'));
  article.append(element('p', `${education.studyType} · ${education.institution}`, 'entry-role'));
  article.append(keywords(education.keywords));
  return article;
}

export function renderProfilePanels(profile, projects, showProject) {
  const experience = document.getElementById('experience-list');
  experience.replaceChildren(...profile.work.map(experienceEntry));
  document.getElementById('education-list').replaceChildren(...profile.education.map(educationEntry));
  const uiasub = document.getElementById('uiasub-content');
  uiasub.replaceChildren(element('p', 'UiASub is a student organization building a remotely operated vehicle. My involvement spans software development and team leadership.'));
  profile.work.filter(work => work.id.startsWith('uiasub')).forEach(work => uiasub.append(experienceEntry(work)));
  const project = projects.find(project => project.id === 'uiasub-rtos');
  if (project) {
    const button = element('button', 'Open the ROV software project', 'secondary-button');
    button.type = 'button';
    button.addEventListener('click', () => showProject(project));
    uiasub.append(button);
  }
}
