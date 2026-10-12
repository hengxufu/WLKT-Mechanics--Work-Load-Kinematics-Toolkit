from pathlib import Path
import json,sys,hashlib,zipfile
from pptx import Presentation

deck=Path(sys.argv[1]); out=Path(sys.argv[2]); prs=Presentation(deck)
pages=[]
for n,s in enumerate(prs.slides,1):
    objects=[]
    for index,sh in enumerate(s.shapes):
        objects.append({'object_name':sh.name,'kind':str(sh.shape_type),'public_chrome':(sh.name.endswith(('/title','/sources')) if n==4 else index<14),
                        'box_inches':[round(v/914400,4) for v in (sh.left,sh.top,sh.width,sh.height)],
                        'text':sh.text if sh.has_text_frame else None})
    content=[o for o in objects if not o['public_chrome']]
    assert len(content)>=15,(n,len(content))
    assert len({o['object_name'] for o in objects})==len(objects),(n,'duplicate names')
    pages.append({'slide_number':n,'total_objects':len(objects),'excluded_common_objects':len(objects)-len(content),
                  'body_objects':len(content),'objects':objects})
with zipfile.ZipFile(deck) as z:
    charts=[f for f in z.namelist() if f.startswith('ppt/charts/chart') and f.endswith('.xml')]
    workbooks=[f for f in z.namelist() if f.startswith('ppt/embeddings/') and f.endswith('.xlsx')]
result={'pptx_sha256':hashlib.sha256(deck.read_bytes()).hexdigest(),
        'counting_rule':'One independently selectable shape/picture/text/table/chart counts once. Common canvas/navigation/title/footer/source objects excluded (14 on regular pages; title and source on full native route page); table cells and chart points are not separately counted. No hidden padding objects.',
        'minimum_body_objects':min(p['body_objects'] for p in pages),'native_chart_parts':len(charts),
        'embedded_workbooks':len(workbooks),'pages':pages}
out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'minimum_body_objects':result['minimum_body_objects'],'total':[p['total_objects'] for p in pages],'body':[p['body_objects'] for p in pages],'charts':len(charts),'workbooks':len(workbooks)},ensure_ascii=False))
