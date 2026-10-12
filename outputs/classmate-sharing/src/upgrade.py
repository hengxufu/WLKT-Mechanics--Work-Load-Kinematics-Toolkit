from pathlib import Path
r=Path(__file__).resolve().parent
t=(r/'build.cjs').read_text(encoding='utf-8')
t=t.replace("'拉压弯扭大师_同学分享.pptx'","'拉压弯扭大师_同学分享_视觉增强版.pptx'").replace("'讲稿与现场演示.md'","'讲稿与现场演示_增强版.md'")
t=t.replace("ink:'142E37',teal:'008B83',mint:'DDF2EB',paper:'F6F8F7',gray:'52666C',line:'C7D7D7',amber:'E5A44A'","ink:'202C47',teal:'285C75',mint:'DDEAE2',paper:'ECEEF5',gray:'536278',line:'B8C5D0',amber:'C6834D'")
start=t.index('function base(');end=t.index('function note(',start)
t=t[:start]+'''function motif(s,x,y,w,h,dark=false){
 const a=dark?'3E6276':'D5DEE2',b=dark?'78B8AC':'A7C6C0';
 for(let j=0;j<7;j++){for(let i=0;i<20;i++){let u=i/19;let yy=y+h*.5+Math.sin(u*5+j*.24)*h*(.12+j*.045);if(i)line(s,x+(i-1)*w/19,y+h*.5+Math.sin((i-1)/19*5+j*.24)*h*(.12+j*.045),x+i*w/19,yy,a,.6);}}
 for(let i=0;i<12;i++){let u=i/11; s.addShape(p.ShapeType.ellipse,{x:x+u*w,y:y+h*.5+Math.sin(u*5)*h*.12,w:.035,h:.035,fill:{color:b},line:{color:b},objectName:`motif-node-${++seq}`});}
}
function base(n,title,kicker='软件分享'){let s=p.addSlide();s.background={color:n%2?'F3F4F7':'F7F5EF'};
 rect(s,0,0,13.333,.58,C.ink);tx(s,`MECHANICS  /  拉压弯扭大师`,.55,.16,7,.25,10,'DBE5ED',true);tx(s,kicker,10.05,.16,2.7,.25,10,'B7D2CF',true);
 rect(s,.55,.92,.075,.61,C.amber);tx(s,title,.8,.87,11.95,.75,28,C.ink,true);
 motif(s,10.45,1.55,2.25,.3);line(s,.55,6.98,12.78,6.98,C.line,.6);tx(s,'材料力学学习辅助软件 · v2.0.2   /   同学分享',.55,7.12,10,.18,9,C.gray);tx(s,String(n).padStart(2,'0'),12.2,7.08,.6,.25,11,C.teal,true);return s;}
''' + t[end:]
start=t.index('function card(');end=t.index('function beam(',start)
t=t[:start]+'''let cardN=0;
function card(s,x,y,w,h,no,title,body){const k=cardN++%3,acc=['285C75','557969','8B6381'][k],fills=['E7EDF2','E4ECE5','EDE6ED'];rect(s,x,y,w,h,fills[k]);rect(s,x,y,.045,h,acc);tx(s,no,x+.22,y+.2,w-.44,.3,12,acc,true);line(s,x+.22,y+.68,x+w-.22,y+.68,'C0CDD2',.7);tx(s,title,x+.22,y+.86,w-.44,.5,22,C.ink,true);tx(s,body,x+.22,y+1.57,w-.44,h-1.7,16,C.gray);}
''' + t[end:]
reps={
'支座限制了哪些自由度？\\n荷载方向、单位是否正确？':'支座限制了哪些自由度？\\n荷载方向、单位是否正确？\\n\\n先辨认边界条件\\n再把题目转为结构模型',
'剪力为什么出现跳变？\\n弯矩最大值在哪里？':'剪力为什么出现跳变？\\n弯矩最大值在哪里？\\n\\n沿构件观察内力分布\\n把图形与受力关系对应',
'数值是否满足平衡？\\n能否和手算相互印证？':'数值是否满足平衡？\\n能否和手算相互印证？\\n\\n检查反力、峰值与单位\\n定位模型或理解上的偏差',
'节点、杆件、材料\\n截面、支座与荷载':'节点、杆件、材料、截面\\n支座、节点与单元荷载\\n集中力矩 / 梯形 / 温度',
'支反力、内力与变形\\n二维梁 / 刚架分析':'支反力、N / V / M 与变形\\n杆端力与结果数据表\\n从整体响应定位危险位置',
'公式库与分步推导\\n典型案例对照验证':'公式库、字母表达式\\n分步推导与典型题模板\\n用解析解检验数值结果',
'明确拉压、弯曲或扭转\\n识别需要的计算量':'轴向应力、弯曲应力\\n扭转剪应力、组合变形\\n\\n明确已知量与目标量\\n再选择对应的公式模板',
'材料与截面参数\\n单位、符号和适用条件':'E / G：材料刚度\\nA / I / J：截面参数\\n\\n逐项核对单位与符号\\n确认公式的模型假设',
'查看公式与分步过程\\n把数值放回力学意义':'字母表达式 → 参数代入\\n分步推导 → 结果解释\\n\\n结合变形与危险截面\\n比较手算与软件的口径',
'整理节点、构件与约束':'Vue 3 / TypeScript\\n节点、构件、材料与约束\\n统一二维 / 三维工作区',
'本地 CPU / Worker':'本地 CPU / Worker\\n空间杆系后台计算\\n不可用时回退主线程 CPU',
'内力、变形与数据表':'内力、变形与数据表\\nThree.js 空间显示\\n结果与教学解释对应',
'二维梁 / 刚架\\n空间桁架 / 刚架\\n公式库与分步推导':'二维梁 / 刚架与内力图\\n空间桁架 / 刚架与杆端力\\n公式库、字母计算与推导\\nWindows / PWA 离线使用',
'先确认单位与约束\\n结合解析解校核\\n用于学习与教学辅助':'先确认单位、方向与约束\\n用平衡关系和解析解校核\\n仅用于学习、教学与训练\\n不用于工程鉴定或商业用途',
'从熟悉的简支梁开始\\n先看使用指导':'帮助 → 使用指导与默认案例\\n选择 2D 简支梁或 3D 刚架\\n确认单位、材料、截面与荷载',
'调整荷载大小或位置\\n预测结果如何变化':'只改荷载大小、位置或截面\\n先预测反力与变形变化\\n再求解并与预测对照',
'哪一步不直观？\\n哪里与手算不一致？':'描述不清楚的操作步骤\\n附模型、单位与结果截图\\n指出与手算不一致的位置',
'三维建模与空间观察\\n节点位移、反力与杆端力\\n2D / 3D / 分屏显示':'三维建模：空间桁架 / 刚架\\n响应结果：位移、反力与杆端力\\n自由度：空间刚架节点六自由度\\n视图模式：2D / 3D / 同步分屏',
}
for a,b in reps.items():t=t.replace(a,b)
t=t.replace('...p.defineSlideMaster?{}:{},','')
# Replace simple cover with a layered native engineering illustration.
a=t.index('let s=p.addSlide();',t.index('function beam('));b=t.index('note(s,1,',a)
t=t[:a]+'''let s=p.addSlide();s.background={color:'15263C'};
rect(s,0,0,.17,7.5,C.amber);rect(s,8.6,0,4.73,7.5,'1C3448');
for(let i=0;i<16;i++){line(s,8.75+i*.28,.7,8.75+i*.28,6.7,'2B465B',.5);}for(let i=0;i<20;i++)line(s,8.7,.7+i*.3,13,.7+i*.3,'2B465B',.5);
for(let k=0;k<4;k++)s.addShape(p.ShapeType.ellipse,{x:9.1+k*.2,y:2.13+k*.18,w:3.28-k*.4,h:3.28-k*.36,fill:{color:'1C3448',transparency:100},line:{color:k%2?'6F9D97':'48728A',width:.7},rotate:28,objectName:`cover-orbit-${k}`});
for(let i=0;i<35;i++){let u=i/34,xx=8.9+u*3.9,y1=3.65+Math.sin(u*Math.PI*3)*.78,y2=3.65-Math.sin(u*Math.PI*3)*.78;line(s,xx,y1,xx,y2,i%3?'619D98':'DCA36C',.7);if(i){let v=(i-1)/34;line(s,8.9+v*3.9,3.65+Math.sin(v*Math.PI*3)*.78,xx,y1,'B1DED0',2);line(s,8.9+v*3.9,3.65-Math.sin(v*Math.PI*3)*.78,xx,y2,'DCA36C',1.4);}}
tx(s,'受力 / 形变 / 解释',9.12,5.9,3.8,.4,17,'A3C6C6',true);
s.addImage({path:path.join(root,'public/app-icon.png'),x:.7,y:.62,w:.58,h:.58,objectName:'product-icon'});tx(s,'MATERIAL MECHANICS  /  SOFTWARE',1.5,.75,6.7,.25,13,'91BABE');
tx(s,'拉压弯扭大师',.75,2.08,8.1,.9,42,C.white,true);tx(s,'让材料力学看得见',.78,3.21,7.8,.65,31,'C4DFD0',true);tx(s,'从题目到模型，从计算到理解',.8,4.25,7.4,.45,23,'DBE5ED');
const tags=['二维杆系','空间分析','公式推导'];tags.forEach((v,i)=>{rect(s,.8+i*2.42,5.42,2.15,.55,'284354');tx(s,v,1.02+i*2.42,5.56,1.8,.25,15,'C2DAD8',true)});tx(s,'同学软件分享  ·  v2.0.2  ·  本地离线',.8,6.72,7,.3,14,'9FB7C6');
''' + t[b:]
# Add page-specific microstructure in the gaps, never over original evidence.
t=t.replace("tx(s,'操作顺序：", "tx(s,'先检查：单位制  /  自由度约束  /  载荷方向  /  截面与材料',.78,5.88,11.7,.25,14,C.gray);tx(s,'操作顺序：")
t=t.replace("tx(s,'模型树',.78", "for(let gx=3.6;gx<9.9;gx+=.42)line(s,gx,2.95,gx,5.08,'C5D8CD',.45);for(let gy=3;gy<5.1;gy+=.36)line(s,3.6,gy,9.9,gy,'C5D8CD',.45);tx(s,'模型树',.78")
t=t.replace("line(s,2.2,5.7,5.4,4.6,C.ink,6);", "for(let q=0;q<8;q++){let z=q*.28;line(s,1.2+z,5.75-z*.32,5.75+z,6.45-z*.32,'CBD5DE',.7);line(s,1.2+z*.6,5.75+z*.17,5.2+z*.6,4.42+z*.17,'CBD5DE',.7);}line(s,5.4,4.6,7.75,4.6,'9A7390',1.2,true);line(s,5.4,4.6,4.35,5.3,'557969',1.2,true);tx(s,'X',7.7,4.7,.3,.3,12,'9A7390');tx(s,'Y',4.03,5.17,.3,.3,12,'557969');tx(s,'Z',5.55,2.65,.3,.3,12,C.teal);line(s,2.2,5.7,5.4,4.6,C.ink,6);")
t=t.replace("tx(s,'弯矩幅值示意',", "tx(s,'剪力示意',.85,4.05,1.6,.3,13,C.gray);line(s,2.5,4.25,7.3,4.25,'BAC6CE',.7);line(s,2.5,4.03,4.9,4.03,'557969',2);line(s,4.9,4.03,4.9,4.48,'557969',2);line(s,4.9,4.48,7.3,4.48,'557969',2);tx(s,'+9',3.35,3.67,1,.25,12,'557969');tx(s,'−9 kN',6,4.48,1.3,.23,12,'557969');tx(s,'弯矩幅值示意',")
t=t.replace("tx(s,'仓库文档中的历史界面示例：", "tx(s,'看图顺序：外荷载 → 支反力 → 变形趋势 → 内力与危险位置',.65,6.02,12,.28,17,C.teal,true);tx(s,'仓库文档中的历史界面示例：")
t=t.replace("tx(s,'先问同学：", "rect(s,.8,5.58,7.7,.42,C.mint);tx(s,'节点 A：0 m    /    跨中：3 m    /    节点 B：6 m',1,5.67,7.3,.23,15,C.teal,true);tx(s,'先问同学：")
t=t.replace("tx(s,'空间杆系示意',1.2,6.3,6,.4,14,C.gray);", "tx(s,'默认案例：三段正交 Q235 空间悬臂刚架',.8,6.2,7.2,.32,16,C.teal,true);tx(s,'节点六自由度  ·  三向力与扭矩  ·  空间杆系示意',.8,6.6,7.3,.22,12,C.gray);")
# Native sensitivity chart and capability table, two optional discussion slides.
insert='''
s=base(13,'只改一个参数，观察结构响应如何变化','拓展讨论 · 解析实验');
tx(s,'实验 A / 改变集中力位置',.7,1.9,7,.4,21,C.teal,true);
const positions=[1,2,3],ra=[15,12,9],rb=[3,6,9],mm=[15,24,27];
for(let i=0;i<3;i++){let yy=2.65+i*1.03;tx(s,`a = ${positions[i]} m`,.75,yy,1.7,.32,16,C.ink,true);rect(s,2.35,yy,.24*ra[i],.23,'557969');rect(s,2.35,yy+.3,.24*rb[i],.23,'C6834D');tx(s,`A ${ra[i]} / B ${rb[i]} kN`,6.12,yy+.07,2.4,.4,16,C.gray);}
tx(s,'A 支反力',2.35,5.95,2,.3,14,'557969',true);tx(s,'B 支反力',4.4,5.95,2,.3,14,'A16A3E',true);
rect(s,8.8,2.05,4,4.45,C.mint);tx(s,'同一个模型，两种观察',9.05,2.33,3.5,.5,22,C.teal,true);tx(s,'位置 a：1 → 2 → 3 m\\n弯矩峰值：15 → 24 → 27 kN·m\\n\\n实验 B / 保持位置不变\\n将集中力从18增至36 kN\\n在线弹性假设下响应成比例',9.05,3.1,3.5,2.75,17,C.gray);tx(s,'以上为6m简支梁解析预测，未代替软件实际验证。',.7,6.64,12,.22,11,C.gray);
note(s,13,'【选讲60秒】解析实验：集中力距左支座a，左反力为P乘(L-a)除以L，右反力为Pa除以L，荷载处峰值为Pa(L-a)/L。用18千牛和6米代入三组数据。柱条是可编辑形状，只表达反力，非实测。在线弹性、模型不变的条件下，荷载加倍后位移与内力成比例。');
s=base(14,'功能地图：按学习目标选择入口','附录 · 快速查找');
const rows=[
 [{text:'学习目标',options:{bold:true}},{text:'软件入口 / 能力',options:{bold:true}},{text:'重点观察',options:{bold:true}},{text:'先检查什么',options:{bold:true}}],
 ['理解受力与内力','二维梁 / 刚架分析','反力、N / V / M、变形','单位、约束、构件连接'],
 ['回顾材料力学公式','公式库 / 字母计算','应力、挠度、扭转角','参数含义与模型假设'],
 ['分析多种作用组合','组合变形计算','正应力、剪应力与安全系数','强度准则与材料参数'],
 ['认识空间结构响应','空间桁架 / 刚架','位移、反力、轴力 / 杆端力','分析维度与局部坐标'],
 ['理解解题过程','教学助手 / 典型题模板','分步推导与危险位置','推导适用范围和符号']
];
s.addTable(rows,{x:.6,y:2.12,w:12.15,h:3.7,colW:[2.3,3.05,3.55,3.25],rowH:.62,fontFace:'Microsoft YaHei',fontSize:16,color:C.ink,border:{type:'solid',color:'C9D3DE',pt:.65},fill:'E9EDF2',margin:.15,autoPage:false,objectName:'capability-map-table'});
rect(s,.6,6.08,12.15,.55,C.ink);tx(s,'推荐学习路径：熟悉的题 → 预测 → 建模 → 求解 → 校核 → 改一个参数再观察',.85,6.22,11.7,.25,17,'DDEAE2',true);note(s,14,'【备查】这页功能地图用于回答同学的提问，按学习目标推荐入口。组合计算需满足材料模型与公式假设；空间桁架和空间刚架的结果覆盖不同，不把所有结果混为一谈。');
'''
t=t.replace('p.writeFile({fileName:',insert+'\np.writeFile({fileName:')
t=t.replace('建议时长10分钟。','正文12页建议10—12分钟；第13—14页为选讲与备查。')
(r/'build-v2.cjs').write_text(t,encoding='utf-8')
