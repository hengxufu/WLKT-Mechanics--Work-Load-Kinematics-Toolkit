"""Validate real web JSON under the explicit unverified-model user exception.
Does not forge the installed receiver's GPT-6 model requirement or provenance.
"""
import sys,json,re,hashlib
from pathlib import Path
sys.path.append(r'C:\ProgramData\Anaconda3\Lib\site-packages')
skill=Path(r'C:\Users\21797\.codex\skills\chinese-research-ppt\POWERPOINT_CREATOR')
sys.path.insert(0,str(skill/'scripts'))
from receive_web_plan import validate
import jsonschema
ws=Path(__file__).absolute().parents[1]
raw=(ws/'planning/assistant-reply.txt').read_text(encoding='utf8').strip()
m=re.fullmatch(r'```(?:json)?\s*([\s\S]*?)\s*```',raw)
plan=validate(json.loads(m.group(1) if m else raw))
for slide in plan['slides']:
 slide['evidence']=[{'source_ref':x} if isinstance(x,str) else x for x in slide.get('evidence',[])]
jsonschema.validate(plan,json.loads((ws/'planning/deck_plan.schema.json').read_text(encoding='utf-8-sig')))
(ws/'planning/deck_plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf8')
provenance={'status':'actual_web_reply_validated_under_user_model_exception','observed_model':'unverified / High','session_url':'https://chatgpt.com/c/6acb21ae-4768-83ee-be28-8aa97bceb01e','response_file':'assistant-reply.txt','response_sha256':hashlib.sha256(raw.encode()).hexdigest(),'local_normalizations':['evidence string -> object with source_ref; raw reply unchanged'],'user_instruction':'允许用当前网页版完成规划和单元素生成，注明模型名未核验','installed_receiver_limit':'Requires literal observed GPT-6 label; not bypassed or falsely marked pass','schema_valid':True,'content_boxes_valid':True,'layout_families':list(dict.fromkeys(s['layout_family'] for s in plan['slides']))}
(ws/'planning/provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'slides':len(plan['slides']),'layouts':provenance['layout_families'],'assets':[(s['slide_number'],s['asset_requests']) for s in plan['slides'] if s['asset_requests']]},ensure_ascii=False))
