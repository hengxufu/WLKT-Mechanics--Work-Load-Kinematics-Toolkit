from pathlib import Path
p=Path(__file__).resolve().parent/'build.cjs';s=p.read_text(encoding='utf8')
s=s.replace("r(s,4.36,2.0,8.34,1.08);t(s,'4 节点  /  3 构件  /  24 总自由度',4.62,2.27,7.85,.52,27,C.blue,true);", "[['4','节点'],['3','构件'],['24','总自由度']].forEach((v,i)=>{let x=4.36+i*2.85;r(s,x,2.0,2.64,1.08);t(s,v[0],x+.18,2.16,1.04,.5,30,C.blue,true);t(s,v[1],x+1.27,2.43,1.25,.34,17,C.navy,true)});")
s=s.replace("t(s,'条件固定：P = 18 kN，L = 6 m；a 为距左支座的距离，取 1 / 2 / 3 m。',.75,6.26,12,.35,18,C.navy,true);", "[['固定荷载','P = 18 kN'],['固定跨度','L = 6 m'],['位置变量','a距左端：1 / 2 / 3 m']].forEach((v,i)=>{let x=.75+i*4.15;tag(s,v[0],x,6.24,1.2);t(s,v[1],x+1.34,6.3,2.63,.26,14,C.navy,true)});")
p.write_text(s,encoding='utf8')
print('Independent meaningful parameter modules added to sparse numerical pages.')
