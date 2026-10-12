from pathlib import Path
W=Path(__file__).resolve().parents[1]
p=W/'src/build.cjs';s=p.read_text(encoding='utf8')
s=s.replace("label(s,1,'每节点：3 平移 + 3 转动',6.12,2.0,6.4)","label(s,1,'每节点六自由度',6.12,2.1,3.8)").replace("y=2.9+Math.floor(i/3)*.9","y=3.45+Math.floor(i/3)*.73")
s=s.replace("tag(s,v,.72+i*4.15,1.75,3.8)","tag(s,v,.72+i*4.15,1.86,3.8)")
s=s.replace("x:.7,y:2.57,w:5.65,h:3.55","x:.7,y:2.95,w:5.65,h:3.12").replace(".75,2.0,5.5,.4,22,C.blue,true);t(s,'弯矩峰值幅值 / kN·m',6.95,2.0",".75,2.4,5.5,.4,22,C.blue,true);t(s,'弯矩峰值幅值 / kN·m',6.95,2.4")
# Shield and cube are title-area concept icons; reserve room for them.
s=s.replace("plan.title,.45,.98,12.4,.62,28","plan.title,.45,.98,11.2,.62,28")
p.write_text(s,encoding='utf8')
print('Reserved independent asset slots; chart annotations separated from titles.')
