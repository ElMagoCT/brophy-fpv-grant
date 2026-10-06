"""Emit the Google-Doc (HTML) version of the deck from index.html + SCRIPT.md.
Images are referenced by their public GitHub Pages URL so Docs can fetch them.
Usage: python3 tools/build-doc.py > slides/pitch-doc.html"""
import re, html, sys
BASE = 'https://elmagoct.github.io/brophy-fpv-grant/'
src = open('index.html', encoding='utf-8').read()
script = open('SCRIPT.md', encoding='utf-8').read()
notes = [p[p.index('\n')+1:].split('\n---')[0].strip() for p in re.split(r'^## ', script, flags=re.M)[1:]]
def strip(t):
    t = re.sub(r'<span class="why">(.*?)</span>', r' — why: \1', t, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t); return html.unescape(re.sub(r'\s+', ' ', t)).strip()
sections = re.findall(r'<section class="scene"([^>]*)>(.*?)</section>', src, flags=re.S)
out = ['<html><body style="font-family:Arial">']
out.append('<h1>Pilots before drones — FPV Club grant pitch (editable)</h1>')
out.append('<p><i>One heading per slide, in order. Edit the words; keep the "Slide N" headings so the HTML deck can be rebuilt from this. Text in [EDIT: …] in the speaker notes is where personal details go. Images here are the ones the HTML deck uses; a dashed note means that photo is still coming from the kiosk.</i></p>')
for i, (attrs, body) in enumerate(sections):
    title = re.search(r'data-title="([^"]+)"', attrs).group(1)
    out.append(f'<h2>Slide {i+1} — {html.escape(title)}</h2>')
    m = re.search(r'<div class="eyebrow">(.*?)</div>', body, flags=re.S)
    if m and strip(m.group(1)): out.append(f'<p><b>Label:</b> {html.escape(strip(m.group(1)))}</p>')
    h = re.search(r'<h[12][^>]*>(.*?)</h[12]>', body, flags=re.S)
    if h: out.append(f'<p><b>Headline:</b> {html.escape(strip(h.group(1)))}</p>')
    sub = re.findall(r'<p class="(?:hero-sub|note)[^"]*"[^>]*>(.*?)</p>', body, flags=re.S)
    for ssub in sub: out.append(f'<p>{html.escape(strip(ssub))}</p>')
    st = re.search(r'<span class="stamp">(.*?)</span>', body)
    if st: out.append(f'<p><b>Stamp:</b> {html.escape(strip(st.group(1)))}</p>')
    lis = re.findall(r'<li[^>]*>(.*?)</li>', body, flags=re.S)
    if lis: out.append('<ul>' + ''.join(f'<li>{html.escape(strip(l))}</li>' for l in lis) + '</ul>')
    for cls in ('card', 'g', 'stat'):
        for c in re.findall(rf'<div class="{cls}(?: frag)?"[^>]*>(.*?)</div>\s*(?=<div class="{cls}|</div>)', body, flags=re.S):
            k = re.search(r'class="k">(.*?)</div>', c, flags=re.S); t = re.search(r'<h4>(.*?)</h4>', c, flags=re.S); ptxt = re.search(r'<p>(.*?)</p>', c, flags=re.S)
            bits = [strip(x.group(1)) for x in (k, t, ptxt) if x]
            inner = re.findall(r'<li>(.*?)</li>', c, flags=re.S)
            if cls == 'stat':
                v = re.search(r'class="v">(.*?)</div>', c, flags=re.S); l = re.search(r'class="l">(.*?)</div>', c, flags=re.S)
                if v and l: out.append(f'<p><b>Stat:</b> {html.escape(strip(v.group(1)))} — {html.escape(strip(l.group(1)))}</p>')
            elif bits: out.append('<p><b>Card:</b> ' + ' · '.join(html.escape(b) for b in bits) + (('<ul>' + ''.join(f'<li>{html.escape(strip(x))}</li>' for x in inner) + '</ul>') if inner else '') + '</p>')
    for img in re.findall(r'<img ([^>]*)>', body):
        srcm = re.search(r'src="([^"]+)"', img); ph = re.search(r'data-photo="([^"]+)"', img); alt = re.search(r'alt="([^"]*)"', img); lab = re.search(r'data-label="([^"]*)"', img)
        if srcm and not srcm.group(1).startswith('assets/qr'):
            out.append(f'<p><img src="{BASE}{srcm.group(1)}" width="420"><br><i>{html.escape(alt.group(1) if alt else "")}</i></p>')
        elif ph:
            out.append(f'<p style="border:1px dashed #888;padding:6px"><i>[Photo coming from the kiosk: {html.escape(lab.group(1) if lab else "")} — {html.escape(ph.group(1))}]</i></p>')
    qrs = re.findall(r'<div class="qr[^"]*">.*?<div class="t">(.*?)</div>(?:<div class="u">(.*?)</div>)?', body, flags=re.S)
    if qrs: out.append('<p><b>QR codes:</b> ' + '; '.join(html.escape(strip(a)) + (f' ({html.escape(strip(b))})' if b else '') for a, b in qrs) + '</p>')
    if i < len(notes):
        out.append('<h3>Speaker notes</h3>')
        for para in notes[i].split('\n\n'):
            para = para.strip()
            if not para: continue
            if para.startswith('> '): out.append(f'<p style="color:#1c5578"><b>▶ {html.escape(para[2:])}</b></p>')
            else:
                t = html.escape(para); t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t); t = re.sub(r'\[EDIT:(.*?)\]', r'<span style="background:#ffe9a8">[EDIT:\1]</span>', t); t = re.sub(r'^_(.*)_$', r'<i>\1</i>', t)
                out.append(f'<p>{t}</p>')
out.append('</body></html>')
sys.stdout.write('\n'.join(out))
