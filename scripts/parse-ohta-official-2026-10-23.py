import json,re,hashlib,sys
from pathlib import Path
from collect_kalininsky_helpers import Tree,Node
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/ohta-official-2026-10-23'
def plain(n):
    if isinstance(n,str):return n
    if n.tag in ['script','style','template']:return ''
    if n.tag=='br':return '\n'
    s=''.join(plain(c) for c in n.children)
    return s+('\n' if n.tag in ['p','div','li','h1','h2','h3','ul','ol'] else '')
def lines(n):return [re.sub(r'\s+',' ',s).strip().replace('\ufeff','') for s in plain(n).splitlines() if s.strip().strip('\ufeff')]
def cls(n,c):return c in n.attrs.get('class','').split()
def parse(slug):
    d=json.loads((OUT/('browser-'+slug+'.json')).read_text(encoding='utf-8'));t=Tree();t.feed(d['html']);nodes=list(t.root.all());idx={n.attrs['id']:n for n in nodes if n.attrs.get('id')};records=[n for n in nodes if cls(n,'t-rec')]
    tabs=[]
    for n in nodes:
        if n.tag=='li' and n.attrs.get('data-tab-rec-ids'):
            button=next(n.all('button'),None)
            tabs.append(dict(label=(button or n).text(' ').strip(),ids=['rec'+v.strip().removeprefix('rec') for v in n.attrs['data-tab-rec-ids'].split(',') if v.strip()]))
    if not tabs:tabs=[dict(label=n.text(' ').strip(),ids=n.attrs['aria-controls'].split(',')) for n in nodes if n.attrs.get('role')=='tab' and n.attrs.get('aria-controls')]
    for tab in tabs:
        missing=[rid for rid in tab['ids'] if rid not in idx]
        if missing:tab['obsoleteRecordReferences']=missing
        tab['ids']=[rid for rid in tab['ids'] if rid in idx]
    source=dict(url=d['url'],title=d['title'],transport='browser_dom',sha256=hashlib.sha256(d['html'].encode()).hexdigest(),sourceFile=str((OUT/('browser-'+slug+'.json')).relative_to(ROOT)).replace('\\','/'),text=lines(t.root),tabs=tabs)
    if slug.endswith('_schedule'):
        source['days']=[]
        for tab in tabs:
            sections=[]
            for rid in tab['ids']:
                n=idx.get(rid.strip())
                if not n:raise ValueError('No tab record '+rid)
                left=[x for x in n.all() if cls(x,'t521__leftcol')];right=[x for x in n.all() if cls(x,'t521__rightcol')]
                if len(left)!=len(right):raise ValueError('Room mismatch '+slug)
                if left: sections.extend(dict(room=' '.join(lines(l)),lines=lines(r),recordId=rid) for l,r in zip(left,right))
                elif lines(n): sections.append(dict(room='',lines=lines(n),recordId=rid,review='Не стандартный блок комнат'))
            source['days'].append(dict(day=tab['label'],sections=sections))
        source['headings']=[n.text(' ') for n in nodes if n.tag in ['h1','h2']]
    else:
        source['freeActivities']=[];source['paidActivities']=[]
        for tab in tabs:
            mode='freeActivities' if 'Бесплатные' in tab['label'] else 'paidActivities' if 'Платные' in tab['label'] else None
            if not mode:continue
            for rid in tab['ids']:
                n=idx[rid.strip()];li=[x for x in n.all('li') if not list(x.all('li'))]
                source[mode].extend(x.text(' ').strip().rstrip('; .') for x in li)
                if not li:source[mode].extend(lines(n))
        if not tabs:
            for n in records:
                if n.attrs.get('data-record-type')=='1033':
                    source['freeActivities'].extend(x.text(' ').strip().rstrip('; .') for x in n.all('li') if not list(x.all('li')))
        source['recordSummary']=[dict(id=n.attrs.get('id'),type=n.attrs.get('data-record-type'),text=lines(n)[:3]) for n in records if n.attrs.get('data-record-type') not in ['257','674','131']]
        source['vkLinks']=[l for l in d['links'] if re.search(r'https://vk\.(com|ru)/',l['url'])]
        source['schedulePaths']=[m for b in d.get('buttons',[]) for m in re.findall(r"'(/[^']+_schedule)'",b['action'])]
    return source
result=dict(date='2026-10-23',clubs=[],schedules=[],other=[])
for f in sorted(OUT.glob('browser-*.json')):
    slug=f.stem.removeprefix('browser-');p=parse(slug)
    result['schedules' if slug.endswith('_schedule') else 'other' if slug in ['contacts','announcements'] else 'clubs'].append(dict(slug=slug,**p))
(ROOT/'data/research/ohta-structured-source-2026-10-23.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(clubs=len(result['clubs']),schedules=len(result['schedules']),days=sum(len(s['days']) for s in result['schedules']),rooms=sum(len(d['sections']) for s in result['schedules'] for d in s['days'])),ensure_ascii=False))
