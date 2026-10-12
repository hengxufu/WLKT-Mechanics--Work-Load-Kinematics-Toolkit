import sys,json,zipfile,re
from pathlib import Path
ws=Path(__file__).absolute().parents[1]
source=ws/'build/deck-native.pptx'
# PptxGenJS table metadata may reuse a shape id; make each slide id unique.
with zipfile.ZipFile(source) as z: parts={n:z.read(n) for n in z.namelist()}
for n,b in list(parts.items()):
 if re.fullmatch(r'ppt/slides/slide\d+\.xml',n):
  text=b.decode();seen=set();nextid=[max(map(int,re.findall(r'<p:cNvPr[^>]*\bid="(\d+)"',text)))+1]
  def unique(m):
   val=m.group(2)
   if val in seen:val=str(nextid[0]);nextid[0]+=1
   seen.add(val);return m.group(1)+val+m.group(3)
  parts[n]=re.sub(r'(<p:cNvPr[^>]*\bid=")(\d+)(")',unique,text).encode()
with zipfile.ZipFile(ws/'build/deck-native-clean.pptx','w',zipfile.ZIP_DEFLATED) as z:
 for n,b in parts.items():z.writestr(n,b)
elements=[]
for key,num,kind in [('REQ01',1,'concept'),('REQ03',3,'concept'),('REQ16',16,'ornament')]:
 elements.append({'request_id':key,'slide_number':num,'kind':kind,'job_dir':'../asset-jobs/queue-v1/'+key})
(ws/'assets/asset_manifest.json').write_text(json.dumps({'schema':'ppt_element_manifest_v1','elements':elements},ensure_ascii=False,indent=2),encoding='utf8')
