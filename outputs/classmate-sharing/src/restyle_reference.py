from pathlib import Path
r=Path(__file__).resolve().parent;t=(r/'build-v3.cjs').read_text(encoding='utf-8')
t=t.replace("ink:'202C47',teal:'285C75',mint:'DDEAE2',paper:'ECEEF5',gray:'536278',line:'B8C5D0',amber:'C6834D'","ink:'183F60',teal:'0062B3',mint:'EBF5FF',paper:'EDF6FE',gray:'3D6080',line:'C8DFF3',amber:'0062B3'")
a=t.index('function base(');b=t.index('function note(',a)
t=t[:a]+'''const conclusions=['','从题目到模型，从计算到理解','把受力分析、结果观察与独立校核连接起来','四类力学问题，共享建模—求解—解释的学习路径','模型树、视图区、属性面板共同组织操作','由内力图的形状与峰值，理解荷载传递规律','核对跨度、荷载位置、自由度与单位','解析幅值与实机读数对应，符号按软件约定','结合平衡关系与边界条件，理解计算依据','空间杆系本地求解，结果与显示放大分别解读','建模、计算与结果展示在本地完成','明确能力边界，保持独立检查','从熟悉的默认案例开始，带着问题体验','只改变一个参数，先预测再观察','按学习目标选择入口，形成完整学习过程'];
function nav(s,n){rect(s,0,0,13.333,.78,'075FAF');rect(s,0,.78,13.333,.045,'90B8DE');const labels=['1 学习背景','2 软件功能','3 实机演示','4 交流展望'];let active=n<=2?0:n<=3?1:n<=10?2:3;
labels.forEach((v,i)=>tx(s,v,.35+i*2.37,.17,2.3,.41,23,i===active?'FFFFFF':'B8D8F1',i===active));s.addImage({path:path.join(root,'public/app-icon.png'),x:10.12,y:.1,w:.54,h:.54,objectName:'nav-app-icon'});tx(s,'拉压弯扭大师',10.8,.14,2.3,.3,19,'FFFFFF',true);tx(s,'MECHANICS STUDIO',10.8,.49,2.3,.16,8,'D2E7FA');}
function bottom(s,n){rect(s,0,6.98,13.333,.52,'1B5283');tx(s,conclusions[n]||'让材料力学看得见',.4,7.08,12.25,.32,20,'FFFFFF',true);tx(s,String(n).padStart(2,'0'),12.74,7.13,.35,.22,10,'D5E7F6');}
function base(n,title,kicker='软件分享'){let s=p.addSlide();s.background={color:'FFFFFF'};nav(s,n);tx(s,title,.35,1.02,12.62,.64,27,C.ink,true);bottom(s,n);return s;}
function round(s,x,y,w,h,fill=C.paper){s.addShape(p.ShapeType.roundRect,{x,y,w,h,radius:.2,rectRadius:.2,fill:{color:fill},line:{color:C.line,width:.8},objectName:`rounded-panel-${++seq}`});}
''' +t[b:]
a=t.index('function card(');b=t.index('function shot(',a)
t=t[:a]+'''function card(s,x,y,w,h,no,title,body){const k=cardN++%3;round(s,x,y,w,h);s.addShape(p.ShapeType.ellipse,{x:x+.16,y:y+.17,w:.36,h:.36,fill:{color:C.teal},line:{color:C.teal},objectName:`number-${++seq}`});tx(s,String(k+1),x+.265,y+.21,.2,.23,14,'FFFFFF',true);tx(s,title,x+.64,y+.18,w-.81,.48,22,C.teal,true);tx(s,body,x+.25,y+1.08,w-.5,h-1.3,18,C.ink);}
''' +t[b:]
a=t.index('function side(');b=t.index('function beam(',a)
t=t[:a]+'''function side(s,x,y,w,num,title,body){round(s,x-.12,y-.08,w+.24,4.62);s.addShape(p.ShapeType.ellipse,{x:x+.04,y:y+.12,w:.34,h:.34,fill:{color:C.teal},line:{color:C.teal},objectName:`side-number-${++seq}`});tx(s,num.split(' / ')[0],x+.04,y+.17,.34,.2,10,'FFFFFF',true);tx(s,title,x+.12,y+.72,w-.24,.6,21,C.teal,true);tx(s,body,x+.12,y+1.57,w-.24,2.35,17,C.ink);}
''' +t[b:]
# Replace the dark cover while retaining native objects and the genuine screenshot.
a=t.index('let s=p.addSlide();',t.index('function beam('));b=t.index('note(s,1,',a)
t=t[:a]+'''let s=p.addSlide();s.background={color:'FFFFFF'};nav(s,1);bottom(s,1);
tx(s,'拉压弯扭大师',.55,1.78,7,.94,43,C.teal,true);tx(s,'让材料力学看得见',.58,2.94,7,.66,31,C.ink,true);tx(s,'同学软件分享  /  本地离线学习工作台',.6,3.9,7,.44,21,C.gray);
round(s,8.1,1.6,4.7,4.84);shot(s,'moment-detail.png',8.33,2.5,4.24,2.39,'默认简支梁弯矩结果');tx(s,'建模 · 求解 · 推导 · 校核',8.42,5.43,4.1,.43,19,C.teal,true);
const tags=['二维杆系','空间分析','公式推导'];tags.forEach((v,i)=>{round(s,.6+i*2.35,5.06,2.12,.64);tx(s,v,.8+i*2.35,5.23,1.74,.3,19,C.teal,true)});tx(s,'v2.0.2  ·  从一根梁开始，理解结构响应',.6,6.14,7.1,.37,17,C.gray);
''' +t[b:]
# Representative three-column page follows the reference's principles/evidence/chain layout.
a=t.index('s=base(3,');b=t.index('s=base(4,',a)
t=t[:a]+'''s=base(3,'统一学习路径：力学知识、交互观察与计算链路','软件功能');
round(s,.35,1.92,4.02,4.83);round(s,4.57,1.92,4.03,4.83);round(s,8.8,1.92,4.18,4.83);
[['1','力学知识',.5],['2','交互观察',4.72],['3','计算链路',8.95]].forEach(([n,label,x])=>{s.addShape(p.ShapeType.ellipse,{x,y:2.08,w:.35,h:.35,fill:{color:C.teal},line:{color:C.teal},objectName:`column-num-${++seq}`});tx(s,n,x+.11,2.12,.18,.22,14,'FFFFFF',true);tx(s,label,x+.48,2.08,3.2,.4,22,C.teal,true)});
const topics=[['拉伸 / 压缩','轴力、轴向应力与变形'],['弯曲','剪力、弯矩、挠度与危险位置'],['扭转 / 组合变形','剪应力、扭转角与强度评价']];topics.forEach((v,i)=>{tx(s,v[0],.62,2.92+i*1.13,3.45,.4,21,C.teal,true);tx(s,v[1],.62,3.43+i*1.13,3.45,.4,16,C.ink)});
shot(s,'moment-detail.png',4.79,2.85,3.59,2.02,'简支梁真实弯矩视图');tx(s,'改变荷载与约束\\n观察反力、内力和变形\\n把图形对应到力学意义',4.88,5.15,3.42,1.1,19,C.ink);
const chain=['节点 / 构件 / 材料 / 截面','约束、荷载与单位检查','本地求解与结果显示','公式推导与危险位置','解析对照与参数实验'];chain.forEach((v,i)=>{round(s,9.07,2.74+i*.75,3.63,.59,'FFFFFF');tx(s,v,9.24,2.89+i*.75,3.3,.29,17,C.ink,true);if(i<4)line(s,10.88,3.35+i*.75,10.88,3.48+i*.75,C.teal,1,true)});note(s,3,'【50秒】本页按照参考图的三栏结构呈现：左边是力学知识，中间为真实软件弯矩截图，右边是原生可编辑计算链路。不同模块的覆盖范围不同，不能把功能地图解释为所有工况都自动贯通。');
''' +t[b:]
# Bring remaining accents into the same blue family.
for a,b in [('557969','0062B3'),('A16A3E','4E8BC4'),('C6834D','79AFDB'),('E9EDF2','EDF6FE'),('C9D3DE','C8DFF3')]:t=t.replace(a,b)
t=t.replace('拉压弯扭大师_同学分享_实机截图版.pptx','拉压弯扭大师_同学分享_蓝白参考风格版.pptx').replace('讲稿与现场演示_实机版.md','讲稿与现场演示_蓝白版.md')
(r/'build-v4.cjs').write_text(t,encoding='utf-8')
