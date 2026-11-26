(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const notice = message => {
    $('.preview-toast')?.remove();
    const element = document.createElement('div');
    element.className = 'preview-toast';
    element.setAttribute('role', 'status');
    element.textContent = message;
    document.body.append(element);
    setTimeout(() => element.remove(), 4500);
  };

  // Keep the exported mobile menu design, with keyboard and expanded state support.
  const menu = $('#mnav-t');
  const menuButton = $('.menu-btn');
  if (menu && menuButton) {
    const syncMenu = () => {
      menuButton.setAttribute('aria-expanded', String(menu.checked));
      menuButton.setAttribute('aria-label', menu.checked ? 'Close menu' : 'Open menu');
      document.body.style.overflow = menu.checked ? 'hidden' : '';
    };
    menu.addEventListener('change', syncMenu);
    menuButton.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); menu.checked = !menu.checked; syncMenu();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.checked) {
        menu.checked = false; syncMenu(); menuButton.focus();
      }
    });
    window.matchMedia('(min-width: 1021px)').addEventListener('change', event => {
      if (event.matches) { menu.checked = false; syncMenu(); }
    });
    syncMenu();
  }

  $$('nav a').forEach(link => {
    const current = location.pathname.split('/').pop() || 'index.html';
    if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'page');
  });
  $$('.fq').forEach(item => {
    const summary = $('summary', item);
    if (!summary) return;
    const sync = () => summary.setAttribute('aria-expanded', String(item.open));
    item.addEventListener('toggle', sync); sync();
  });

  const coursePages = {
    'Caregiving': 'ApplyCaregiving.html',
    'Japanese Language': 'ApplyJapanese.html',
    'English': 'ApplyEnglish.html',
    'Basic Computer Skills': 'ApplyComputerSkills.html'
  };
  const fieldLabel = input => {
    const container = input.closest('.fl');
    return container?.querySelector(':scope > label')?.textContent.trim() || input.closest('label')?.textContent.trim() || '';
  };
  let courseRequest = 0;
  function setupForm(form) {
    form.removeAttribute('onsubmit');
    const isApplication = !!$('fieldset', form);
    const note = document.createElement('p');
    note.className = 'preview-form-note';
    note.textContent = 'Design preview: try the form with sample details. Nothing is sent or saved.';
    form.prepend(note);
    $$('input, select, textarea', form).forEach((input, index) => {
      const label = fieldLabel(input);
      input.id = `field-${index}`;
      if (!input.name) input.name = slug(label) || `field-${index}`;
      if (input.matches('[type="radio"]')) {
        input.value = input.closest('label').textContent.trim();
        input.required = true;
        const group = input.closest('.fl');
        const groupLabel = group?.querySelector(':scope > label');
        if (groupLabel) {
          groupLabel.id = `label-${input.name}`;
          $('.rg', group)?.setAttribute('role', 'group');
          $('.rg', group)?.setAttribute('aria-labelledby', groupLabel.id);
        }
      } else {
        const visibleLabel = input.closest('.fl')?.querySelector(':scope > label');
        if (visibleLabel) visibleLabel.htmlFor = input.id;
        input.required = label.includes('*') || input.type === 'checkbox';
      }
      if (input.type === 'tel') {
        input.pattern = '(?:\\+?88)?01[3-9][0-9]{8}';
        input.title = 'Enter a Bangladesh mobile number, for example 01712345678.';
        input.autocomplete = 'tel';
        input.inputMode = 'tel';
      }
      if (input.type === 'date') {
        input.max = new Date().toLocaleDateString('en-CA');
        input.autocomplete = 'bday';
      }
      if (label.startsWith('Full name')) { input.autocomplete = 'name'; input.minLength = 2; }
      if (input.type === 'email') input.autocomplete = 'email';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      $('.form-result', form)?.remove();
      const result = document.createElement('div');
      result.className = 'form-result'; result.tabIndex = -1;
      result.setAttribute('role', 'status');
      const heading = document.createElement('h3');
      heading.textContent = isApplication ? 'Application preview complete' : 'Message preview complete';
      const text = document.createElement('p');
      text.textContent = 'The form passed validation. This is a design preview, so your details have not been sent or saved. You can keep editing to explore the form.';
      result.append(heading, text); form.append(result); result.focus();
    });
    const course = $$('select', form).find(input => fieldLabel(input).replace('*', '').trim() === 'Course');
    if (course) course.addEventListener('change', async () => {
      const target = coursePages[course.value];
      if (!target) return;
      const request = ++courseRequest;
      const previousValue = Object.keys(coursePages).find(key => coursePages[key] === location.pathname.split('/').pop()) || '';
      const snapshot = new Map();
      $$('fieldset:first-of-type input, fieldset:first-of-type select, textarea, input[type="checkbox"]', form).forEach(input => {
        snapshot.set(`${input.name}:${input.type === 'radio' ? input.value : ''}`, { value: input.value, checked: input.checked });
      });
      const submit = $('[type="submit"]', form);
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(target);
        if (!response.ok) throw new Error('Course could not be loaded');
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        if (request !== courseRequest) return;
        const nextForm = $('main form', doc);
        const nextAside = $('aside.sd', doc);
        if (!nextForm) throw new Error('Course form missing');
        if (nextAside && $('aside.sd')) $('aside.sd').replaceWith(nextAside);
        $('main h1').textContent = $('main h1', doc).textContent;
        const breadcrumb = $('nav[aria-label="Breadcrumb"]');
        if (breadcrumb) breadcrumb.innerHTML = $('nav[aria-label="Breadcrumb"]', doc).innerHTML;
        form.replaceWith(nextForm); setupForm(nextForm);
        $$('input, select, textarea', nextForm).forEach(input => {
          const saved = snapshot.get(`${input.name}:${input.type === 'radio' ? input.value : ''}`);
          if (saved) { input.value = saved.value; input.checked = saved.checked; }
        });
        document.title = doc.title;
        history.replaceState(null, '', target);
        $$('select', nextForm).find(input => fieldLabel(input).replace('*', '').trim() === 'Course')?.focus();
      } catch {
        course.value = previousValue;
        notice('Unable to load that course. Please try again.');
      } finally {
        if (form.isConnected && request === courseRequest) { submit.disabled = false; form.removeAttribute('aria-busy'); }
      }
    });
  }
  $$('main form').forEach(setupForm);

  const gallery = $('.gal');
  if (gallery) {
    const items = [...gallery.children];
    const filters = $$('button', gallery.parentElement).filter(button => ['All', 'Photos', 'Videos'].includes(button.textContent.trim()));
    const dialog = document.createElement('dialog');
    dialog.className = 'gallery-dialog';
    dialog.setAttribute('aria-labelledby', 'gallery-title');
    dialog.innerHTML = '<button class="dialog-close" type="button" aria-label="Close gallery">×</button><h2 id="gallery-title"></h2><div class="gallery-content"></div>';
    document.body.append(dialog);
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    items.forEach((item, index) => {
      const video = index === 2 || index === 5;
      item.dataset.media = video ? 'Videos' : 'Photos';
      const caption = item.textContent.trim() || 'Classroom at CSDI';
      item.tabIndex = 0; item.setAttribute('role', 'button'); item.setAttribute('aria-label', `Preview ${caption}`);
      const open = () => {
        $('#gallery-title', dialog).textContent = caption;
        const content = $('.gallery-content', dialog); content.replaceChildren();
        const image = $('img', item);
        if (image) content.append(image.cloneNode(true));
        else {
          const placeholder = document.createElement('div'); placeholder.className = 'gallery-placeholder';
          placeholder.textContent = `${video ? 'Video' : 'Photo'} to be supplied for ${caption.toLowerCase()}. This space follows the approved gallery layout.`;
          content.append(placeholder);
        }
        dialog.showModal();
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
    filters.forEach(button => {
      button.classList.add('gallery-filter');
      button.setAttribute('aria-pressed', String(button.textContent.trim() === 'All'));
      button.addEventListener('click', () => {
        filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        const filter = button.textContent.trim();
        items.forEach(item => { item.hidden = filter !== 'All' && item.dataset.media !== filter; });
      });
    });
  }
  $$('main a[href="#"]').filter(link => /load more/i.test(link.textContent)).forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      notice(gallery ? 'All supplied gallery items are shown. More media can be added after approval.' : 'All six supplied news updates are shown.');
    });
  });

  // Each news card opens its own preview instead of always showing the first story.
  $$('article').forEach(article => {
    const heading = $('h3', article);
    if (heading) $$('a[href="NewsArticle.html"]', article).forEach(link => { link.href = `NewsArticle.html?story=${slug(heading.textContent)}`; });
  });
  async function setupArticle() {
    if (!/\/NewsArticle(?:\.html)?$/.test(location.pathname)) return;
    const story = new URLSearchParams(location.search).get('story');
    if (!story || story === slug($('main h1').textContent)) return;
    try {
      const response = await fetch('News.html');
      if (!response.ok) throw new Error('News unavailable');
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const card = $$('article', doc).find(article => slug($('h3', article)?.textContent || '') === story);
      if (!card) { notice('This story is unavailable. Showing the featured news preview.'); return; }
      const heading = $('main h1');
      heading.textContent = $('h3', card).textContent;
      const category = $('span', heading.previousElementSibling);
      if (category) category.textContent = 'News';
      document.title = `${heading.textContent} | CSDI`;
      const cardBody = $('h3', card).parentElement;
      const date = $('div', cardBody).textContent.trim();
      const dateSpan = $('span', heading.nextElementSibling);
      if (dateSpan) { const icon = $('svg', dateSpan); dateSpan.replaceChildren(...(icon ? [icon] : []), document.createTextNode(date)); }
      const readingTime = $$('span', heading.nextElementSibling).at(-1);
      if (readingTime && readingTime !== dateSpan) readingTime.textContent = 'News preview';
      const imageWrap = heading.parentElement.nextElementSibling;
      const hero = $('img', imageWrap);
      const cardImage = $('img', card);
      if (hero) { hero.src = cardImage?.getAttribute('src') || 'images/news-placeholder.webp'; hero.alt = heading.textContent; }
      const body = imageWrap.nextElementSibling;
      const share = [...body.children].find(child => child.textContent.includes('Share this news'));
      const paragraph = document.createElement('p'); paragraph.textContent = $('p', card).textContent;
      const context = document.createElement('p'); context.className = 'preview-form-note';
      context.textContent = 'Article preview: this is the supplied news summary. The full article and final publishing date will be added after content approval.';
      body.replaceChildren(paragraph, context, ...(share ? [share] : []));
    } catch { notice('Unable to load the story preview. Please try again.'); }
  }
  setupArticle();
  $$('.shr').forEach(link => {
    const label = link.getAttribute('aria-label') || '';
    if (label.includes('Facebook')) { link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    else if (label.includes('WhatsApp')) { link.href = `https://wa.me/?text=${encodeURIComponent(location.href)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    else link.addEventListener('click', async event => {
      event.preventDefault();
      try { await navigator.clipboard.writeText(location.href); notice('News link copied.'); }
      catch { notice('Copy the page address from your browser to share this news.'); }
    });
  });
  $$('footer a[href="#"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      notice(`${link.getAttribute('aria-label') || 'Social'} profile link will be added after approval.`);
    });
  });
})();
