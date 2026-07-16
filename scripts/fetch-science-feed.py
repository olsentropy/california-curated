#!/usr/bin/env python3
"""
California Science Feed Generator — v2 (Editorial design)
Same fetch logic as fetch-science-feed.py, different layout.

Run:  python3 fetch-science-feed-v2.py
"""

import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import os, re, html, sys, json
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT   = os.path.join(SCRIPT_DIR, '..')
OUTPUT_FILE = os.path.join(REPO_ROOT, 'public', 'science-feed', 'index.html')
LOGO_FILE   = os.path.join(REPO_ROOT, 'public', 'californiacuratedtoplogo.jpg')
# Use absolute paths for images (served from site root, not relative to /science-feed/)
LOGO_SRC    = '/californiacuratedtoplogo.jpg'
BANNER_SRC  = '/science-banner.png'

SOURCES = [
    # UC System
    {'id':'ucb',     'name':'UC Berkeley',          'url':'https://news.berkeley.edu/feed/',                    'region':'Bay Area',        'type':'university'},
    {'id':'ucla',    'name':'UCLA',                  'url':'https://newsroom.ucla.edu/rss.xml',                  'region':'Los Angeles',     'type':'university'},
    {'id':'ucsd',    'name':'UC San Diego',          'url':'https://today.ucsd.edu/feed/',                       'region':'San Diego',       'type':'university',
                                                     'fallback':'https://ucsdnews.ucsd.edu/rss'},
    {'id':'ucsb',    'name':'UC Santa Barbara',      'url':'https://news.ucsb.edu/rss',                          'region':'Santa Barbara',   'type':'university',
                                                     'fallback':'https://news.ucsb.edu/feed/'},
    {'id':'ucd',     'name':'UC Davis',              'url':'https://www.ucdavis.edu/news/feed.xml',              'region':'Sacramento Valley','type':'university',
                                                     'fallback':'https://www.ucdavis.edu/news/rss.xml'},
    {'id':'ucsc',    'name':'UC Santa Cruz',         'url':'https://news.ucsc.edu/feed/',                        'region':'Central Coast',   'type':'university',
                                                     'fallback':'https://news.ucsc.edu/rss.xml'},
    {'id':'uci',     'name':'UC Irvine',             'url':'https://news.uci.edu/feed/',                         'region':'Orange County',   'type':'university'},
    {'id':'ucr',     'name':'UC Riverside',          'url':'https://news.ucr.edu/rss.xml',                       'region':'Inland Empire',   'type':'university'},
    {'id':'stanford','name':'Stanford',              'url':'https://news.stanford.edu/feed/',                    'region':'Bay Area',        'type':'university',
                                                     'fallback':'https://engineering.stanford.edu/news/rss'},
    {'id':'caltech', 'name':'Caltech',               'url':'https://www.caltech.edu/about/news/rss',             'region':'Los Angeles',     'type':'university',
                                                     'fallback':'https://www.caltech.edu/about/news/feed'},
    {'id':'usc',     'name':'USC',                   'url':'https://news.usc.edu/feed/',                         'region':'Los Angeles',     'type':'university'},
    {'id':'sfsu',    'name':'SF State',              'url':'https://news.sfsu.edu/rss.xml',                      'region':'Bay Area',        'type':'university'},
    # Research Labs
    {'id':'jpl',     'name':'JPL / NASA',            'url':'https://www.jpl.nasa.gov/feed.xml',                 'region':'Los Angeles',     'type':'lab',
                                                     'fallback':'https://www.jpl.nasa.gov/news/rss.xml'},
    {'id':'lbl',     'name':'Lawrence Berkeley Lab', 'url':'https://newscenter.lbl.gov/feed/',                   'region':'Bay Area',        'type':'lab'},
    {'id':'scripps', 'name':'Scripps Oceanography',  'url':'https://scripps.ucsd.edu/news/rss',                  'region':'San Diego',       'type':'lab',
                                                     'fallback':'https://scripps.ucsd.edu/news/feed/'},
    {'id':'mbari',   'name':'MBARI',                 'url':'https://www.mbari.org/feed/',                        'region':'Monterey Bay',    'type':'lab'},
    {'id':'pointblue','name':'Point Blue Conservation','url':'https://www.pointblue.org/feed/',                  'region':'Bay Area',        'type':'lab'},
    # Government
    {'id':'usgs',    'name':'USGS',                  'url':'https://www.usgs.gov/news/news-releases/feed',       'region':'Statewide',       'type':'gov'},
    {'id':'nasa',    'name':'NASA',                  'url':'https://www.nasa.gov/news-release/feed/',            'region':'Statewide',       'type':'gov'},
    {'id':'noaaclim','name':'NOAA Climate.gov',      'url':'https://www.climate.gov/news-features/feed',        'region':'Statewide',       'type':'gov'},
    # News & Media
    {'id':'calmatters','name':'CalMatters',          'url':'https://calmatters.org/feed/',                       'region':'Statewide',       'type':'news'},
    {'id':'latimes', 'name':'LA Times Science',      'url':'https://www.latimes.com/science/rss2.0.xml',         'region':'Los Angeles',     'type':'news'},
    {'id':'sdnhm',   'name':'San Diego Natural History','url':'https://www.sdnhm.org/feed/',                     'region':'San Diego',       'type':'nonprofit'},
    # Nonprofits / Journals / Institutions
    {'id':'nature',  'name':'Nature News',           'url':'https://feeds.nature.com/nature/rss/current',        'region':'Global',          'type':'nonprofit',
                                                     'fallback':'https://www.nature.com/nature.rss'},
    {'id':'sciday',  'name':'Science Daily',         'url':'https://www.sciencedaily.com/rss/all.xml',           'region':'Statewide',       'type':'nonprofit'},
    {'id':'baynature',  'name':'Bay Nature',              'url':'https://baynature.org/feed/',                   'region':'Bay Area',      'type':'nonprofit'},
    {'id':'biographic', 'name':'bioGraphic (Cal Academy)','url':'https://www.calacademy.org/biographic/feed',   'region':'Bay Area',      'type':'nonprofit',
                                                          'fallback':'https://www.biographic.com/feed'},
    {'id':'hcn',        'name':'High Country News',        'url':'https://www.hcn.org/feed/',                   'region':'Western US',    'type':'news'},
    {'id':'mba',        'name':'Monterey Bay Aquarium',    'url':'https://futureoftheocean.wordpress.com/feed/','region':'Monterey Bay',  'type':'nonprofit'},
    {'id':'redwoods',   'name':'Save the Redwoods',        'url':'https://www.savetheredwoods.org/feed/',       'region':'Northern CA',   'type':'nonprofit'},
    {'id':'nhmlac',     'name':'Natural History Museum LA','url':'https://nhmlac.org/feed/',                    'region':'Los Angeles',   'type':'nonprofit',
                                                          'fallback':'https://nhmlac.org/news/feed/'},
    {'id':'audubon',    'name':'Audubon California',       'url':'https://ca.audubon.org/feed/',                'region':'Statewide',     'type':'nonprofit'},
    {'id':'healthebay', 'name':'Heal the Bay',             'url':'https://healthebay.org/feed/',                'region':'Los Angeles',   'type':'nonprofit'},
    {'id':'inaturalist','name':'iNaturalist Blog',         'url':'https://www.inaturalist.org/blog.atom',       'region':'Statewide',     'type':'nonprofit'},
    {'id':'palomar',    'name':'Palomar/Keck Obs. Blog',   'url':'https://www.keckobservatory.org/feed/',       'region':'Southern CA',   'type':'nonprofit'},
]

