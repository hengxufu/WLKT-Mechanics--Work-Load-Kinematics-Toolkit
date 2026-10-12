from pathlib import Path
import json,sys,subprocess
W=Path(__file__).resolve().parents[1]
S=Path('C:/Users/21797/.codex/skills/chinese-research-ppt/POWERPOINT_CREATOR/scripts')
web=json.loads((W/'planning/visual-assistant-reply.txt').read_text(encoding='utf8'))
assert len(web['pages'])==18 and len(web['additional_assets'])==10
plan=json.loads((W/'planning/deck_plan.json').read_text(encoding='utf8'))
plan['design_system']=web['visual_system']
for q in plan['slides']:
 q['asset_requests']=[]
 v=web['pages'][q['slide_number']-1]
 q['visual_rationale']=v['layout']
 q['speaker_notes']+='\n视觉与内容增强：'+v['content']
 q['content_blocks'].append({'text':v['content'],'source_ref':'planning/visual-assistant-reply.txt（设计建议，经本地事实核对）'})
queue=[]
for i,a in enumerate(web['additional_assets'],1):
 a['kind']='ornament' if i==10 else 'icon' if i in [6,8,9] else 'concept'
 spec={'asset_id':a['asset_id'],'kind':a['kind'],'slide_id':f"S{a['page']:02}",'object_id':f'web-rich-{i:02}','element':a['element']+'。'+a['purpose'],'palette':'蓝银金属、青色高光、极少量橙色反射','style':'高级精密工程三维产品摄影；柔和左上棚拍光，精细拉丝金属边缘，单一独立完整主体','transparent':True,'min_width':1024,'min_height':1024,'aspect':'1:1','visual_context':{'slide_background':'纯白与浅冰蓝','avoid':'不画页面、数字、公式、其他独立物体、支座、受力箭头、数据结果'}}
 d=W/f'asset-jobs/R{i:02}'
 f=W/f'planning/spec-R{i:02}.json'; f.write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf8')
 subprocess.run([sys.executable,str(W/'src/skill_python.py'),str(S/'asset_job.py'),'prepare','--spec',str(f),'--job',str(d)],check=True)
 request={'request_id':f'R{i:02}','kind':a['kind'],'purpose':a['purpose'],'single_subject_prompt':spec['element'],'decision':'generate_web','object_id':spec['object_id']}
 plan['slides'][a['page']-1]['asset_requests'].append(request)
 queue.append({'id':f'R{i:02}','page':a['page'],'object_id':spec['object_id'],'job':str(d)})
(W/'planning/deck_plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf8')
(W/'planning/queue.json').write_text(json.dumps(queue,ensure_ascii=False,indent=2),encoding='utf8')
print('10 independent jobs prepared; web advice preserved, unsupported kinds normalized and facts retained.')
