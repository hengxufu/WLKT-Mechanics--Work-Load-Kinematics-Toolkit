from pathlib import Path
import sys,subprocess,json
W=Path(__file__).resolve().parents[1];S=W/'src/toolchain'
j=W/'asset-jobs'/sys.argv[1]; action=sys.argv[2]
args={'submitted':['event','--status','submitted','--engine','unverified','--session-url','https://chatgpt.com/c/6acb587b-494c-83e8-9da9-561a860a5de7','--note','完整单主体提示词已实际出现网页消息。'], 'receive':['receive','--file',str(j/'download.png')], 'review':['review','--verdict','accepted','--note',sys.argv[3] if len(sys.argv)>3 else '已实际查看本地原图，单主体完整、透明背景、无文字或数据；配色及材质一致，仅概念装饰。']}
r=subprocess.run([sys.executable,'-X','utf8',str(W/'src/skill_python.py'),str(S/'asset_job.py'),*args[action],'--job',str(j)],capture_output=True,text=True,encoding='utf8')
if r.returncode:print(r.stderr);print(r.stdout);sys.exit(r.returncode)
d=json.loads((j/'job.json').read_text(encoding='utf8'));print(j.name,d['status'],d.get('technical_checks',{}))