CATS = {
    'Biology & Life Sciences':  ['biology','evolution','ecology','genetics','wildlife','marine biology','botany','microbiology','conservation','species','biodiversity','habitat','dna','genome','animal','plant','insect','bird','mammal','tree','fungi','bacteria','pollinator','bee','salmon','condor','owl','bat','amphibian','primate'],
    'Earth & Geology':          ['geology','earthquake','volcano','tectonic','paleontology','mineral','fossil','seismic','fault','plate','geologic','sediment','rock','tremor','quake','landslide','erosion','sierra','desert','basin','geothermal'],
    'Ocean & Coast':            ['ocean','coast','marine','sea level','wave','tide','kelp','coral','fishery','fisheries','whale','shark','deep sea','oceanography','seafloor','bay','estuary','reef','plankton','squid','otter','seal','sea lion','pacific','monterey','channel islands','salinity','upwelling','tsunami'],
    'Climate & Sustainability': ['climate','renewable','solar','wind power','carbon','emission','drought','wildfire','water','sustainability','warming','greenhouse','heat wave','flood','snowpack','reservoir','groundwater','methane','co2','net zero','clean energy','battery','decarboniz','fire season'],
    'Space & Astronomy':        ['space','astronomy','planet','star ','galaxy','telescope','nasa','jpl','satellite','rocket','mission','orbit','asteroid','comet','exoplanet','cosmos','black hole','dark matter','spacecraft','launch','moon','mars','jupiter','hubble','webb','supernova','astrophysics'],
    'Technology & Innovation':  ['artificial intelligence','machine learning',' ai ','robot','biotech','semiconductor','chip','software','algorithm','startup','innovation','autonomous','drone','electric vehicle','quantum computing','neural network','deep learning','generative','ev ','computing'],
    'Physics & Engineering':    ['physics','aerospace','quantum','particle','laser','materials science','engineer','nuclear','fusion','accelerator','photon','electron','plasma','nanotechnology','superconductor','optics','thermodynamics'],
    'Human Health':             ['health','medicine','disease','cancer','brain','neuroscience','aging','nutrition','virus','vaccine','drug','clinical','patient','therapy','mental health','alzheimer','autism','diabetes','heart','lung','gut','microbiome','stem cell','gene therapy','public health','epidemic'],
    'Urban Nature':             ['urban','city park','green space','street tree','urban wildlife','neighborhood','urban ecology','urban forest','green infrastructure','metropolitan nature','urban garden','rewilding'],
    'Exploration & Discovery':  ['exploration','expedition','discovery','mapping','remote sensing','field research','underwater','submersible','rover','aerial survey','lidar','sonar','new species','undiscovered','deep dive','bathymetric'],
    'Science History':          ['history of science','historic discovery','anniversary','pioneer','legacy','archive','museum collection','founded','milestone','centennial'],
}
CAT_COLORS = {
    'Biology & Life Sciences':  '#2E7D32',
    'Earth & Geology':          '#5D4037',
    'Ocean & Coast':            '#0277BD',
    'Climate & Sustainability': '#00695C',
    'Space & Astronomy':        '#1A237E',
    'Technology & Innovation':  '#C8580A',
    'Physics & Engineering':    '#37474F',
    'Human Health':             '#B71C1C',
    'Urban Nature':             '#558B2F',
    'Exploration & Discovery':  '#BF360C',
    'Science History':          '#4527A0',
}
SOURCE_CAT_HINTS = {
    'jpl':       'Space & Astronomy',
    'nasa':      'Space & Astronomy',
    'palomar':   'Space & Astronomy',
    'noaaclim':  'Climate & Sustainability',
    'usgs':      'Earth & Geology',
    'scripps':   'Ocean & Coast',
    'mbari':     'Ocean & Coast',
    'noaafish':  'Ocean & Coast',
    'baynature':   'Biology & Life Sciences',
    'biographic':  'Biology & Life Sciences',
    'pointblue':   'Biology & Life Sciences',
    'sdnhm':       'Biology & Life Sciences',
    'inaturalist': 'Biology & Life Sciences',
    'audubon':     'Biology & Life Sciences',
    'redwoods':    'Biology & Life Sciences',
    'nhmlac':      'Biology & Life Sciences',
    'mba':         'Ocean & Coast',
    'healthebay':  'Ocean & Coast',
}

