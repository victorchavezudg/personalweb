#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_cv.py — Genera los CV en PDF a partir de data.js (la misma fuente del sitio).

Salidas (en assets/):
  CV_Victor_Chavez_Perez_es.pdf            CV completo, español
  CV_Victor_Chavez_Perez_en.pdf            Full CV, English
  CV_Victor_Chavez_Perez_es_sintetico.pdf  Una página, español
  CV_Victor_Chavez_Perez_en_short.pdf      One page, English

Uso:  python tools/build_cv.py        (requiere: pip install reportlab)
"""
import json, re, sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, HRFlowable, KeepTogether, Image)

ROOT   = Path(__file__).resolve().parent.parent
ACCENT = HexColor('#0d6e82')
INK    = HexColor('#1a2430')
MUTED  = HexColor('#4b5a68')
FAINT  = HexColor('#8595a5')
LINE   = HexColor('#d5dde4')

# ── datos ────────────────────────────────────────────────────────────────────
def load_data():
    src = (ROOT / 'data.js').read_text(encoding='utf-8')
    m = re.search(r'window\.DATA\s*=\s*(\{.*\});', src, re.S)
    return json.loads(m.group(1))

def L(v, lang):
    """Valor bilingüe {es,en} o string → string en el idioma pedido."""
    if v is None: return ''
    if isinstance(v, str): return v
    return v.get(lang) or v.get('es') or ''

def yrs(e, lang):
    return e.get('yearsEn') if (lang == 'en' and e.get('yearsEn')) else e.get('years', '')

# ── estilos ──────────────────────────────────────────────────────────────────
def S(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9, leading=12.5, textColor=INK)
    base.update(kw); return ParagraphStyle(name, **base)

ST = {
 'name':    S('name', fontName='Helvetica-Bold', fontSize=21, leading=24, textColor=INK),
 'role':    S('role', fontName='Helvetica-Bold', fontSize=10.5, leading=14, textColor=ACCENT),
 'contact': S('contact', fontSize=8.2, leading=11.5, textColor=MUTED),
 'h':       S('h', fontName='Helvetica-Bold', fontSize=10.2, leading=13, textColor=ACCENT,
              spaceBefore=11, spaceAfter=3),
 'body':    S('body', alignment=TA_JUSTIFY, spaceAfter=4),
 'year':    S('year', fontName='Helvetica-Bold', fontSize=8.4, textColor=ACCENT),
 'title':   S('title', fontName='Helvetica-Bold', fontSize=9.4, leading=12),
 'org':     S('org', fontSize=8.6, leading=11, textColor=MUTED),
 'detail':  S('detail', fontSize=8.6, leading=11.5, textColor=MUTED),
 'small':   S('small', fontSize=8.2, leading=11, textColor=MUTED),
 'chips':   S('chips', fontSize=8.4, leading=12, textColor=MUTED),
}

T = {  # rótulos de sección
 'profile':   {'es':'PERFIL','en':'PROFILE'},
 'interests': {'es':'LÍNEAS DE INVESTIGACIÓN','en':'RESEARCH INTERESTS'},
 'education': {'es':'FORMACIÓN ACADÉMICA','en':'EDUCATION'},
 'experience':{'es':'EXPERIENCIA','en':'EXPERIENCE'},
 'pubs':      {'es':'PUBLICACIONES','en':'PUBLICATIONS'},
 'indev':     {'es':'En preparación','en':'In preparation'},
 'projects':  {'es':'PROYECTOS DE INVESTIGACIÓN ACTIVOS','en':'ACTIVE RESEARCH PROJECTS'},
 'conferences':{'es':'CONGRESOS Y PONENCIAS','en':'CONFERENCES & TALKS'},
 'tech':      {'es':'DESARROLLOS TECNOLÓGICOS','en':'TECH DEVELOPMENTS'},
 'teaching':  {'es':'DOCENCIA','en':'TEACHING'},
 'outreach':  {'es':'DIVULGACIÓN CIENTÍFICA','en':'SCIENCE OUTREACH'},
 'grants':    {'es':'BECAS Y DISTINCIONES','en':'GRANTS & HONORS'},
 'certs':     {'es':'CERTIFICACIONES','en':'CERTIFICATIONS'},
 'tools':     {'es':'HERRAMIENTAS','en':'TOOLBOX'},
 'thesis':    {'es':'Tesis','en':'Thesis'},
 'funding':   {'es':'Financiamiento','en':'Funding'},
 'updated':   {'es':'Generado automáticamente desde la página personal','en':'Auto-generated from the personal website'},
}

def esc(s):
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def head_rule():
    return HRFlowable(width='100%', thickness=1.6, color=ACCENT, spaceBefore=4, spaceAfter=8)

def sec(title):
    return [Paragraph(title, ST['h']),
            HRFlowable(width='100%', thickness=0.6, color=LINE, spaceBefore=0, spaceAfter=5)]

def row(year, right_flowables, year_w=22*mm):
    t = Table([[Paragraph(esc(year), ST['year']), right_flowables]],
              colWidths=[year_w, None])
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),
                           ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),4),
                           ('TOPPADDING',(0,0),(-1,-1),1.5), ('BOTTOMPADDING',(0,0),(-1,-1),1.5)]))
    return t

def circular_photo():
    """Recorta assets/victor.png en círculo (PNG con alfa) para el encabezado."""
    src = ROOT / 'assets' / 'victor.png'
    if not src.exists(): return None
    try:
        from PIL import Image as PImage, ImageDraw
    except ImportError:
        return None
    out = ROOT / 'assets' / '.cv_photo.png'
    im = PImage.open(src).convert('RGB')
    w, h = im.size
    side = min(w, h)
    # encuadre como en la web (rostro hacia arriba: center 22%)
    top = max(0, min(int(h * 0.22) - side // 4, h - side))
    left = (w - side) // 2
    im = im.crop((left, top, left + side, top + side)).resize((600, 600), PImage.LANCZOS)
    mask = PImage.new('L', (600, 600), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 600, 600), fill=255)
    im.putalpha(mask)
    im.save(out)
    return out

def header(D, lang, story):
    m = D['meta']
    txt = [Paragraph(esc(m['name']), ST['name']), Spacer(1, 2),
           Paragraph(esc(L(m['role'], lang)), ST['role']), Spacer(1, 3)]
    links = m.get('links', {})
    parts = [esc(L(m['institution'], lang)), esc(L(m['location'], lang)), esc(m['email'])]
    if links.get('orcid'): parts.append('ORCID: ' + esc(links['orcid'].split('orcid.org/')[-1]))
    txt.append(Paragraph('  ·  '.join(p for p in parts if p), ST['contact']))
    txt.append(Paragraph(esc(L(m['sni'], lang)), ST['contact']))
    photo = circular_photo()
    if photo:
        img = Image(str(photo), width=26*mm, height=26*mm, mask='auto')
        t = Table([[txt, img]], colWidths=[None, 28*mm])
        t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'), ('ALIGN',(1,0),(1,0),'RIGHT'),
                               ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0),
                               ('TOPPADDING',(0,0),(-1,-1),0), ('BOTTOMPADDING',(0,0),(-1,-1),0)]))
        story.append(t)
    else:
        story.extend(txt)
    story.append(head_rule())

def doc(path):
    d = BaseDocTemplate(str(path), pagesize=A4,
                        leftMargin=16*mm, rightMargin=16*mm, topMargin=14*mm, bottomMargin=13*mm)
    f = Frame(d.leftMargin, d.bottomMargin, d.width, d.height, id='f')
    def footer(canv, _doc):
        canv.saveState(); canv.setFont('Helvetica', 6.8); canv.setFillColor(FAINT)
        canv.drawString(16*mm, 8*mm, FOOT)
        canv.drawRightString(A4[0]-16*mm, 8*mm, str(canv.getPageNumber()))
        canv.restoreState()
    d.addPageTemplates([PageTemplate(id='p', frames=[f], onPage=footer)])
    return d

# ── CV completo ──────────────────────────────────────────────────────────────
def build_full(D, lang, path):
    s = []
    header(D, lang, s)
    a = D['about']

    s += sec(T['profile'][lang])
    for p in a['bio'][lang]:
        s.append(Paragraph(esc(p), ST['body']))

    s += sec(T['interests'][lang])
    s.append(Paragraph(esc('  ·  '.join(L(i, lang) for i in a['interests'])), ST['chips']))

    s += sec(T['education'][lang])
    for e in D['education']:
        s.append(row(e['years'], [Paragraph(esc(L(e['degree'], lang)), ST['title']),
                                  Paragraph(esc(e['org']) + ' · ' + esc(L(e['place'], lang)), ST['org']),
                                  Paragraph(esc(L(e['detail'], lang)), ST['detail'])]))

    s += sec(T['experience'][lang])
    for e in D['experience']:
        s.append(row(yrs(e, lang), [Paragraph(esc(L(e['role'], lang)), ST['title']),
                                    Paragraph(esc(e['org']) + ' · ' + esc(L(e['place'], lang)), ST['org']),
                                    Paragraph(esc(L(e['detail'], lang)), ST['detail'])]))

    s += sec(T['pubs'][lang])
    pubs = [p for p in D['publications'] if p['state'] == 'published']
    indev = [p for p in D['publications'] if p['state'] != 'published']
    for p in sorted(pubs, key=lambda x: x['year'], reverse=True):
        ref = ('DOI: ' + p['doi']) if p.get('doi') else (('ISBN: ' + p['isbn']) if p.get('isbn') else '')
        s.append(row(p['year'], [Paragraph(esc(p['title']), ST['title']),
                                 Paragraph(esc(p['authors']) + ' · <i>' + esc(L(p['venue'], lang)) + '</i>'
                                           + ((' · ' + esc(ref)) if ref else ''), ST['detail'])]))
    if indev:
        s.append(Spacer(1, 3))
        s.append(Paragraph('<b>' + T['indev'][lang] + '</b>', ST['org']))
        for p in indev:
            s.append(row(p['year'], [Paragraph(esc(p['title']), ST['detail']),
                                     Paragraph(esc(p['authors']), ST['small'])]))

    if D.get('conferences'):
        s += sec(T['conferences'][lang])
        for c in D['conferences']:
            blk = [Paragraph(esc(c['name']), ST['title']),
                   Paragraph(esc(c.get('date','')) + ' · ' + esc(L(c['place'], lang)), ST['org'])]
            for tk in c.get('talks', []):
                blk.append(Paragraph('• ' + esc(tk), ST['detail']))
            s.append(KeepTogether(row(c.get('when',''), blk)))

    s += sec(T['projects'][lang])
    for p in [x for x in D['projects'] if x.get('active')]:
        me = next((c for c in p.get('collaborators', []) if 'Chávez' in c.get('name','')), None)
        role = (' — ' + L(me['role'], lang)) if me else ''
        s.append(KeepTogether(row(p['years'], [
            Paragraph(esc(L(p['name'], lang)) + esc(role), ST['title']),
            Paragraph(esc(p['org']) + ' · ' + T['funding'][lang] + ': ' + esc(L(p.get('funding',''), lang)), ST['org']),
            Paragraph(esc(L(p['desc'], lang)), ST['detail'])])))

    tech_items = [x for x in D.get('tech', []) if not x.get('placeholder')]
    if tech_items:
        s += sec(T['tech'][lang])
        for x in tech_items:
            block = [Paragraph(esc(L(x['name'], lang)), ST['title'])]
            stack = ' · '.join(x.get('stack', []))
            if stack:
                block.append(Paragraph(esc(stack), ST['org']))
            block.append(Paragraph(esc(L(x['desc'], lang)), ST['detail']))
            s.append(KeepTogether(block))

    s += sec(T['teaching'][lang])
    for t in D['teaching']:
        courses = ', '.join(L(c['course'], lang) for c in t['courses'])
        s.append(Paragraph('<b>' + esc(t['org']) + '</b> · ' + esc(L(t['place'], lang))
                           + ' — ' + esc(courses), ST['detail']))

    s += sec(T['outreach'][lang])
    for o in D['outreach']:
        s.append(row(o['when'], [Paragraph(esc(L(o['title'], lang)), ST['title']),
                                 Paragraph(esc(L(o['desc'], lang)), ST['detail'])]))

    s += sec(T['grants'][lang])
    for d_ in a['distinctions']:
        s.append(row(d_['years'], [Paragraph(esc(L({'es':d_['es'],'en':d_['en']}, lang)), ST['title']),
                                   Paragraph(esc(d_['org']) + ' · ' + esc(L(d_['place'], lang)), ST['org'])]))
    if a.get('certifications'):
        s += sec(T['certs'][lang])
        for d_ in a['certifications']:
            s.append(row(d_['years'], [Paragraph(esc(L({'es':d_['es'],'en':d_['en']}, lang)) +
                                                 ' — ' + esc(d_['org']), ST['detail'])]))

    s += sec(T['tools'][lang])
    s.append(Paragraph(esc(' · '.join(a['toolbox'])), ST['chips']))

    doc(path).build(s)

# ── CV sintético (1 página) ─────────────────────────────────────────────────
def build_short(D, lang, path):
    s = []
    header(D, lang, s)
    a = D['about']

    s += sec(T['profile'][lang])
    s.append(Paragraph(esc(a['bio'][lang][0]), ST['body']))

    s += sec(T['education'][lang])
    for e in D['education'][:3]:
        s.append(row(e['years'], [Paragraph(esc(L(e['degree'], lang)) + '  ·  <font color="#4b5a68">'
                                            + esc(e['org']) + '</font>', ST['title'])], 20*mm))

    s += sec(T['experience'][lang])
    cur = [e for e in D['experience'] if 'actual' in e.get('years','') or 'present' in e.get('yearsEn','')]
    for e in cur[:4]:
        s.append(row(yrs(e, lang), [Paragraph(esc(L(e['role'], lang)) + '  ·  <font color="#4b5a68">'
                                              + esc(e['org']) + '</font>', ST['title'])], 20*mm))

    s += sec(T['pubs'][lang])
    pubs = sorted([p for p in D['publications'] if p['state'] == 'published'],
                  key=lambda x: x['year'], reverse=True)[:4]
    for p in pubs:
        ref = (' · DOI: ' + p['doi']) if p.get('doi') else ''
        s.append(row(p['year'], [Paragraph(esc(p['title']) + ' — <i>' + esc(L(p['venue'], lang))
                                           + '</i>' + esc(ref), ST['detail'])], 20*mm))

    s += sec(T['interests'][lang])
    s.append(Paragraph(esc('  ·  '.join(L(i, lang) for i in a['interests'][:8])), ST['chips']))

    s += sec(T['tools'][lang])
    s.append(Paragraph(esc(' · '.join(a['toolbox'])), ST['chips']))

    doc(path).build(s)

# ── main ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    D = load_data()
    out = ROOT / 'assets'; out.mkdir(exist_ok=True)
    from datetime import date
    for lang in ('es', 'en'):
        FOOT = f"{T['updated'][lang]} · {date.today().isoformat()}"
        globals()['FOOT'] = FOOT
        full = out / f"CV_Victor_Chavez_Perez_{lang}.pdf"
        short = out / (f"CV_Victor_Chavez_Perez_es_sintetico.pdf" if lang == 'es'
                       else "CV_Victor_Chavez_Perez_en_short.pdf")
        build_full(D, lang, full)
        build_short(D, lang, short)
        print('✓', full.name, '·', short.name)
