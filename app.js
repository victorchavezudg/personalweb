/* ===========================================================================
   app.js — rendering + interactions
   =========================================================================== */
(function(){
  const D = window.DATA;
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  /* ---------- i18n helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // tt(value) → HTML. value may be a string or {es,en}
  function tt(v){
    if (v == null) return '';
    if (typeof v === 'string') return esc(v);
    return `<span class="i18n"><span data-l="es">${esc(v.es)}</span><span data-l="en">${esc(v.en)}</span></span>`;
  }
  // plain(value) → string in current language (for attrs / titles)
  let LANG = localStorage.getItem('vmcp-lang') || 'es';
  function plain(v){ if (v==null) return ''; return typeof v==='string' ? v : (v[LANG]||v.es); }

  /* ---------- icons ---------- */
  const I = {
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    ext:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    inst:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5"/></svg>',
    dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/></svg>',
    orcid:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0M7.4 18H5.6V8.2h1.8zM6.5 6.9a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1m12 11.1h-1.8v-4.8c0-1.1-.4-2.5-2.1-2.5-1.7 0-2 1.3-2 2.4V18h-1.8V8.2h1.7v1.1h.1c.4-.7 1.3-1.4 2.7-1.4 2.6 0 3.1 1.7 3.1 4z" opacity=".001"/><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0M8.07 16.9H6.5V7.6h1.57zM7.28 6.4a.92.92 0 1 1 0-1.84.92.92 0 0 1 0 1.84m10.6 10.5h-1.56v-4.5c0-1.08-.02-2.46-1.5-2.46-1.5 0-1.73 1.17-1.73 2.38v4.58h-1.56V7.6h1.5v1.27h.02c.21-.4.72-1.06 1.97-1.06 1.97 0 1.86 1.85 1.86 3.1z"/></svg>',
    scholar:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8z"/></svg>',
    rg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 0H4.4A4.4 4.4 0 0 0 0 4.4v15.2A4.4 4.4 0 0 0 4.4 24h15.2a4.4 4.4 0 0 0 4.4-4.4V4.4A4.4 4.4 0 0 0 19.6 0M9.8 13.1c-.5.5-1.2.8-2 .8-.9 0-1.6-.3-2.1-.9-.5-.6-.8-1.4-.8-2.5V9.3c0-1.1.3-2 .8-2.6.5-.6 1.2-.9 2.1-.9.8 0 1.5.2 1.9.7.5.4.7 1 .8 1.8H9.2c0-.4-.1-.7-.3-.9-.2-.2-.5-.3-.9-.3-.4 0-.8.2-1 .5-.2.3-.3.8-.3 1.5v1.3c0 .7.1 1.2.4 1.5.2.3.6.5 1.1.5.3 0 .6-.1.8-.2v-1.3H7.9V9.9h2.6v2.4zm6.5.7-1.7-3h-.8v3h-1.5V5.9h2.5c.8 0 1.4.2 1.9.6.4.4.7 1 .7 1.7 0 1-.4 1.7-1.2 2.1l1.9 3.2v.1z"/></svg>',
    li:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 0H3.6A3.6 3.6 0 0 0 0 3.6v16.8A3.6 3.6 0 0 0 3.6 24h16.8a3.6 3.6 0 0 0 3.6-3.6V3.6A3.6 3.6 0 0 0 20.4 0M7.2 20.4H3.6V9h3.6zM5.4 7.5A2.1 2.1 0 1 1 5.4 3a2.1 2.1 0 0 1 0 4.5m15 12.9h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5z"/></svg>',
    print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>'
  };

  /* ---------- section scaffold ---------- */
  function sectionHead(id){
    return `<div class="s-head reveal">
      <span class="kicker">${tt(D.ui.section_kicker[id])}</span>
      <h2 class="s-title">${tt(D.ui.section_title[id])}</h2>
    </div>`;
  }

  /* ====================== HERO ====================== */
  function renderHero(){
    const m = D.meta;
    const social = [
      ['orcid', 'ORCID', m.links.orcid, I.orcid],
      ['scholar', 'Scholar', m.links.scholar, I.scholar],
      ['rg', 'ResearchGate', m.links.researchgate, I.rg],
      ['li', 'LinkedIn', m.links.linkedin, I.li]
    ].map(([k,lab,href,ic]) => `<a class="social" href="${href}" target="_blank" rel="noopener">${ic}<span>${lab}</span></a>`).join('');

    const names = m.name.split(' ');
    const l1 = names.slice(0,2).join(' ');
    const l2 = names.slice(2).join(' ');

    return `<header class="hero" id="top">
      <canvas id="particles"></canvas>
      <div class="wrap">
        <div class="hero-grid">
          <div class="hero-intro">
            <span class="hero-badge reveal"><span class="dot"></span>${tt(m.sni)}</span>
            <div class="name-row reveal" data-d="1">
              <div class="portrait-wrap">
                <div class="portrait">
                  <img src="assets/victor.png" alt="${esc(D.meta.name)}" loading="eager">
                  <div class="ring"></div>
                </div>
              </div>
              <h1><span class="l1">${esc(l1)}</span><br><span class="l2">${esc(l2)}</span></h1>
            </div>
            <p class="role reveal" data-d="2">${tt(m.role)}</p>
            <p class="inst reveal" data-d="2">${tt(m.institution)}</p>
            <p class="tagline reveal" data-d="3">${tt(m.tagline)}</p>
            <div class="hero-cta reveal" data-d="3">
              <a class="btn btn-primary" href="#publications">${tt(D.ui.hero_cta_primary)} ${I.arrow}</a>
              ${m.cv ? `<div class="cv-dd" id="cvDD">
                <button class="btn btn-ghost btn-cv" id="cvBtn" type="button" aria-haspopup="true" aria-expanded="false">${I.dl} ${tt(D.ui.labels.download_cv || {es:'Descargar CV (PDF)',en:'Download CV (PDF)'})} <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>
                <div class="cv-menu" id="cvMenu" role="menu">
                  <a id="cvFull" href="#" download role="menuitem">${I.dl} ${tt(D.ui.labels.cv_full || {es:'CV completo',en:'Full CV'})}</a>
                  <a id="cvShort" href="#" download role="menuitem">${I.dl} ${tt(D.ui.labels.cv_short || {es:'CV sintético (1 página)',en:'One-page CV'})}</a>
                </div>
              </div>` : ''}
              <a class="btn btn-ghost" href="#contact">${tt(D.ui.hero_cta_secondary)}</a>
            </div>
            <div class="hero-social reveal" data-d="4">${social}</div>
          </div>
        </div>
      </div>
      <div class="scroll-hint"><span>scroll</span><span class="bar"></span></div>
    </header>`;
  }

  /* ====================== ABOUT ====================== */
  function renderAbout(){
    const a = D.about;
    const bio = `<div class="about-bio">
      <span class="i18n"><span data-l="es">${a.bio.es.map(p=>`<p>${esc(p)}</p>`).join('')}</span><span data-l="en">${a.bio.en.map(p=>`<p>${esc(p)}</p>`).join('')}</span></span>
    </div>`;
    const interests = a.interests.map(i=>`<span class="chip">${tt(i)}</span>`).join('');
    const tools = a.toolbox.map(t=>`<span class="chip mono">${esc(t)}</span>`).join('');
    const dist = a.distinctions.map(d=>`<div class="dist">
        <span class="yr">${esc(d.years)}</span>
        <div><div class="d-name">${tt({es:d.es,en:d.en})}</div><div class="d-org">${esc(d.org)} · ${tt(d.place)}</div></div>
      </div>`).join('');
    const certs = (a.certifications || []).map(d=>`<div class="dist">
        <span class="yr">${esc(d.years)}</span>
        <div><div class="d-name">${tt({es:d.es,en:d.en})}</div><div class="d-org">${esc(d.org)} · ${tt(d.place)}</div></div>
      </div>`).join('');

    return `<section class="section" id="about">
      <div class="wrap">
        ${sectionHead('about')}
        <div class="about-grid">
          <div class="reveal">${bio}
            <div class="panel" style="margin-top:6px">
              <h4>${tt(D.ui.labels.interests)}</h4>
              <div class="chips">${interests}</div>
            </div>
          </div>
          <div class="about-side reveal" data-d="1">
            <div class="panel"><h4>${tt(D.ui.labels.toolbox)}</h4><div class="chips">${tools}</div></div>
            <div class="panel"><h4>${tt(D.ui.labels.distinctions)}</h4><div class="dist-list">${dist}</div></div>
            ${certs ? `<div class="panel"><h4>${tt(D.ui.labels.certifications || {es:'Certificaciones',en:'Certifications'})}</h4><div class="dist-list">${certs}</div></div>` : ''}
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ====================== EDUCATION ====================== */
  function renderEducation(){
    const items = D.education.map((e,i)=>`<div class="tl-item reveal" data-d="${Math.min(i,4)}">
        <span class="node"></span>
        <span class="tl-yr">${esc(e.years)}</span>
        <h3 class="tl-title">${tt(e.degree)}</h3>
        <div class="tl-org">${esc(e.org)} <span class="place">· ${tt(e.place)}</span></div>
        <p class="tl-detail">${tt(e.detail)}</p>
      </div>`).join('');
    return `<section class="section" id="education">
      <div class="wrap">${sectionHead('education')}<div class="timeline">${items}</div></div>
    </section>`;
  }

  /* ====================== EXPERIENCE ====================== */
  function renderExperience(){
    const yrs = e => `<span class="i18n"><span data-l="es">${esc(e.years)}</span><span data-l="en">${esc(e.yearsEn||e.years)}</span></span>`;
    const items = D.experience.map((e,i)=>`<div class="tl-item reveal" data-d="${Math.min(i%5,4)}">
        <span class="node"></span>
        <span class="tl-yr">${yrs(e)}</span>
        <h3 class="tl-title">${tt(e.role)}</h3>
        <div class="tl-org">${esc(e.org)} <span class="place">· ${tt(e.place)}</span></div>
        <p class="tl-detail">${tt(e.detail)}</p>
      </div>`).join('');
    return `<section class="section" id="experience">
      <div class="wrap">${sectionHead('experience')}<div class="timeline">${items}</div></div>
    </section>`;
  }

  /* ====================== PUBLICATIONS ====================== */
  function renderPublications(){
    const counts = { all:D.publications.length,
      published:D.publications.filter(p=>p.state==='published').length,
      indev:D.publications.filter(p=>p.state==='indev').length };
    const filters = ['all','published','indev'].map((f,i)=>`<button class="filter${i===0?' on':''}" data-f="${f}">${tt(D.ui.pub_filter[f])} <span class="ct">${counts[f]}</span></button>`).join('');

    const pubs = D.publications.map(p=>{
      const ref = p.doi ? `<a class="doi-link" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI ${esc(p.doi)} ${I.ext}</a>`
                : p.isbn ? `<span class="doi-link">ISBN ${esc(p.isbn)}</span>` : '';
      const stateLabel = p.state==='published' ? D.ui.pub_filter.published : D.ui.pub_filter.indev;
      return `<article class="pub" data-state="${p.state}">
        <div><div class="pub-year">${esc(p.year)}</div><div class="pub-type">${tt(p.type)}</div></div>
        <div>
          <h3 class="pub-title">${esc(p.title)}</h3>
          <div class="pub-meta">${esc(p.authors)} · <span class="pub-venue">${tt(p.venue)}</span></div>
        </div>
        <div class="pub-right">
          <span class="pub-state ${p.state}">${tt(stateLabel)}</span>
          ${ref}
        </div>
      </article>`;
    }).join('');

    return `<section class="section" id="publications">
      <div class="wrap">
        ${sectionHead('publications')}
        <div class="filters reveal">${filters}</div>
        <div class="pub-list reveal" data-d="1">${pubs}</div>
      </div>
    </section>`;
  }

  /* ====================== PROJECTS ====================== */
  function renderProjects(){
    const outIcon = { article:'📄', book:'📚', conference:'🎤', thesis:'🎓', indev:'⏳' };

    const cards = D.projects.map((p,i)=>{
      const collabs = p.collaborators.map(c=>
        `<div class="collab"><b>${esc(c.name)}</b> <span class="inst">· ${esc(c.inst)} · ${tt(c.role)}</span></div>`
      ).join('');
      const stateTag = p.active
        ? `<span class="tag">${plain({es:'Activo',en:'Active'})}</span>`
        : `<span class="tag muted">${plain({es:'Concluido',en:'Completed'})}</span>`;

      // outputs block
      let outputsBlock = '';
      if(p.outputs && p.outputs.length){
        const badges = p.outputs.map(o => {
          const icon = outIcon[o.type] || '📎';
          const label = o.venue || o.title;
          const short = label.length > 42 ? label.slice(0,40)+'…' : label;
          const inner = `${icon} <span>${esc(short)}</span>`;
          return o.doi
            ? `<a class="out-badge ${o.type}" href="https://doi.org/${o.doi}" target="_blank" rel="noopener" title="${esc(o.title)}">${inner}</a>`
            : `<span class="out-badge ${o.type}" title="${esc(o.title)}">${inner}</span>`;
        }).join('');
        outputsBlock = `<div class="c-block"><span class="lab">${tt(D.ui.labels.outputs)}</span><div class="outputs">${badges}</div></div>`;
      }

      return `<article class="card reveal" data-d="${Math.min(i%3,4)}">
        <div class="c-top">${stateTag}<span class="c-years">${esc(p.years)}</span></div>
        <h3>${tt(p.name)}</h3>
        <div class="c-org">${esc(p.org)}</div>
        <p class="c-desc">${tt(p.desc)}</p>
        <div class="c-block"><span class="lab">${tt(D.ui.labels.collaborators)}</span>${collabs}</div>
        <div class="c-block"><span class="lab">${tt(D.ui.labels.funding)}</span><span class="fund"><span class="ico"></span>${tt(p.funding)}</span></div>
        ${outputsBlock}
      </article>`;
    }).join('');
    return `<section class="section" id="projects">
      <div class="wrap">${sectionHead('projects')}<div class="grid cols-3">${cards}</div></div>
    </section>`;
  }

  /* ====================== TECH ====================== */
  function renderTech(){
    const cards = D.tech.map((t,i)=>{
      const stack = t.stack.map(s=>`<span>${esc(s)}</span>`).join('');
      const link = t.placeholder
        ? `<span class="c-link disabled">${tt(D.ui.labels.soon)} ${I.arrow}</span>`
        : (t.link ? `<a class="c-link" href="${t.link}" target="_blank" rel="noopener">${tt(D.ui.labels.demo)} ${I.ext}</a>`
                  : `<span class="c-link disabled">${plain({es:'Uso interno',en:'Internal use'})}</span>`);
      return `<article class="card tech-card reveal" data-d="${Math.min(i%3,4)}">
        <div class="c-top"><span class="tag${t.placeholder?' muted':''}">${plain({es:'Software',en:'Software'})}</span></div>
        <h3>${tt(t.name)}</h3>
        <p class="c-desc">${tt(t.desc)}</p>
        <div class="stack">${stack}</div>
        ${link}
      </article>`;
    }).join('');
    return `<section class="section" id="tech">
      <div class="wrap">${sectionHead('tech')}<div class="grid cols-2">${cards}</div></div>
    </section>`;
  }

  /* ====================== OUTREACH ====================== */
  function renderOutreach(){
    const cards = D.outreach.map((o,i)=>`<article class="card outreach-card reveal" data-d="${Math.min(i%3,4)}">
        <div class="c-top"><span class="tag">${tt(o.tag)}</span><span class="c-years">${esc(o.when)}</span></div>
        <h3>${tt(o.title)}</h3>
        <p class="c-desc">${tt(o.desc)}</p>
      </article>`).join('');
    return `<section class="section" id="outreach">
      <div class="wrap">${sectionHead('outreach')}<div class="grid cols-3">${cards}</div></div>
    </section>`;
  }

  /* ====================== TEACHING ====================== */
  function renderTeaching(){
    // migración: estructura vieja (flat) → nueva agrupada
    if(D.teaching.length && D.teaching[0].courses === undefined){
      const map = {};
      D.teaching.forEach(c => {
        if(!map[c.org]) map[c.org] = { org:c.org, place:{es:'México',en:'Mexico'}, courses:[] };
        map[c.org].courses.push({ course:c.course, career:{es:'—',en:'—'} });
      });
      D.teaching = Object.values(map);
    }

    const blocks = D.teaching.map((inst, i) => {
      // agrupar materias por carrera para mostrarlas juntas
      const byCareer = {};
      inst.courses.forEach(c => {
        const key = plain(c.career);
        if(!byCareer[key]) byCareer[key] = { label: c.career, items: [] };
        byCareer[key].items.push(c.course);
      });

      const groups = Object.values(byCareer).map(g => {
        const chips = g.items.map(q => `<span class="tc-chip">${tt(q)}</span>`).join('');
        return `<div class="tc-group">
          <span class="tc-career-label">${tt(g.label)}</span>
          <div class="tc-chips">${chips}</div>
        </div>`;
      }).join('');

      return `<article class="teach-inst reveal" data-d="${Math.min(i % 3, 4)}">
        <div class="ti-head">
          <div class="ti-info">
            <h3 class="ti-name">${esc(inst.org)}</h3>
            <div class="ti-place">${tt(inst.place)}</div>
          </div>
        </div>
        <div class="tc-groups">${groups}</div>
      </article>`;
    }).join('');

    return `<section class="section" id="teaching">
      <div class="wrap">${sectionHead('teaching')}<div class="teach-list">${blocks}</div></div>
    </section>`;
  }

  /* ====================== RESOURCES ====================== */
  function renderResources(){
    const cats = D.resources.map((c,i)=>{
      const items = c.items.map(it=>`<div class="res-item">
          <span class="res-kind">${esc(it.kind)}</span>
          <span class="res-name">${tt(it.name)}</span>
          <a class="res-dl" href="#" onclick="return false">${tt(D.ui.labels.soon)} ${I.dl}</a>
        </div>`).join('');
      return `<div class="res-cat reveal" data-d="${Math.min(i%2,4)}">
        <h4><span class="sq"></span>${tt(c.cat)}</h4>${items}</div>`;
    }).join('');
    return `<section class="section" id="resources">
      <div class="wrap">
        ${sectionHead('resources')}
        <p class="s-sub reveal" style="margin:-30px 0 30px">${tt(D.ui.labels.placeholder_note)}</p>
        <div class="res-cats">${cats}</div>
      </div>
    </section>`;
  }

  /* ====================== NEWS ====================== */
  function renderNews(){
    const fmt = d => { const [y,m,da]=d.split('-'); const mo={es:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
      return `<span class="i18n"><span data-l="es">${da} ${mo.es[+m-1]} ${y}</span><span data-l="en">${mo.en[+m-1]} ${da}, ${y}</span></span>`; };
    const cards = D.news.map((n,i)=>`<article class="card news-card reveal" data-d="${Math.min(i%3,4)}">
        <div class="n-date">${fmt(n.date)} <span class="tag">${tt(n.tag)}</span></div>
        <h3>${tt(n.title)}</h3>
        <p class="c-desc">${tt(n.desc)}</p>
        <a class="c-link" href="#" onclick="return false">${tt(D.ui.labels.readmore)} ${I.arrow}</a>
      </article>`).join('');
    return `<section class="section" id="news">
      <div class="wrap">${sectionHead('news')}<div class="grid cols-2">${cards}</div></div>
    </section>`;
  }

  /* ====================== CONTACT ====================== */
  function renderContact(){
    const m = D.meta;
    const rows = `
      <a class="ci-row" href="mailto:${m.email}">
        <span class="ci-ico">${I.mail}</span>
        <span><span class="ci-lab">${tt(D.ui.contact.mail)}</span><br><span class="ci-val">${esc(m.email)}</span></span>
        <button class="copy-btn" data-copy="${m.email}" type="button">${tt(D.ui.contact.copy)}</button>
      </a>
      <div class="ci-row">
        <span class="ci-ico">${I.inst}</span>
        <span><span class="ci-lab">${plain({es:'Institución',en:'Institution'})}</span><br><span class="ci-val">${plain({es:'Centro Universitario de Tlaquepaque · UdeG',en:'Tlaquepaque University Center · UdeG'})}</span></span>
      </div>
      <div class="ci-row">
        <span class="ci-ico">${I.pin}</span>
        <span><span class="ci-lab">${plain({es:'Ubicación',en:'Location'})}</span><br><span class="ci-val">${tt(m.location)}</span></span>
      </div>
      <div class="hero-social" style="margin-top:6px">
        <a class="social" href="${m.links.orcid}" target="_blank" rel="noopener">${I.orcid}<span>ORCID</span></a>
        <a class="social" href="${m.links.scholar}" target="_blank" rel="noopener">${I.scholar}<span>Scholar</span></a>
        <a class="social" href="${m.links.researchgate}" target="_blank" rel="noopener">${I.rg}<span>ResearchGate</span></a>
        <a class="social" href="${m.links.linkedin}" target="_blank" rel="noopener">${I.li}<span>LinkedIn</span></a>
      </div>`;

    return `<section class="section" id="contact">
      <div class="wrap">
        ${sectionHead('contact')}
        <div class="contact-grid">
          <div class="reveal">
            <p class="s-sub" style="margin-bottom:24px">${tt(D.ui.contact.blurb)}</p>
            <div class="contact-info">${rows}</div>
          </div>
          <form class="form reveal" data-d="1" id="contactForm">
            <div class="fld"><label>${tt(D.ui.contact.name)}</label><input type="text" name="name" required></div>
            <div class="fld"><label>${tt(D.ui.contact.mail)}</label><input type="email" name="email" required></div>
            <div class="fld"><label>${tt(D.ui.contact.msg)}</label><textarea name="msg" rows="5" required></textarea></div>
            <button class="btn btn-primary" type="submit">${tt(D.ui.contact.send)} ${I.arrow}</button>
          </form>
        </div>
      </div>
    </section>`;
  }

  /* ====================== FOOTER ====================== */
  function renderFooter(){
    const m = D.meta;
    return `<footer class="footer">
      <div class="wrap">
        <div><div class="f-name">${esc(m.name)}</div><div class="f-note">${tt(D.ui.footer)}</div></div>
        <div class="f-social">
          <a href="${m.links.orcid}" target="_blank" rel="noopener" aria-label="ORCID">${I.orcid}</a>
          <a href="${m.links.scholar}" target="_blank" rel="noopener" aria-label="Scholar">${I.scholar}</a>
          <a href="${m.links.researchgate}" target="_blank" rel="noopener" aria-label="ResearchGate">${I.rg}</a>
          <a href="${m.links.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn">${I.li}</a>
          <a href="mailto:${m.email}" aria-label="Email">${I.mail}</a>
        </div>
      </div>
    </footer>`;
  }

  /* ====================== NAV ====================== */
  const HIDDEN = new Set(D.hidden_sections || []);
  const NAV_IDS = ['about','education','experience','publications','projects','tech','outreach','teaching','resources','news','contact']
    .filter(id => !HIDDEN.has(id));
  function renderNav(){
    const links = NAV_IDS.map(id=>`<a href="#${id}" data-id="${id}">${tt(D.ui.nav[id])}</a>`).join('');
    return `<nav class="nav" id="nav">
      <div class="wrap">
        <a class="brand" href="#top"><span class="mark"><span>VC</span></span><span>Chávez&nbsp;Pérez</span></a>
        <div class="nav-links" id="navLinks">${links}</div>
        <div class="nav-tools">
          <div class="lang" id="lang">
            <button data-lang="es">ES</button><button data-lang="en">EN</button>
          </div>
          <button class="theme-btn" id="themeBtn" aria-label="Cambiar tema" title="Tema claro / oscuro"><span class="ic-sun">${I.sun}</span><span class="ic-moon">${I.moon}</span></button>
          <button class="menu-btn" id="menuBtn" aria-label="Menu"><span></span></button>
        </div>
      </div>
    </nav>`;
  }

  /* ====================== MOUNT ====================== */
  function mount(){
    document.documentElement.setAttribute('data-lang', LANG);
    document.documentElement.lang = LANG;

    const SECTIONS = {
      about:renderAbout, education:renderEducation, experience:renderExperience,
      publications:renderPublications, projects:renderProjects, tech:renderTech,
      outreach:renderOutreach, teaching:renderTeaching, resources:renderResources,
      news:renderNews, contact:renderContact
    };
    $('#app').innerHTML =
      renderNav() +
      renderHero() +
      `<main>` +
      NAV_IDS.map(id => SECTIONS[id]()).join('') +
      `</main>` +
      renderFooter() +
      `<button class="totop" id="totop" aria-label="Top">${I.up}</button>`;

    initLang(); initCvMenu(); initTheme(); initNav(); initReveal(); initParticles(); initFilters(); initContact(); initTopBtn(); initAvatar();
  }

  /* ---------- avatar: match the name's two-line height ---------- */
  function initAvatar(){
    const h1 = $('.name-row h1'), wrap = $('.name-row .portrait-wrap');
    if(!h1 || !wrap) return;
    const size = () => { const hgt = Math.round(h1.getBoundingClientRect().height);
      if(hgt>0){ wrap.style.width = hgt+'px'; wrap.style.height = hgt+'px'; } };
    size();
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    window.addEventListener('resize', size, {passive:true});
    setTimeout(size, 350);
  }

  /* ---------- language ---------- */
  function initLang(){
    const setLang = l => {
      LANG = l; localStorage.setItem('vmcp-lang', l);
      document.documentElement.setAttribute('data-lang', l);
      document.documentElement.lang = l;
      $$('#lang button').forEach(b=>b.classList.toggle('on', b.dataset.lang===l));
      const cv = D.meta.cv, cvs = D.meta.cv_short;
      const full = $('#cvFull'), short = $('#cvShort');
      if(full && cv)  full.href  = typeof cv==='string'  ? cv  : (cv[l]  || cv.es);
      if(short && cvs) short.href = typeof cvs==='string' ? cvs : (cvs[l] || cvs.es);
    };
    $$('#lang button').forEach(b=> b.addEventListener('click', ()=>setLang(b.dataset.lang)));
    setLang(LANG);
  }

  /* ---------- CV dropdown ---------- */
  function initCvMenu(){
    const dd = $('#cvDD'); if(!dd) return;
    const btn = $('#cvBtn');
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', ()=>{ dd.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
  }

  /* ---------- theme (dark / light) ---------- */
  function initTheme(){
    const btn = $('#themeBtn'); if(!btn) return;
    const apply = t => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('vmcp-theme', t);
      if(window.__refreshParticles) window.__refreshParticles();
    };
    btn.addEventListener('click', ()=>{
      const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      apply(cur === 'light' ? 'dark' : 'light');
    });
    apply(localStorage.getItem('vmcp-theme') || 'dark');
  }

  /* ---------- nav: scroll state, spy, mobile ---------- */
  function initNav(){
    const nav = $('#nav'), links = $('#navLinks'), menuBtn = $('#menuBtn');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

    menuBtn.addEventListener('click', ()=>{ links.classList.toggle('open'); menuBtn.classList.toggle('open'); });
    $$('#navLinks a').forEach(a=> a.addEventListener('click', ()=>{ links.classList.remove('open'); menuBtn.classList.remove('open'); }));

    // scroll spy
    const map = {};
    $$('#navLinks a').forEach(a=> map[a.dataset.id]=a);
    const spy = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){
        $$('#navLinks a').forEach(a=>a.classList.remove('active'));
        const a = map[e.target.id]; if(a) a.classList.add('active');
      }});
    }, { rootMargin:'-45% 0px -50% 0px' });
    NAV_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) spy.observe(el); });
  }

  /* ---------- reveal ---------- */
  function initReveal(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin:'0px 0px -8% 0px', threshold:0.05 });
    $$('.reveal').forEach(el=>io.observe(el));
  }

  /* ---------- publication filters ---------- */
  function initFilters(){
    $$('.filter').forEach(btn=> btn.addEventListener('click', ()=>{
      $$('.filter').forEach(b=>b.classList.remove('on')); btn.classList.add('on');
      const f = btn.dataset.f;
      $$('.pub').forEach(p=>{
        const show = f==='all' || p.dataset.state===f;
        p.classList.toggle('hide', !show);
      });
    }));
  }

  /* ---------- contact ---------- */
  function initContact(){
    const form = $('#contactForm');
    if(form) form.addEventListener('submit', e=>{
      e.preventDefault();
      const f = e.target;
      const subj = encodeURIComponent(`[Web] ${f.name.value}`);
      const body = encodeURIComponent(`${f.msg.value}\n\n— ${f.name.value} (${f.email.value})`);
      window.location.href = `mailto:${D.meta.email}?subject=${subj}&body=${body}`;
    });
    $$('.copy-btn').forEach(btn=> btn.addEventListener('click', async e=>{
      e.preventDefault();
      try{ await navigator.clipboard.writeText(btn.dataset.copy); }catch(_){}
      const old = btn.innerHTML; btn.innerHTML = plain(D.ui.contact.copied);
      btn.style.color = 'var(--accent)';
      setTimeout(()=>{ btn.innerHTML = old; btn.style.color=''; }, 1600);
    }));
  }

  /* ---------- back to top ---------- */
  function initTopBtn(){
    const btn = $('#totop');
    const on = () => btn.classList.toggle('show', window.scrollY > 600);
    window.addEventListener('scroll', on, {passive:true}); on();
    btn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  }

  /* ---------- atmospheric flow field ----------
     Particles are advected along a vector field: a large-scale polar-vortex
     swirl perturbed by planetary-wave sinusoids — i.e. streamlines of the
     winter stratospheric circulation. Reads --accent and --motion live. */
  function initParticles(){
    const canvas = $('#particles'); if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr, parts = [], raf, t = 0, mouse = {x:-9999, y:-9999};

    const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#2ce8d8');
    const motion = () => { const m = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion')); return isNaN(m) ? 1 : m; };
    function hex2rgb(hex){ hex = hex.replace('#',''); if(hex.length===3) hex = hex.split('').map(c=>c+c).join(''); const n = parseInt(hex,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
    let COL = accent(), RGB = hex2rgb(COL);

    // flow field angle at (x,y) in canvas px — independent of dpr via normalized coords
    function field(x, y){
      const nx = x / w, ny = y / h;
      const cx = 0.62, cy = 0.34;            // vortex centre (upper-right, near portrait)
      const dx = nx - cx, dy = (ny - cy) * 1.15;
      const r = Math.hypot(dx, dy) + 0.0001;
      // rotational core that weakens with distance (solid-body-ish → shear)
      const swirl = Math.atan2(dy, dx) + Math.PI / 2;
      const swirlW = Math.max(0, 1 - r * 1.25);
      // background zonal jet (mostly horizontal) + planetary waves
      const wave = 0.95 * Math.sin(ny * 6.2 + t * 0.00055)
                 + 0.55 * Math.cos(nx * 5.0 - t * 0.0004)
                 + 0.35 * Math.sin((nx + ny) * 4.0 + t * 0.0007);
      const zonal = 0.18 + wave * 0.55;       // near-horizontal drift, undulating
      return swirl * swirlW + zonal * (1 - swirlW);
    }

    function spawn(p){
      p.x = Math.random() * w; p.y = Math.random() * h;
      p.life = 60 + Math.random() * 240; p.age = Math.random() * p.life;
      p.tr = []; p.spd = (0.5 + Math.random() * 0.9);
    }

    function resize(){
      const rct = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = rct.width * dpr; h = canvas.height = rct.height * dpr;
      const n = Math.round(Math.min(260, (rct.width * rct.height) / 4200) * (0.45 + 0.55 * motion()));
      parts = []; for(let i=0;i<n;i++){ const p = {}; spawn(p); parts.push(p); }
      COL = accent(); RGB = hex2rgb(COL);
    }

    function draw(){
      ctx.clearRect(0, 0, w, h);
      t += 16 * (0.4 + 0.6 * motion());
      const [R,G,B] = RGB;
      const base = (0.8 + 1.4 * motion()) * dpr;     // step length
      const TR = 16;                                 // trail length

      for(const p of parts){
        const a = field(p.x, p.y);
        let vx = Math.cos(a) * base * p.spd, vy = Math.sin(a) * base * p.spd;
        // gentle interactive curl near pointer
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.hypot(mdx, mdy);
        if(md < 150 * dpr){ const f = (1 - md / (150*dpr)) * 1.6; vx += (-mdy / md) * f * dpr; vy += (mdx / md) * f * dpr; }

        p.x += vx; p.y += vy; p.age++;
        p.tr.push(p.x, p.y); if(p.tr.length > TR * 2) p.tr.splice(0, p.tr.length - TR * 2);

        if(p.age > p.life || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20){ spawn(p); continue; }

        // fade in/out over lifespan
        const fade = Math.min(1, p.age / 18, (p.life - p.age) / 28);
        const pts = p.tr;
        for(let k = 2; k < pts.length; k += 2){
          const al = (k / pts.length) * 0.5 * fade;
          ctx.strokeStyle = `rgba(${R},${G},${B},${al})`;
          ctx.lineWidth = (0.6 + (k / pts.length) * 0.9) * dpr;
          ctx.beginPath(); ctx.moveTo(pts[k-2], pts[k-1]); ctx.lineTo(pts[k], pts[k+1]); ctx.stroke();
        }
        // leading dot
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.1 * dpr, 0, 6.283);
        ctx.fillStyle = `rgba(${R},${G},${B},${0.85 * fade})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', ()=>{ cancelAnimationFrame(raf); resize(); if(!reduce) draw(); else staticFrame(); });
    canvas.addEventListener('pointermove', e=>{ const r = canvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; });
    canvas.addEventListener('pointerleave', ()=>{ mouse.x = mouse.y = -9999; });

    // reduced motion: integrate each particle a few steps and draw still streamlines
    function staticFrame(){
      ctx.clearRect(0,0,w,h); const [R,G,B] = RGB;
      for(const p of parts){
        let x = p.x, y = p.y; ctx.beginPath(); ctx.moveTo(x,y);
        for(let s=0;s<TRSTATIC;s++){ const a = field(x,y); x += Math.cos(a)*4*dpr; y += Math.sin(a)*4*dpr; ctx.lineTo(x,y); }
        ctx.strokeStyle = `rgba(${R},${G},${B},0.32)`; ctx.lineWidth = 0.8*dpr; ctx.stroke();
      }
    }
    const TRSTATIC = 22;

    if(reduce) staticFrame(); else draw();

    // let Tweaks (accent / motion) rebuild density & colour live
    window.__refreshParticles = () => { cancelAnimationFrame(raf); resize(); if(!reduce) draw(); else staticFrame(); };
  }

  /* ---------- go ---------- */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