def classify(title, desc, src_id):
    hint = SOURCE_CAT_HINTS.get(src_id)
    if hint: return hint
    text = (title + ' ' + desc).lower()
    best, top = 'Technology & Innovation', 0
    for cat, kws in CATS.items():
        score = sum((3 if ' ' in kw else 1) for kw in kws if kw in text)
        if score > top:
            top, best = score, cat
    return best

HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'}

def strip_html(s):
    text = html.unescape(s or '')
    # Run tag stripping twice to catch tags with > in attribute values
    for _ in range(3):
        text = re.sub(r'<[^>]*>', '', text)
    # Strip any leftover attribute fragments like data-src="..." or />
    text = re.sub(r'\w+=["\'][^"\']*["\']', '', text)
    text = re.sub(r'\s*/>\s*', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def parse_date(s):
    if not s: return datetime.now(timezone.utc)
    try: return parsedate_to_datetime(s.strip())
    except: pass
    for fmt in ['%Y-%m-%dT%H:%M:%S%z','%Y-%m-%dT%H:%M:%SZ','%Y-%m-%d %H:%M:%S','%Y-%m-%d']:
        try:
            d = datetime.strptime(s.strip()[:19], fmt[:len(s.strip())])
            return d.replace(tzinfo=timezone.utc)
        except: pass
    return datetime.now(timezone.utc)

def time_ago(dt):
    diff = datetime.now(timezone.utc) - dt.astimezone(timezone.utc)
    h = int(diff.total_seconds() / 3600)
    if h < 1: return 'Just now'
    if h < 24: return f'{h}h ago'
    if h < 48: return 'Yesterday'
    d = diff.days
    if d < 7: return f'{d} days ago'
    return dt.strftime('%b %-d')

def fetch_raw(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            return r.read(), None
    except urllib.error.HTTPError as e:
        if e.code == 403:
            bot_headers = {'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'}
            try:
                req2 = urllib.request.Request(url, headers=bot_headers)
                with urllib.request.urlopen(req2, timeout=12) as r:
                    return r.read(), None
            except Exception as e2:
                return None, str(e2)
        return None, str(e)
    except Exception as e:
        return None, str(e)

def clean_xml(text):
    text = text.lstrip('﻿').strip()
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    text = re.sub(r'<!\[CDATA\[(.*?)\]\]>', lambda m: html.escape(m.group(1)), text, flags=re.DOTALL)
    text = re.sub(r'&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)', '&amp;', text)
    return text

def parse_xml(text, name):
    for attempt in [
        text,
        re.sub(r' xmlns[^=]*="[^"]*"', '', text),
        re.sub(r"<\?xml[^>]*\?>", '<?xml version="1.0"?>', text),
    ]:
        try:
            return ET.fromstring(attempt)
        except ET.ParseError:
            continue
    return None

def fetch_source(src):
    urls_to_try = [src['url']]
    if src.get('fallback'):
        urls_to_try.append(src['fallback'])
    raw = None
    last_err = ''
    for url in urls_to_try:
        raw, err = fetch_raw(url)
        if raw: break
        last_err = err
    if raw is None:
        print(f'  ❌ {src["name"]}: {last_err}')
        return []
    try: text = raw.decode('utf-8')
    except: text = raw.decode('latin-1', errors='replace')
    text = clean_xml(text)
    if not text.startswith('<'):
        print(f'  ❌ {src["name"]}: Not XML')
        return []
    root = parse_xml(text, src['name'])
    if root is None:
        print(f'  ❌ {src["name"]}: XML parse failed')
        return []

    articles = []
    RSS1 = 'http://purl.org/rss/1.0/'
    RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    DC   = 'http://purl.org/dc/elements/1.1/'
    items = root.findall('.//item') or root.findall(f'.//{{{RSS1}}}item')

    def item_text(el, *tags):
        for tag in tags:
            for ns in ['', RSS1, DC]:
                q = f'{{{ns}}}{tag}' if ns else tag
                v = el.findtext(q) or ''
                if v: return v
        return ''

    for item in items:
        title = strip_html(item_text(item, 'title'))
        link  = item_text(item, 'link').strip()
        if not link:
            link_el = item.find('link') or item.find(f'{{{RSS1}}}link')
            if link_el is not None: link = (link_el.text or link_el.tail or '').strip()
        if not link:
            link = (item.get(f'{{{RDF}}}about', '') or item.get('rdf:about', '')).strip()
        desc = strip_html(
            item_text(item, 'description') or
            item.findtext('{http://purl.org/rss/1.0/modules/content/}encoded') or ''
        )[:600]
        date_str = item_text(item, 'pubDate', 'date')
        if title and link:
            articles.append({'title': title, 'link': link, 'desc': desc, 'date': parse_date(date_str)})

    NS = 'http://www.w3.org/2005/Atom'
    atom_entries = root.findall(f'.//{{{NS}}}entry') or root.findall('.//entry')

    def atom_text(el, *tags):
        for tag in tags:
            v = el.findtext(f'{{{NS}}}{tag}') or el.findtext(tag) or ''
            if v: return v
        return ''

    def atom_link(el):
        for rel in ['alternate', None]:
            for ns in [NS, '']:
                q = f'{{{ns}}}link' if ns else 'link'
                cond = f'[@rel="{rel}"]' if rel else ''
                found = el.find(f'{q}{cond}')
                if found is not None:
                    href = found.get('href', '')
                    if href: return href
        return atom_text(el, 'id')

    for entry in atom_entries:
        title = strip_html(atom_text(entry, 'title'))
        link  = atom_link(entry)
        desc  = strip_html(atom_text(entry, 'summary', 'content'))[:600]
        date_str = atom_text(entry, 'published', 'updated')
        if title and link:
            articles.append({'title': title, 'link': link, 'desc': desc, 'date': parse_date(date_str)})

    result = []
    for a in articles[:12]:
        result.append({
            'id':         a['link'],
            'title':      a['title'],
            'link':       a['link'],
            'desc':       a['desc'],
            'date':       a['date'].isoformat(),
            'dateTs':     int(a['date'].timestamp()),
            'dateLabel':  time_ago(a['date']),
            'source':     src['name'],
            'sourceId':   src['id'],
            'sourceType': src['type'],
            'region':     src['region'],
            'category':   classify(a['title'], a['desc'], src['id']),
        })
    return result


# ── HTML generator (v2 — editorial, open layout) ──────────────────────────────
def build_html(articles, ok_sources, fail_sources):
    now_str = datetime.now().strftime('%B %-d, %Y · %-I:%M %p')
    articles_json = json.dumps(articles, ensure_ascii=False)

    cat_tabs = '\n'.join(
        f'<button class="tab" data-cat="{html.escape(cat)}" onclick="setCat(this)">'
        f'<span class="tab-dot" style="background:{CAT_COLORS.get(cat,"#888")}"></span>'
        f'{cat.split(" &")[0].split(" /")[0]}'
        f'</button>'
        for cat in CATS
    )

    return f'''<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>California Science Feed</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">
  <style>
    :root {{
      --orange: #F57F20;
      --orange-dk: #C8580A;
      --blue: #0F7FA6;
      --ink: #1B1F23;
      --ink-soft: #4B5563;
      --muted: #8A94A0;
      --line: #E5E7EB;
      --bg: #F8F7F4;
      --surface: #FFFFFF;
      --serif: "Helvetica Neue", Arial, sans-serif;
      --sans: "Helvetica Neue", Arial, sans-serif;
    }}
    [data-theme="dark"] {{
      --ink: #E8EBF0;
      --ink-soft: #9BA6B4;
      --muted: #606C7A;
      --line: #2A3040;
      --bg: #0F1218;
      --surface: #171D28;
    }}

    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html {{ font-size: 15px; scroll-behavior: smooth; }}
    body {{
      font-family: var(--sans);
      background: var(--bg);
      color: var(--ink);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }}
    a {{ color: inherit; text-decoration: none; }}

    /* ── HEADER ── */
    .hdr {{
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 0 2rem;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      height: 72px;
      position: sticky;
      top: 0;
      z-index: 100;
    }}
    .hdr-logo {{ display: flex; justify-content: center; }}
    .hdr-logo img {{ height: 52px; width: auto; display: block; }}
    [data-theme="dark"] .hdr-logo img {{ filter: brightness(0) invert(1); }}
    .hdr-left {{ display: flex; align-items: center; }}
    .hdr-right {{
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
    }}
    .hdr-ts {{ font-size: .75rem; color: var(--muted); }}
    .theme-btn {{
      width: 30px; height: 30px;
      border: none; background: none; cursor: pointer;
      color: var(--muted); font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px; transition: background .12s;
    }}
    .theme-btn:hover {{ background: var(--line); }}

    /* ── FILTER BAR ── */
    .filter-bar {{
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }}
    .filter-bar::-webkit-scrollbar {{ display: none; }}
    .tab {{
      flex-shrink: 0;
      display: flex; align-items: center; gap: .4rem;
      padding: .7rem .95rem;
      border: none; background: none; cursor: pointer;
      font-family: var(--sans); font-size: .78rem; font-weight: 500;
      color: var(--ink-soft);
      border-bottom: 2px solid transparent;
      transition: color .12s, border-color .12s;
      white-space: nowrap;
    }}
    .tab:first-child {{ padding-left: 0; }}
    .tab:hover {{ color: var(--ink); }}
    .tab.active {{ color: var(--ink); font-weight: 700; border-bottom-color: var(--orange); }}
    .tab-dot {{ width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; opacity: .7; }}
    .tab.active .tab-dot {{ opacity: 1; }}
    .tab-all {{ color: var(--ink-soft); }}

    /* ── BANNER ── */
    .banner {{
      width: 100%; position: relative; overflow: hidden;
      height: 180px; display: flex; align-items: center; justify-content: center;
    }}
    .banner img {{
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; object-position: center 30%; display: block;
    }}
    .banner::after {{
      content: ''; position: absolute; inset: 0; background: rgba(0,0,0,.28);
    }}
    .banner-inner {{ position: relative; z-index: 1; text-align: center; }}
    .banner-text {{
      font-family: var(--serif); font-size: 1.6rem; font-weight: 700;
      color: #fff; letter-spacing: .01em; text-shadow: 0 2px 16px rgba(0,0,0,.6);
    }}

    /* ── SEARCH + SORT ── */
    .controls {{
      max-width: 1100px;
      margin: 2rem auto 1.25rem;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }}
    .count-label {{ font-size: .82rem; color: var(--muted); }}
    .count-label strong {{ color: var(--ink); font-size: .9rem; }}
    .time-pills {{ display: flex; gap: .3rem; }}
    .time-pill {{
      padding: .25rem .6rem; border-radius: 12px;
      border: 1px solid var(--line); background: none;
      color: var(--muted); font-size: .72rem; font-weight: 600;
      cursor: pointer; transition: all .12s; font-family: var(--sans);
    }}
    .time-pill:hover {{ border-color: var(--blue); color: var(--blue); }}
    .time-pill.active {{ background: var(--blue); color: #fff; border-color: var(--blue); }}
    .src-select {{
      padding: .32rem .6rem; border: 1px solid var(--line); border-radius: 20px;
      background: var(--bg); color: var(--ink-soft); font-size: .78rem;
      font-family: var(--sans); outline: none; cursor: pointer;
      transition: border-color .15s;
    }}
    .src-select:focus {{ border-color: var(--blue); }}
    .search-wrap {{ position: relative; flex: 1; max-width: 220px; }}
    .search-input {{
      width: 100%; padding: .38rem .8rem .38rem 2.1rem;
      border: 1px solid var(--line); border-radius: 20px;
      background: var(--bg); color: var(--ink);
      font-size: .8rem; outline: none; font-family: var(--sans);
      transition: border-color .15s;
    }}
    .search-input:focus {{ border-color: var(--blue); }}
    .search-input::placeholder {{ color: var(--muted); }}
    .search-icon {{
      position: absolute; left: .7rem; top: 50%; transform: translateY(-50%);
      color: var(--muted); font-size: .85rem; pointer-events: none;
    }}

    /* ── GRID ── */
    .feed {{
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem 4rem;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }}
    @media (max-width: 760px) {{
      .feed {{ grid-template-columns: 1fr; padding: 0 1rem 3rem; }}
      .controls {{ padding: 0 1rem; margin: 1.25rem auto 1rem; }}
      .hdr {{ padding: 0 1rem; }}
      .filter-bar {{ padding: 0 1rem; }}
      .card.lead {{ grid-column: span 1; }}
    }}
    @media (min-width: 761px) {{
      .card.lead {{ grid-column: span 2; }}
    }}

    /* ── CARD ── */
    .card {{
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      transition: box-shadow .18s, transform .18s;
    }}
    .card:hover {{
      box-shadow: 0 8px 32px rgba(0,0,0,.1);
      transform: translateY(-2px);
    }}
    .card-inner {{ padding: 1.6rem; flex: 1; display: flex; flex-direction: column; gap: .75rem; }}
    .card.lead .card-inner {{ padding: 2rem; gap: .85rem; }}
    .card-eyebrow {{
      display: flex; align-items: center; gap: .55rem;
    }}
    .cat-pill {{
      font-size: .65rem; font-weight: 700; letter-spacing: .06em;
      text-transform: uppercase; color: #fff;
      padding: .2rem .5rem; border-radius: 3px;
    }}
    .card-source {{
      font-size: .75rem; color: var(--muted);
      background: none; border: none; padding: 0; cursor: pointer;
      font-family: var(--sans); transition: color .12s;
    }}
    .card-source:hover {{ color: var(--blue); text-decoration: underline; }}
    .card-title {{
      font-family: var(--serif);
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
      color: var(--ink);
    }}
    .card.lead .card-title {{ font-size: 1.4rem; line-height: 1.25; }}
    .card-title a:hover {{ color: var(--orange); }}
    .card-desc {{ font-size: .82rem; color: var(--ink-soft); line-height: 1.6; flex: 1; }}
    .card-foot {{
      display: flex; align-items: center; justify-content: space-between;
      padding: .9rem 1.6rem;
      border-top: 1px solid var(--line);
    }}
    .card.lead .card-foot {{ padding: .9rem 2rem; }}
    .card-date {{ font-size: .72rem; color: var(--muted); }}
    .card-region {{ font-size: .72rem; color: var(--muted); }}
    .read-link {{
      font-size: .75rem; font-weight: 600; color: var(--blue);
      display: flex; align-items: center; gap: .25rem;
    }}
    .read-link:hover {{ color: var(--orange); }}

    /* ── EMPTY ── */
    .empty {{
      grid-column: 1/-1; text-align: center;
      padding: 5rem 2rem; color: var(--muted);
    }}
    .empty h3 {{ color: var(--ink); font-size: 1.1rem; margin-bottom: .4rem; }}

    /* ── MODAL ── */
    .overlay {{
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 400; display: flex; align-items: center; justify-content: center;
      padding: 1rem; backdrop-filter: blur(4px);
    }}
    .overlay.hidden {{ display: none; }}
    .modal {{
      background: var(--surface); border-radius: 12px;
      width: 100%; max-width: 660px; max-height: 84vh;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,.3);
      border: 1px solid var(--line);
    }}
    .modal-hdr {{
      padding: 1.1rem 1.4rem;
      border-bottom: 1px solid var(--line);
      display: flex; align-items: center; justify-content: space-between;
    }}
    .modal-hdr h2 {{ font-size: 1rem; font-weight: 700; }}
    .modal-close {{
      width: 28px; height: 28px; border: none; background: none; cursor: pointer;
      color: var(--muted); font-size: 1.1rem; border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
    }}
    .modal-close:hover {{ background: var(--line); }}
    .modal-body {{ flex: 1; overflow-y: auto; padding: 1.1rem 1.4rem; }}
    .modal-hint {{ font-size: .78rem; color: var(--muted); margin-bottom: .75rem; }}
    .nl-output {{
      font-family: var(--sans); font-size: .76rem; line-height: 1.65;
      color: var(--ink-soft); white-space: pre-wrap;
      background: var(--bg); padding: 1rem; border-radius: 7px;
      border: 1px solid var(--line); max-height: 50vh; overflow-y: auto;
    }}
    .modal-foot {{
      padding: .85rem 1.4rem; border-top: 1px solid var(--line);
      display: flex; gap: .5rem; justify-content: flex-end;
    }}
    .btn {{
      padding: .38rem .9rem; border-radius: 5px; font-size: .78rem;
      font-weight: 700; border: none; cursor: pointer; font-family: var(--sans);
    }}
    .btn-primary {{ background: var(--orange); color: #fff; }}
    .btn-primary:hover {{ background: var(--orange-dk); }}
    .btn-sec {{ background: var(--line); color: var(--ink); }}
    .btn-sec:hover {{ filter: brightness(.93); }}

    .toast {{
      position: fixed; bottom: 1.2rem; right: 1.2rem;
      background: var(--ink); color: var(--bg);
      padding: .6rem 1rem; border-radius: 6px; font-size: .77rem; font-weight: 600;
      z-index: 500; opacity: 0; transform: translateY(8px);
      transition: all .2s; pointer-events: none;
    }}
    .toast.show {{ opacity: 1; transform: translateY(0); }}
  </style>
</head>
<body>

<header class="hdr">
  <div class="hdr-left"></div>
  <a class="hdr-logo" href="https://californiacurated.com">
    <img src="/californiacuratedtoplogo.jpg" alt="California Curated">
  </a>
  <div class="hdr-right">
    <button class="theme-btn" onclick="toggleTheme()" id="themeBtn" title="Toggle dark mode">
      <span id="themeIcon">☽</span>
    </button>
  </div>
</header>

<nav class="filter-bar">
  <button class="tab tab-all active" data-cat="ALL" onclick="setCat(this)">All Stories</button>
  {cat_tabs}
</nav>

<div class="banner">
  <img src="/science-banner.png" alt="California landscapes">
  <div class="banner-inner">
    <p class="banner-text">Science and Nature news from California</p>
  </div>
</div>

<div class="controls">
  <div class="count-label" id="storyCount"><strong>—</strong> stories</div>
  <div class="time-pills">
    <button class="time-pill" onclick="setTime('all',this)">All time</button>
    <button class="time-pill active" onclick="setTime('30d',this)">30 days</button>
    <button class="time-pill" onclick="setTime('7d',this)">7 days</button>
    <button class="time-pill" onclick="setTime('24h',this)">24 hours</button>
    <select class="src-select" id="srcSelect" onchange="render()">
      <option value="">All sources</option>
    </select>
  </div>
  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input class="search-input" id="searchInput" type="search" placeholder="Search stories…" oninput="render()">
  </div>
</div>

<div class="feed" id="feed"></div>

<div class="overlay hidden" id="overlay" onclick="if(event.target===this)closeNL()">
  <div class="modal">
    <div class="modal-hdr">
      <h2>Newsletter Export — Substack Ready</h2>
      <button class="modal-close" onclick="closeNL()">✕</button>
    </div>
    <div class="modal-body">
      <p class="modal-hint">Copy and paste directly into Substack. Reflects your current filters.</p>
      <div class="nl-output" id="nlOut"></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-sec" onclick="closeNL()">Close</button>
      <button class="btn btn-primary" onclick="copyNL()">Copy to Clipboard</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const CAT_COLORS = {json.dumps(CAT_COLORS)};
const ALL_ARTICLES = {articles_json};

let activeCat  = 'ALL';
let activeTime = '30d';

function filtered() {{
  let arts = [...ALL_ARTICLES];
  if (activeTime !== 'all') {{
    const now = Date.now() / 1000;
    const secs = activeTime === '24h' ? 86400 : activeTime === '7d' ? 604800 : 2592000;
    arts = arts.filter(a => (now - a.dateTs) < secs);
  }}
  if (activeCat !== 'ALL') arts = arts.filter(a => a.category === activeCat);
  const src = document.getElementById('srcSelect')?.value;
  if (src) arts = arts.filter(a => a.source === src);
  const q = document.getElementById('searchInput')?.value?.toLowerCase();
  if (q) arts = arts.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q) || a.source.toLowerCase().includes(q));
  return arts;
}}

function filterBySource(name) {{
  const sel = document.getElementById('srcSelect');
  sel.value = name;
  render();
}}

function setCat(btn) {{
  activeCat = btn.dataset.cat;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}}

function setTime(t, btn) {{
  activeTime = t;
  document.querySelectorAll('.time-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}}

function render() {{
  const arts = filtered();
  document.getElementById('storyCount').innerHTML =
    '<strong>' + arts.length + '</strong> ' + (arts.length === 1 ? 'story' : 'stories');
  const el = document.getElementById('feed');
  if (!arts.length) {{
    el.innerHTML = '<div class="empty"><h3>No stories found</h3><p>Try a wider time range or different filter.</p></div>';
    return;
  }}
  el.innerHTML = arts.map((a, i) => card(a, i === 0)).join('');
}}

function card(a, lead) {{
  const color = CAT_COLORS[a.category] || '#888';
  const catShort = a.category.split(' &')[0].split(' /')[0];
  const desc = a.desc.length > (lead ? 280 : 160) ? a.desc.slice(0, lead ? 280 : 160) + '…' : a.desc;
  return `<article class="card${{lead ? ' lead' : ''}}">
    <div class="card-inner">
      <div class="card-eyebrow">
        <span class="cat-pill" style="background:${{color}}">${{catShort}}</span>
        <button class="card-source" onclick="filterBySource('${{a.source.replace(/'/g,"\\'")}}'">${{a.source}}</button>
      </div>
      <div class="card-title"><a href="${{a.link}}" target="_blank" rel="noopener">${{a.title}}</a></div>
      ${{desc ? `<p class="card-desc">${{desc}}</p>` : ''}}
    </div>
    <div class="card-foot">
      <span class="card-date">${{a.dateLabel}}</span>
      <span class="card-region">${{a.region}}</span>
      <a href="${{a.link}}" target="_blank" rel="noopener" class="read-link">Read →</a>
    </div>
  </article>`;
}}

function openNL() {{
  const arts = filtered().slice(0, 24);
  const dt = new Date().toLocaleDateString('en-US', {{weekday:'long',year:'numeric',month:'long',day:'numeric'}});
  const groups = {{}};
  arts.forEach(a => {{ if (!groups[a.category]) groups[a.category]=[]; groups[a.category].push(a); }});
  let out = 'CALIFORNIA SCIENCE FEED\\nA California Curated Briefing — ' + dt + '\\n' + '━'.repeat(52) + '\\n\\n';
  for (const [cat, items] of Object.entries(groups)) {{
    out += '◆ ' + cat.toUpperCase() + '\\n' + '─'.repeat(40) + '\\n\\n';
    items.forEach(a => {{
      out += a.title + '\\n' + a.source + ' · ' + a.region + ' · ' + a.dateLabel + '\\n';
      if (a.desc) out += a.desc + '\\n';
      out += '🔗 ' + a.link + '\\n\\n';
    }});
  }}
  out += '━'.repeat(52) + '\\nCalifornia Curated · californiacurated.com';
  document.getElementById('nlOut').textContent = out;
  document.getElementById('overlay').classList.remove('hidden');
}}
function closeNL() {{ document.getElementById('overlay').classList.add('hidden'); }}
async function copyNL() {{
  try {{
    await navigator.clipboard.writeText(document.getElementById('nlOut').textContent);
    toast('Copied ✓');
  }} catch(e) {{ toast('Select all and copy manually'); }}
}}

function toggleTheme() {{
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cc_theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀' : '☽';
}}

function toast(msg) {{
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}}

(function init() {{
  const saved = localStorage.getItem('cc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeIcon').textContent = saved === 'dark' ? '☀' : '☽';

  const sources = [...new Set(ALL_ARTICLES.map(a => a.source))].sort();
  const sel = document.getElementById('srcSelect');
  sources.forEach(s => {{
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  }});

  render();
}})();
</script>
</body>
</html>'''


def main():
    print('┌─────────────────────────────────────────────────┐')
    print('│  California Science Feed v2 — Editorial Layout  │')
    print('└─────────────────────────────────────────────────┘')
    print(f'Fetching from {len(SOURCES)} sources...\n')

    all_articles = []
    ok_sources, fail_sources = [], []

    for src in SOURCES:
        print(f'  Fetching {src["name"]}...', end=' ', flush=True)
        data = fetch_source(src)
        if not isinstance(data, list):
            fail_sources.append(src['name'])
            continue
        if data:
            print(f'✅ {len(data)} stories')
            ok_sources.append(src['name'])
            all_articles.extend(data)
        else:
            fail_sources.append(src['name'])

    seen = set()
    unique = []
    for a in all_articles:
        if a['id'] not in seen:
            seen.add(a['id'])
            unique.append(a)

    SOURCE_PRIORITY = [
        'baynature','biographic','hcn','inaturalist',
        'mbari','scripps','lbl','pointblue','mba','redwoods',
        'ucb','caltech','stanford','ucla',
        'nhmlac','sdnhm','healthebay','audubon',
        'usc','uci','ucr','ucsc','sfsu',
        'calmatters','latimes',
        'nasa','jpl','usgs','noaafish',
        'sciday','nature',
    ]
    by_src = {}
    for a in unique:
        sid = a.get('sourceId', a['source'])
        if sid not in by_src: by_src[sid] = []
        by_src[sid].append(a)
    for q in by_src.values():
        q.sort(key=lambda a: a['dateTs'], reverse=True)

    ordered_queues = []
    seen_sids = set()
    for sid in SOURCE_PRIORITY:
        if sid in by_src:
            ordered_queues.append(by_src[sid])
            seen_sids.add(sid)
    for sid, q in by_src.items():
        if sid not in seen_sids:
            ordered_queues.append(q)

    unique = []
    while any(ordered_queues):
        for q in ordered_queues:
            if q: unique.append(q.pop(0))

    print(f'\n{"─"*50}')
    print(f'✅ {len(ok_sources)} sources  |  ❌ {len(fail_sources)} failed  |  {len(unique)} stories')
    print(f'{"─"*50}\n')

    html_out = build_html(unique, ok_sources, fail_sources)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html_out)

    print(f'Saved: {OUTPUT_FILE}')
    import subprocess
    subprocess.run(['open', 'https://californiacurated.com/science-feed/'], check=False)
    print('Opening live site in browser...')

if __name__ == '__main__':
    main()
