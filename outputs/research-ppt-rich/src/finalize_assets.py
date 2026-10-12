from pathlib import Path
import json,sys,subprocess,zipfile
from lxml import etree as E
W=Path(__file__).resolve().parents[1]; S=W/'src/toolchain'
boxes=[(.9,2.8,2.35,1.17),(4.02,2.8,2.35,1.17),(7.14,2.8,2.35,1.17),(10.26,2.8,2.35,1.17),(10.2,2.12,2.4,1.25),(5.55,2.65,2.1,1.65),(11.6,.88,1.1,.72),(11.7,1.88,.75,.75),(11.72,.89,.9,.75),(8.05,5.55,4.1,.9)]
items=json.loads((W/'planning/queue.json').read_text(encoding='utf8'));manifest={'schema':'ppt_element_manifest_v1','elements':[]}
for a,box in zip(items,boxes):
 j=W/'asset-jobs'/a['id']; d=json.loads((j/'job.json').read_text(encoding='utf8')); assert d['status'] in {'accepted','integrated'},(a['id'],d['status'])
 r=subprocess.run([sys.executable,'-X','utf8',str(W/'src/skill_python.py'),str(S/'asset_job.py'),'placement','--job',str(j),'--box',*map(str,box),'--min-ppi','180'],capture_output=True,text=True,encoding='utf8');assert r.returncode==0,r.stdout+r.stderr
 manifest['elements'].append({'request_id':a['id'],'slide_number':a['page'],'kind':d['spec']['kind'],'job_dir':'../asset-jobs/'+a['id']})
(W/'assets/asset_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
with zipfile.ZipFile(W/'build/deck-native.pptx') as src,zipfile.ZipFile(W/'build/deck-native-clean.pptx','w',zipfile.ZIP_DEFLATED) as dst:
 for f in src.infolist():
  data=src.read(f.filename)
  if f.filename.startswith('ppt/slides/slide') and f.filename.endswith('.xml'):
   root=E.fromstring(data)
   for i,e in enumerate(root.xpath('//*[local-name()="cNvPr"]'),1):e.set('id',str(i))
   data=E.tostring(root,xml_declaration=True,encoding='UTF-8',standalone=True)
  dst.writestr(f,data)
print('10 independent placements and clean object IDs prepared.')
