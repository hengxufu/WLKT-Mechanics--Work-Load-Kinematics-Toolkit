const pptxgen=require('pptxgenjs'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(__dirname,'..');
const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='拉压弯扭大师';p.title='拉压弯扭大师｜同学分享';p.subject='材料力学软件分享';p.lang='zh-CN';p.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
const C={ink:'183F60',teal:'0062B3',mint:'EBF5FF',paper:'EDF6FE',gray:'3D6080',line:'C8DFF3',amber:'0062B3',white:'FFFFFF'};let seq=0;const notes=[];
function tx(s,t,x,y,w,h,size=20,color=C.ink,bold=false){s.addText(t,{x,y,w,h,fontFace:'Microsoft YaHei',fontSize:size,color,bold,margin:0,breakLine:false,vertAlign:'mid',objectName:`text-${++seq}`});}
function rect(s,x,y,w,h,fill=C.paper){s.addShape(p.ShapeType.rect,{x,y,w,h,fill:{color:fill},line:{color:fill},objectName:`panel-${++seq}`});}
function line(s,x1,y1,x2,y2,color=C.teal,width=2,arrow=false){s.addShape(p.ShapeType.line,{x:Math.min(x1,x2),y:Math.min(y1,y2),w:Math.abs(x2-x1),h:Math.abs(y2-y1),flipV:y2<y1,flipH:x2<x1,line:{color,width,...(arrow?{endArrowType:'triangle'}:{})},objectName:`line-${++seq}`});}
function motif(s,x,y,w,h,dark=false){
 const a=dark?'3E6276':'D5DEE2',b=dark?'78B8AC':'A7C6C0';
 for(let j=0;j<7;j++){for(let i=0;i<20;i++){let u=i/19;let yy=y+h*.5+Math.sin(u*5+j*.24)*h*(.12+j*.045);if(i)line(s,x+(i-1)*w/19,y+h*.5+Math.sin((i-1)/19*5+j*.24)*h*(.12+j*.045),x+i*w/19,yy,a,.6);}}
 for(let i=0;i<12;i++){let u=i/11; s.addShape(p.ShapeType.ellipse,{x:x+u*w,y:y+h*.5+Math.sin(u*5)*h*.12,w:.035,h:.035,fill:{color:b},line:{color:b},objectName:`motif-node-${++seq}`});}
}
const conclusions=['','从题目到模型，从计算到理解','把受力分析、结果观察与独立校核连接起来','四类力学问题，共享建模—求解—解释的学习路径','模型树、视图区、属性面板共同组织操作','由内力图的形状与峰值，理解荷载传递规律','核对跨度、荷载位置、自由度与单位','解析幅值与实机读数对应，符号按软件约定','结合平衡关系与边界条件，理解计算依据','空间杆系本地求解，结果与显示放大分别解读','建模、计算与结果展示在本地完成','明确能力边界，保持独立检查','从熟悉的默认案例开始，带着问题体验','只改变一个参数，先预测再观察','按学习目标选择入口，形成完整学习过程'];
function nav(s,n){rect(s,0,0,13.333,.78,'075FAF');rect(s,0,.78,13.333,.045,'90B8DE');const labels=['1 学习背景','2 软件功能','3 实机演示','4 交流展望'];let active=n<=2?0:n<=3?1:n<=10?2:3;
labels.forEach((v,i)=>tx(s,v,.35+i*2.37,.17,2.3,.41,23,i===active?'FFFFFF':'B8D8F1',i===active));s.addImage({path:path.join(root,'public/app-icon.png'),x:10.12,y:.1,w:.54,h:.54,objectName:'nav-app-icon'});tx(s,'拉压弯扭大师',10.8,.14,2.3,.3,19,'FFFFFF',true);tx(s,'MECHANICS STUDIO',10.8,.49,2.3,.16,8,'D2E7FA');}
function bottom(s,n){rect(s,0,6.98,13.333,.52,'1B5283');tx(s,conclusions[n]||'让材料力学看得见',.4,7.08,12.25,.32,20,'FFFFFF',true);tx(s,String(n).padStart(2,'0'),12.74,7.13,.35,.22,10,'D5E7F6');}
function base(n,title,kicker='软件分享'){let s=p.addSlide();s.background={color:'FFFFFF'};nav(s,n);tx(s,title,.35,1.02,12.62,.64,27,C.ink,true);bottom(s,n);return s;}
function round(s,x,y,w,h,fill=C.paper){s.addShape(p.ShapeType.roundRect,{x,y,w,h,radius:.2,rectRadius:.2,fill:{color:fill},line:{color:C.line,width:.8},objectName:`rounded-panel-${++seq}`});}
function note(s,n,t){s.addNotes(t+'\n事实来源：README.md；docs/solver-capability-audit.md；docs/version-2.0-stage-1.md。');notes.push(`## ${n} ${t}\n`);}
let cardN=0;
function card(s,x,y,w,h,no,title,body){const k=cardN++%3;round(s,x,y,w,h);s.addShape(p.ShapeType.ellipse,{x:x+.16,y:y+.17,w:.36,h:.36,fill:{color:C.teal},line:{color:C.teal},objectName:`number-${++seq}`});tx(s,String(k+1),x+.265,y+.21,.2,.23,14,'FFFFFF',true);tx(s,title,x+.64,y+.18,w-.81,.48,22,C.teal,true);tx(s,body,x+.25,y+1.08,w-.5,h-1.3,18,C.ink);}
function shot(s,file,x,y,w,h,label){rect(s,x-.035,y-.035,w+.07,h+.07,'BCCBD4');s.addImage({path:path.join(out,'assets/live',file),x,y,w,h,objectName:`live-${file}`,altText:`本地程序运行截图：${label}`});}
function side(s,x,y,w,num,title,body){round(s,x-.12,y-.08,w+.24,4.62);s.addShape(p.ShapeType.ellipse,{x:x+.04,y:y+.12,w:.34,h:.34,fill:{color:C.teal},line:{color:C.teal},objectName:`side-number-${++seq}`});tx(s,num.split(' / ')[0],x+.04,y+.17,.34,.2,10,'FFFFFF',true);tx(s,title,x+.12,y+.72,w-.24,.6,21,C.teal,true);tx(s,body,x+.12,y+1.57,w-.24,2.35,17,C.ink);}
function beam(s,x,y,w,load=true){line(s,x,y,x+w,y,C.ink,6);s.addShape(p.ShapeType.triangle,{x:x-.18,y:y+.06,w:.36,h:.3,fill:{color:C.mint},line:{color:C.teal},objectName:`support-${++seq}`});s.addShape(p.ShapeType.triangle,{x:x+w-.18,y:y+.06,w:.36,h:.3,fill:{color:C.mint},line:{color:C.teal},objectName:`support-${++seq}`});if(load){line(s,x+w/2,y-1,x+w/2,y-.05,C.amber,3,true);tx(s,'18 kN',x+w/2+.15,y-.95,2,.4,19,C.ink,true);}tx(s,'A',x-.15,y+.5,.5,.35,16);tx(s,'B',x+w-.15,y+.5,.5,.35,16);}
let s=p.addSlide();s.background={color:'FFFFFF'};nav(s,1);bottom(s,1);
tx(s,'拉压弯扭大师',.55,1.78,7,.94,43,C.teal,true);tx(s,'让材料力学看得见',.58,2.94,7,.66,31,C.ink,true);tx(s,'同学软件分享  /  本地离线学习工作台',.6,3.9,7,.44,21,C.gray);
round(s,8.1,1.6,4.7,4.84);shot(s,'moment-detail.png',8.33,2.5,4.24,2.39,'默认简支梁弯矩结果');tx(s,'建模 · 求解 · 推导 · 校核',8.42,5.43,4.1,.43,19,C.teal,true);
const tags=['二维杆系','空间分析','公式推导'];tags.forEach((v,i)=>{round(s,.6+i*2.35,5.06,2.12,.64);tx(s,v,.8+i*2.35,5.23,1.74,.3,19,C.teal,true)});tx(s,'v2.0.2  ·  从一根梁开始，理解结构响应',.6,6.14,7.1,.37,17,C.gray);
note(s,1,'【25秒】今天分享我做的拉压弯扭大师。我们不先讲一串功能，而是从课堂里熟悉的一根梁开始，看看软件怎样帮助理解受力、内力和变形。');
s=base(2,'做完题之后，你能解释图为什么这样画吗？','从课堂问题出发');card(s,.55,2.1,3.88,3.5,'01','模型怎么建？','支座限制了哪些自由度？\n荷载方向、单位是否正确？\n\n先辨认边界条件\n再把题目转为结构模型');card(s,4.73,2.1,3.88,3.5,'02','内力怎么变？','剪力为什么出现跳变？\n弯矩最大值在哪里？\n\n沿构件观察内力分布\n把图形与受力关系对应');card(s,8.91,2.1,3.88,3.5,'03','答案怎么验？','数值是否满足平衡？\n能否和手算相互印证？\n\n检查反力、峰值与单位\n定位模型或理解上的偏差');tx(s,'我的目标：把“算出数值”进一步变成“理解结构”。',.65,6.15,12,.45,22,C.teal,true);note(s,2,'【45秒】请同学想一想：一道题得到答案后，能不能说清内力图形状？这里不是替大家定义共同痛点，而是用三个问题引出软件希望帮助的学习过程。');
s=base(3,'统一学习路径：力学知识、交互观察与计算链路','软件功能');
round(s,.35,1.92,4.02,4.83);round(s,4.57,1.92,4.03,4.83);round(s,8.8,1.92,4.18,4.83);
[['1','力学知识',.5],['2','交互观察',4.72],['3','计算链路',8.95]].forEach(([n,label,x])=>{s.addShape(p.ShapeType.ellipse,{x,y:2.08,w:.35,h:.35,fill:{color:C.teal},line:{color:C.teal},objectName:`column-num-${++seq}`});tx(s,n,x+.11,2.12,.18,.22,14,'FFFFFF',true);tx(s,label,x+.48,2.08,3.2,.4,22,C.teal,true)});
const topics=[['拉伸 / 压缩','轴力、轴向应力与变形'],['弯曲','剪力、弯矩、挠度与危险位置'],['扭转 / 组合变形','剪应力、扭转角与强度评价']];topics.forEach((v,i)=>{tx(s,v[0],.62,2.92+i*1.13,3.45,.4,21,C.teal,true);tx(s,v[1],.62,3.43+i*1.13,3.45,.4,16,C.ink)});
shot(s,'moment-detail.png',4.79,2.85,3.59,2.02,'简支梁真实弯矩视图');tx(s,'改变荷载与约束\n观察反力、内力和变形\n把图形对应到力学意义',4.88,5.15,3.42,1.1,19,C.ink);
const chain=['节点 / 构件 / 材料 / 截面','约束、荷载与单位检查','本地求解与结果显示','公式推导与危险位置','解析对照与参数实验'];chain.forEach((v,i)=>{round(s,9.07,2.74+i*.75,3.63,.59,'FFFFFF');tx(s,v,9.24,2.89+i*.75,3.3,.29,17,C.ink,true);if(i<4)line(s,10.88,3.35+i*.75,10.88,3.48+i*.75,C.teal,1,true)});note(s,3,'【50秒】本页按照参考图的三栏结构呈现：左边是力学知识，中间为真实软件弯矩截图，右边是原生可编辑计算链路。不同模块的覆盖范围不同，不能把功能地图解释为所有工况都自动贯通。');
s=base(4,'真实工作区：模型、视图、属性并排联动','实机 · 界面导航');
shot(s,'01-workspace.jpg',.62,1.98,8.6,4.84,'二维刚架工作区');
side(s,9.55,2.04,3.15,'01 / WORKSPACE','按对象组织操作','左侧：节点、构件与条件\n中部：受力与结果视图\n右侧：属性和显示开关\n\n先选对象，再检查参数\n底部状态栏反馈求解状态');
tx(s,'本地已有离线构建的实际运行画面；界面标识2.0，项目包版本2.0.2。',9.55,6.05,3.15,.72,12,C.gray);
note(s,4,'【50秒】这一页已替换为本地已有dist构建的真实运行截图。展示二维刚架而非默认简支梁。左模型树、中视图区、右属性栏均来自程序。当前截图环境的部分工具栏图标显示为方框，文字及结果可读，未修改截图伪装图标。');
s=base(5,'同一根梁，切换剪力图与弯矩图','实机 · 后处理');
shot(s,'shear-detail.png',.65,2.15,5.88,3.31,'简支梁剪力图局部');shot(s,'moment-detail.png',6.83,2.15,5.88,3.31,'简支梁弯矩图局部');
tx(s,'剪力 V / 左右段幅值 9 kN',.68,5.64,5.8,.4,21,'0062B3',true);tx(s,'弯矩 M / 跨中标注 −27 kN·m',6.86,5.64,5.8,.4,21,C.teal,true);
rect(s,.65,6.25,12.06,.47,C.mint);tx(s,'观察顺序：集中力位置 → 剪力跳变 → 弯矩峰值 → 对照解析解',.85,6.36,11.65,.25,17,C.teal,true);
note(s,5,'【55秒】两个局部截图来自同一个已求解的6米简支梁。先看剪力图两段的幅值，再看弯矩图跨中极值。保留实际坐标、荷载与符号，不把负号改成正号。原始全图和裁剪范围均保存。');
s=base(6,'默认案例如何组织：一个单元、跨中集中力','实机 · 建模检查');
shot(s,'beam-model.png',.65,2.05,6.5,4.63,'模型和剪力结果视口');
shot(s,'load-detail.png',7.47,2.05,2.78,2.3,'单元荷载属性');
tx(s,'模型结构',10.55,2.15,2.25,.45,20,C.teal,true);tx(s,'节点 A / B\n跨度 6 m\n单元 E1\n集中力位置 3 m',10.55,2.95,2.25,1.8,17,C.gray);
rect(s,7.47,4.72,5.31,1.94,C.paper);tx(s,'读题与读模型相互对应',7.69,4.93,4.87,.45,21,C.ink,true);tx(s,'A端约束2个自由度，B端约束1个自由度。\n本案例采用单元内集中力，无需增设跨中节点。\n荷载分量、单位和方向以程序属性栏为准。',7.69,5.56,4.87,.83,15,C.gray);
note(s,6,'【65秒】实际默认案例只有A、B两个节点和E1一个单元，集中力通过单元荷载施加在3米处。这纠正了之前采用跨中节点分段的通用演示说法。属性栏显示分量0、-1.800e4、0、3.000，说明负z分量18000N、位置3米。按程序坐标约定读方向，不通过截图外观擅自更改符号。');
s=base(7,'实机结果与解析解：先核对幅值，再核对符号','实机 · 结果校核');
shot(s,'moment-detail.png',.65,2.1,7.25,4.08,'含反力和弯矩峰值的局部');
rect(s,8.3,2.1,4.43,4.08,C.mint);tx(s,'本次界面读数',8.58,2.4,3.88,.45,24,C.teal,true);tx(s,'两端反力幅值各 9 kN\n弯矩图跨中标注 −27 kN·m',8.58,3.2,3.88,1.1,22,C.ink,true);tx(s,'解析幅值：18 × 6 ÷ 4 = 27\n与本次显示幅值一致\n\n弯矩符号遵循软件局部坐标约定',8.58,4.68,3.88,1.12,16,C.gray);
tx(s,'校核范围：此默认案例的显示幅值对照；不代表全部工况或整体精度认证。',.7,6.45,12,.3,13,C.gray);
note(s,7,'【65秒】本次确实运行了默认二维案例，状态为二维求解完成。图中两端反力幅值9和跨中弯矩-27清楚可读。解析弯矩幅值27与显示一致，负号按软件约定。单元结果表端弯矩为0并不矛盾，最大弯矩在单元内部。这里只完成该默认案例的界面数值对照，不宣称全软件计算验证。');
s=base(8,'教学助手：把图形、平衡关系与边界条件连接起来','实机 · 分步推导');
shot(s,'04-derivation.jpg',.65,2.05,7.45,4.19,'教学助手分步推导全界面');
side(s,8.48,2.05,4.2,'02 / EXPLAIN','推导入口就在结果旁','① 选择“教学助手”\n② 切换“分步推导”\n③ 查看平衡关系和符号约定\n④ 下滚检查边界与内力摘要');
tx(s,'演示时让同学先说明受力与约束，再借助助手核对。',.7,6.5,12,.3,17,C.teal,true);
note(s,8,'【55秒】截图已点击教学助手的分步推导，显示整体平衡、局部轴与内力关系。通过界面读取还看到了A端Dx/Dz约束、Ry自由，B端Dz约束、Dx/Ry自由，以及内力摘要9kN和27kNm。助手中“位移约束”计数0与下方支座自由度表是不同字段口径，不将该计数解释为没有支座。');
s=base(9,'空间刚架：真实三维变形与节点结果','实机 · 三维求解');
shot(s,'space-detail.png',.65,2.02,5.1,4.48,'空间刚架位移图层');shot(s,'space-table.png',6.02,2.02,3.46,4.45,'节点位移与杆件轴力表');
side(s,9.8,2.05,2.98,'03 / SPACE','已执行本地求解','4个节点、3个空间构件\nQ235 / 箱形截面\n节点六自由度\n\n位移图层：放大2.4倍\n结果属于空间杆系');
tx(s,'变形为放大显示，不能按截图像素读取真实位移；并非实体连续应力云图。',.7,6.63,12,.22,12,C.gray);
note(s,9,'【60秒】从帮助载入默认3D空间悬臂刚架，点击本地求解，求解结果OK。节点4、构件3、总DOF24。截图显示位移图层、自动2.4倍变形，并保留节点结果和杆件轴力表。当前显示不是实体应力云图。界面明确本次使用Worker CPU，GPU只是能力检测可用。');
s=base(10,'计算在本地，课堂演示更容易准备','实现思路');const steps=[['交互建模','Vue 3 / TypeScript\n节点、构件、材料与约束\n统一二维 / 三维工作区'],['数值求解','本地 CPU / Worker\n空间杆系后台计算\n不可用时回退主线程 CPU'],['结果展示','内力、变形与数据表\nThree.js 空间显示\n结果与教学解释对应']];steps.forEach((a,i)=>{card(s,.55+i*4.18,2.2,3.88,3.2,'0'+(i+1),a[0],a[1]);if(i<2)line(s,4.46+i*4.18,3.8,4.68+i*4.18,3.8,C.teal,2,true)});rect(s,.55,5.88,12.23,.65,C.mint);tx(s,'使用形态：Windows 桌面版  /  PWA 与离线静态版本',.8,6.03,11.7,.35,20,C.teal,true);note(s,10,'【45秒】技术上只介绍同学有感知的部分：模型输入后在本机求解，再展示结果。Worker帮助把部分计算放到后台。桌面版、PWA和离线静态分发是项目支持的使用形态，具体安装文件以实际提供的版本为准。不要宣称未经测试的性能提升。');
s=base(11,'介绍功能，也说明适用边界','当前状态');card(s,.55,2.1,3.88,3.8,'可用于学习','已经有的能力','二维梁 / 刚架与内力图\n空间桁架 / 刚架与杆端力\n公式库、字母计算与推导\nWindows / PWA 离线使用');card(s,4.73,2.1,3.88,3.8,'仍在探索','实验与未接入','Tet4 为实验模块\nWebGPU 仅设备检测\n实体连续应力云图未接入');card(s,8.91,2.1,3.88,3.8,'使用原则','独立检查模型','先确认单位、方向与约束\n用平衡关系和解析解校核\n仅用于学习、教学与训练\n不用于工程鉴定或商业用途');tx(s,'正式工程设计仍需经过相应验证与专业流程。',.65,6.3,12,.4,20,C.gray);note(s,11,'【55秒】这里主动讲清边界。实验模块不等于已经可用于成熟实体分析；检测到GPU不等于存在GPU求解内核。软件服务学习与教学，不能把课堂演示结果当作工程认证。');
s=base(12,'从默认案例开始，带着一个问题体验','实机 · 一起改进');
shot(s,'02-guide.jpg',.65,2.06,7.85,4.42,'使用指导与默认案例弹窗');
side(s,8.87,2.06,3.85,'START / FEEDBACK','推荐上手顺序','帮助 → 使用指导与默认案例\n2D简支梁 / 3D空间刚架\n确认条件 → 求解 → 校核\n\n反馈附上：模型、单位、截图\n说清哪一步不直观或不一致');
tx(s,'先预测，再操作，最后解释你看到的变化。',.7,6.63,12,.25,18,C.teal,true);
note(s,12,'【45秒】已用真实引导弹窗替换文字卡片。可随时从帮助打开指导，二维载入后自动求解，三维载入后点击本地求解。实际操作都发生在独立本地浏览器会话，未修改用户已有项目。');
s=base(13,'只改一个参数，观察结构响应如何变化','拓展讨论 · 解析实验');
tx(s,'实验 A / 改变集中力位置',.7,1.9,7,.4,21,C.teal,true);
const positions=[1,2,3],ra=[15,12,9],rb=[3,6,9],mm=[15,24,27];
for(let i=0;i<3;i++){let yy=2.65+i*1.03;tx(s,`a = ${positions[i]} m`,.75,yy,1.7,.32,16,C.ink,true);rect(s,2.35,yy,.24*ra[i],.23,'0062B3');rect(s,2.35,yy+.3,.24*rb[i],.23,'79AFDB');tx(s,`A ${ra[i]} / B ${rb[i]} kN`,6.12,yy+.07,2.4,.4,16,C.gray);}
tx(s,'A 支反力',2.35,5.95,2,.3,14,'0062B3',true);tx(s,'B 支反力',4.4,5.95,2,.3,14,'4E8BC4',true);
rect(s,8.8,2.05,4,4.45,C.mint);tx(s,'同一个模型，两种观察',9.05,2.33,3.5,.5,22,C.teal,true);tx(s,'位置 a：1 → 2 → 3 m\n弯矩峰值：15 → 24 → 27 kN·m\n\n实验 B / 保持位置不变\n将集中力从18增至36 kN\n在线弹性假设下响应成比例',9.05,3.1,3.5,2.75,17,C.gray);tx(s,'以上为6m简支梁解析预测，未代替软件实际验证。',.7,6.64,12,.22,11,C.gray);
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
s.addTable(rows,{x:.6,y:2.12,w:12.15,h:3.7,colW:[2.3,3.05,3.55,3.25],rowH:.62,fontFace:'Microsoft YaHei',fontSize:16,color:C.ink,border:{type:'solid',color:'C8DFF3',pt:.65},fill:'EDF6FE',margin:.15,autoPage:false,objectName:'capability-map-table'});
rect(s,.6,6.08,12.15,.55,C.ink);tx(s,'推荐学习路径：熟悉的题 → 预测 → 建模 → 求解 → 校核 → 改一个参数再观察',.85,6.22,11.7,.25,17,'DDEAE2',true);note(s,14,'【备查】这页功能地图用于回答同学的提问，按学习目标推荐入口。组合计算需满足材料模型与公式假设；空间桁架和空间刚架的结果覆盖不同，不把所有结果混为一谈。');

p.writeFile({fileName:path.join(out,'拉压弯扭大师_同学分享_蓝白参考风格版.pptx')});fs.writeFileSync(path.join(out,'讲稿与现场演示_蓝白版.md'),'# 拉压弯扭大师：同学分享讲稿\n\n正文12页建议10—12分钟；第13—14页为选讲与备查。第4—9、12页已加入实机截图；第6—7页适合切到软件现场演示。截图来自本地已有离线构建，不代表安装包界面的独立验收。\n\n'+notes.join('\n')+'\n## 演示前检查\n\n- 打开软件和默认案例，确认分辨率、单位与字体可读。\n- 保存一份6m简支梁、跨中18kN的模型；先自行核对反力和弯矩。\n- 把安装包或项目文件准备在本地，避免现场依赖网络。\n- PDF可作为字体或播放兼容性的备用。\n');
