import zipfile,re,json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
f=root/(sys.argv[1] if len(sys.argv)>1 else '拉压弯扭大师_同学分享.pptx')
with zipfile.ZipFile(f) as z: parts={n:z.read(n) for n in z.namelist()}
for n,b in list(parts.items()):
 if n.endswith('.xml') and n.startswith('ppt/'):
  t=b.decode('utf-8')
  t=re.sub(r'<a:latin typeface="[^"]*"', '<a:latin typeface="Times New Roman"',t)
  t=re.sub(r'<a:ea typeface="[^"]*"', '<a:ea typeface="Microsoft YaHei"',t)
  t=re.sub(r'<a:cs typeface="[^"]*"', '<a:cs typeface="Times New Roman"',t)
  def explicit_run(m):
   inner=m.group(1)
   fonts='<a:latin typeface="Times New Roman"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Times New Roman"/>'
   if '<a:rPr' not in inner:inner='<a:rPr>'+fonts+'</a:rPr>'+inner
   elif re.search(r'<a:rPr\b[^>]*/>',inner):inner=re.sub(r'<a:rPr\b([^>]*)/>',lambda q:'<a:rPr'+q.group(1)+'>'+fonts+'</a:rPr>',inner,count=1)
   else:
    extra=''.join(v for tag,v in [('latin','<a:latin typeface="Times New Roman"/>'),('ea','<a:ea typeface="Microsoft YaHei"/>'),('cs','<a:cs typeface="Times New Roman"/>')] if '<a:'+tag+' ' not in inner)
    inner=inner.replace('</a:rPr>',extra+'</a:rPr>',1)
   return '<a:r>'+inner+'</a:r>'
  t=re.sub(r'<a:r>(.*?)</a:r>',explicit_run,t,flags=re.S)
  t=re.sub(r'(<a:fld\b[^>]*>)(.*?)(</a:fld>)',lambda q:q.group(1)+re.sub(r'<a:r>(.*?)</a:r>',explicit_run,'<a:r>'+q.group(2)+'</a:r>',flags=re.S)[5:-6]+q.group(3),t,flags=re.S)
  if n.startswith('ppt/slides/slide'):
   seen=set(); next_id=[max([int(v) for v in re.findall(r'<p:cNvPr\b[^>]*\bid="(\d+)"',t)]+[1])+1]
   def unique_id(m):
    v=m.group(2)
    if v in seen:v=str(next_id[0]);next_id[0]+=1
    seen.add(v);return m.group(1)+v+m.group(3)
   t=re.sub(r'(<p:cNvPr\b[^>]*\bid=")(\d+)(")',unique_id,t)
  parts[n]=t.encode('utf-8')
with zipfile.ZipFile(f,'w',zipfile.ZIP_DEFLATED) as z:
 for n,b in parts.items():z.writestr(n,b)
(root/'asset-manifest.json').write_text(json.dumps({'generated_assets':[],'reason':'采用真实仓库图与原生可编辑对象，未使用生成整页图。','source_assets':['public/app-icon.png','docs/public/simply_supported.png']},ensure_ascii=False,indent=2),encoding='utf-8')
