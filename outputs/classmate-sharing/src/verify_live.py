from pathlib import Path
import zipfile,hashlib,json,datetime
r=Path(__file__).resolve().parents[1]
deck=r/'拉压弯扭大师_同学分享_实机截图版.pptx'
with zipfile.ZipFile(deck) as z:
 media={hashlib.sha256(z.read(n)).hexdigest():n for n in z.namelist() if n.startswith('ppt/media/')}
files=[]
for f in (r/'assets/live').glob('*'):
 if f.suffix.lower() not in ('.jpg','.png'):continue
 h=hashlib.sha256(f.read_bytes()).hexdigest()
 files.append({'file':f.name,'sha256':h,'ppt_media':media.get(h),'captured_or_derived_time':datetime.datetime.fromtimestamp(f.stat().st_mtime).isoformat()})
data={'run':'local existing dist build at 127.0.0.1:4173','ui_version':'2.0','package_version':'2.0.2','two_dimensional':{'case':'6m simply supported beam, interior concentrated load 18kN at3m','nodes':2,'elements':1,'status':'二维求解完成','reaction_magnitudes_kN':[9,9],'moment_graph_kNm':-27,'derivation_summary_moment_magnitude_kNm':27},'three_dimensional':{'case':'default Q235 spatial frame','nodes':4,'elements':3,'DOF':24,'status':'求解结果OK','backend_display':'WebGPU数值内核尚未完成，本次使用Worker CPU高精度求解','displacement_visual_scale':2.4},'limits':['Existing browser offline build was run, not installed Electron exe.','Some icon glyphs show boxes in the capture browser.','One default 2D case was compared with analytic magnitudes; not an exhaustive solver audit.'],'assets':files}
(r/'qa/live-run-evidence.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'integrated_screenshot_assets':sum(bool(f['ppt_media']) for f in files),'deck_bytes':deck.stat().st_size}))
