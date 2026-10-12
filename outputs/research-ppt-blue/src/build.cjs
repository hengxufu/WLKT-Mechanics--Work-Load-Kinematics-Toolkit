const pptxgen=require('pptxgenjs'),fs=require('fs'),path=require('path');
const {toolkit,C}=require('./design.cjs');const out=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(out,'planning/deck_plan.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(out,'sources/native-data.json'),'utf8'));
const editDemo=process.argv.includes('--edit-demo');if(editDemo){plan.slides[0].title='拉压弯扭大师（编辑演示）';data.reaction_chart.series[0].values[0]=16;}
const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='拉压弯扭大师';p.title='拉压弯扭大师｜蓝色技术路线增强版';p.lang='zh-CN';p.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
p._editDemo=editDemo;const {text:t,panel:r,line:l,circle:c,tag,shot,base,label,table,beam,mini,id}=toolkit(p);
const {route,icon}=require('./route.cjs')(p,{text:t,panel:r,line:l,circle:c},C);
const rep=process.argv.includes('--representatives');let s;
for(const q of plan.slides){let n=q.slide_number;if(rep&&![1,4,8].includes(n))continue;if(n===4){route(q);continue;}s=base(q);if([2,5,6,7,9,10,15,16,17,18].includes(n))icon(s,n===2?'paper':n===9?'chart':n===17?'paper':n===18?'search':n===15?'cap':'cube',12.12,1.03,.42,C.blue);
switch(n){
case 1:
 t(s,'从力学概念',.65,2.02,7.0,.68,37,C.navy,true);t(s,'到可验证计算',.65,2.86,7.0,.76,40,C.blue,true);
 t(s,'本地离线材料力学学习软件',.69,3.88,6.7,.42,24,C.teal,true);
 ['模型：节点 / 材料 / 截面','响应：内力 / 变形 / 反力','解释：公式 / 推导 / 核验'].forEach((v,i)=>{l(s,.72,4.64+i*.43,.95,4.64+i*.43,C.orange,2);t(s,v,1.1,4.5+i*.43,5.8,.31,18,C.navy)});
 r(s,7.7,1.98,4.82,3.78,'DFEDF9');shot(s,'01-workspace.jpg',8.0,2.43,4.2,2.35,'cover-workspace');
 t(s,'真实工作区 · 二维 / 空间杆系',8.0,5.08,4.2,.3,16,C.blue,true);
 ['本地离线','v2.0.2','同学分享'].forEach((v,i)=>tag(s,v,.7+i*2.1,6.0,1.88));
 t(s,'概念飘带仅作装饰',9.85,6.58,2.5,.17,9,C.gray);break;
case 2:
 const probs=[['建模抽象','支座究竟约束什么？','节点 / 单元 / 自由度','检查：节点连接 / 支座自由度 / 荷载方向'],['符号难读','负弯矩是否表示错误？','局部坐标 / 正负约定','检查：局部坐标 / 图例符号 / 截面位置'],['可信度判断','求解完成就足够吗？','平衡关系 / 解析对照','检查：整体平衡 / 解析幅值 / 参数趋势']];
 probs.forEach((v,i)=>{let x=.65+i*4.15;r(s,x,2.05,3.85,3.45,i===1?'E1EFFA':C.pale);r(s,x,2.05,3.85,1.4,C.blue);icon(s,['paper','cube','search'][i],x+2.98,2.3,.42,'FFFFFF');t(s,'0'+(i+1),x+.2,2.27,1,.5,30,'FFFFFF',true);t(s,v[0],x+.2,2.99,3.42,.4,23,'FFFFFF',true);t(s,v[1],x+.2,3.62,3.42,.55,19,C.navy);l(s,x+.22,4.34,x+3.52,4.34,C.line,1);t(s,v[2],x+.2,4.61,3.42,.4,17,C.teal,true);t(s,v[3],x+.2,5.74,3.42,.67,16,C.blue,true)});
 t(s,'学习闭环：明确条件 → 离散建模 → 求解响应 → 解析核验 → 单参数实验；保留单位、方向与边界依据',.87,6.48,11.5,.25,15,C.gray);break;
case 3:
 const fields=[['拉伸','N → σ → ΔL','σ = N / A','ΔL = NL / (EA)','轴力与长度变化'],['压缩','N → σ → ΔL','σ = N / A','压缩取符号约定','短柱概念，非失稳分析'],['弯曲','V → M → σ、w','σmax = M / W','EI 控制挠度','关注危险截面位置'],['扭转','T → τ → φ','τmax = T / Wt','φ = TL / (GJ)','均匀圆轴、小变形']];
 fields.forEach((v,i)=>{let x=.65+i*3.12;r(s,x,2.04,2.85,4.57,i%2?'E8F3FC':C.pale);r(s,x,2.04,2.85,.65,C.blue);t(s,'0'+(i+1),x+.17,2.22,.55,.34,18,'FFFFFF',true);t(s,v[0],x+.9,2.21,1.7,.45,24,'FFFFFF',true);t(s,v[1],x+.16,4.1,2.53,.35,18,C.teal,true);t(s,v[2],x+.16,4.69,2.53,.4,21,C.navy);t(s,v[3],x+.16,5.36,2.53,.43,17,C.navy);l(s,x+.17,5.98,x+2.67,5.98,C.line,.8);t(s,v[4],x+.16,6.18,2.53,.28,12,C.gray)});break;
case 4:
 // A full native technical route with verification feedback, not three cards.
 [['题目 / 物理条件','单位、几何、受力'],['离散结构模型','节点、构件、材料'],['约束与荷载','自由度、等效作用'],['局部到整体','单元刚度、坐标变换'],['本地求解','位移、反力、端力']].forEach((v,i)=>{let x=.65+i*2.46;r(s,x,2.15,2.16,1.35,i===4?'D9EAF8':C.pale);t(s,String(i+1).padStart(2,'0'),x+.16,2.3,.55,.3,16,C.blue,true);t(s,v[0],x+.16,2.75,1.88,.35,18,C.navy,true);t(s,v[1],x+.12,3.19,1.95,.22,12,C.gray);if(i<4)l(s,x+2.18,2.82,x+2.43,2.82,C.blue,1.5,true)});
 l(s,11.55,3.52,11.55,4.1,C.blue,1.6,true);r(s,7.15,4.15,5.55,1.15);t(s,'结果解释与可视化',7.4,4.35,4.95,.33,22,C.blue,true);t(s,'N / V / M、变形、结果表与教学推导',7.4,4.89,4.95,.24,15,C.gray);
 r(s,.65,4.15,5.85,1.15,'E2EFF9');t(s,'独立校核：平衡关系 + 解析解 + 参数实验',.88,4.39,5.4,.57,20,C.teal,true);l(s,7.12,4.72,6.52,4.72,C.teal,1.5,true);l(s,3.55,4.12,3.55,3.55,C.teal,1.5,true);
 t(s,'输入校核',.75,5.78,2,.3,18,C.blue,true);t(s,'约束是否足够 / 单位是否一致 / 荷载方向是否正确',2.8,5.72,9.7,.43,19,C.navy);
 t(s,'闭环原则',.75,6.37,2,.3,18,C.teal,true);t(s,'不只确认“求解完成”，还要解释结果是否符合物理预期',2.8,6.3,9.7,.42,19,C.navy);break;
case 5:
 t(s,'典型交互：选中对象 → 修改属性 → 观察视图 → 核对结果',.7,1.74,11.9,.22,13,C.teal,true);
 shot(s,'01-workspace.jpg',.65,2.08,9.2,4.62,'workspace-evidence');
 [['1','模型树','节点、构件与条件'],['2','工作视图','几何、荷载与结果'],['3','属性栏','选中对象后检查参数']].forEach((v,i)=>{let y=2.15+i*1.35;label(s,v[0],v[1],10.08,y,2.65);t(s,v[2],10.13,y+.58,2.55,.58,17,C.gray)});break;
case 6:
 r(s,.65,2.0,7.1,4.65);beam(s,1.2,3.55,5.95);t(s,'单元 E1：A—B',2.48,2.05,4,.4,22,C.blue,true);t(s,'单元内集中力：a = 3 m',2.5,5.18,4.8,.4,20,C.orange,true);t(s,'2 个节点 · 1 个梁单元 · 无需新增跨中节点',.95,6.03,6.55,.32,17,C.gray);
 label(s,1,'边界条件与自由度',8.15,2.05,4.4);table(s,[['节点','受约束','自由'],['A','Dx、Dz','Ry'],['B','Dz','Dx、Ry']],8.1,2.78,4.58,1.88,[.7,1.85,2.03],'support-table',16);
 shot(s,'load-detail.png',8.1,4.91,2.55,1.77,'load-properties');t(s,'荷载属性\n−1.800×10⁴ N\n位置 3.000 m',10.91,5.08,1.85,1.3,16,C.navy,true);break;
case 7:
 t(s,'沿梁读取：A端 → 集中力左侧 → 集中力右侧 → B端；检查：局部坐标 / 图例符号 / 截面位置。',.7,1.72,12,.2,12,C.gray);
 label(s,1,'剪力：集中力处发生跳变',.65,1.95,5.9);label(s,2,'弯矩：跨中达到幅值峰值',6.95,1.95,5.8);
 shot(s,'shear-detail.png',.65,2.65,5.75,3.23,'shear-evidence');shot(s,'moment-detail.png',6.95,2.65,5.75,3.23,'moment-evidence');
 tag(s,'左右段幅值 9 kN',.83,6.13,3.1);tag(s,'跨中标注 −27 kN·m',7.13,6.13,3.6);t(s,'同一模型 / 同一荷载',4.55,6.2,2.1,.28,14,C.gray);break;
case 8:
 shot(s,'moment-detail.png',.65,2.08,6.25,3.52,'validation-evidence');
 t(s,'解析期望 ↔ 实机读数',7.24,2.1,4.1,.42,24,C.blue,true);
 table(s,[['核验项','解析幅值','界面幅值'],['A端反力','9 kN','9 kN'],['B端反力','9 kN','9 kN'],['跨中弯矩','27 kN·m','27 kN·m']],7.24,2.9,5.28,2.42,[1.78,1.75,1.75],'validation-table',16);
 [['条件','6 m / 跨中18 kN'],['符号','图中−27遵循软件约定'],['位置','端弯矩0，内部峰值27']].forEach((v,i)=>{let x=.7+i*4.15;tag(s,v[0],x,5.99,.83);t(s,v[1],x+1.02,6.02,2.89,.5,15,C.navy)});
 t(s,'结论限于默认案例的显示幅值对照，尚非全工况精度认证。',.85,6.63,11.6,.21,12,C.gray);break;
case 9:
 ['a=1m：反力偏向左端','a=2m：分配逐渐均衡','a=3m：对称且弯矩幅值最大'].forEach((v,i)=>tag(s,v,.72+i*4.15,1.86,3.8));
 const cfg={x:.7,y:2.95,w:5.65,h:3.12,showTitle:false,showLegend:true,legendPos:'b',legendFontSize:13,catAxisLabelFontSize:14,valAxisLabelFontSize:14,catAxisLabelColor:C.gray,valAxisLabelColor:C.gray,chartColors:[C.blue,C.teal],showValue:true,dataLabelPosition:'outEnd',dataLabelFormatCode:'0',showCatName:false,valGridLine:{color:'DCE7F0',width:.6},showBorder:false,showCatName:false,catAxisTitle:'荷载位置 a / m',showCatName:false,showCatName:false,fontFace:'Times New Roman'};
 t(s,'反力幅值 / kN',.75,2.4,5.5,.4,22,C.blue,true);t(s,'弯矩峰值幅值 / kN·m',6.95,2.4,5.5,.4,22,C.teal,true);
 p.ChartType=p.ChartType||pptxgen.ChartType;
 s.addChart(p.ChartType.bar,data.reaction_chart.series.map(z=>({name:z.name,labels:data.reaction_chart.categories,values:z.values})),{...cfg,barDir:'col',valAxisMaxVal:18,valAxisMinVal:0,objectName:id(s,'reaction-chart')});
 s.addChart(p.ChartType.line,data.moment_chart.series.map(z=>({name:z.name,labels:data.moment_chart.categories,values:z.values})),{...cfg,x:6.95,chartColors:[C.teal],showLegend:false,valAxisMaxVal:30,valAxisMinVal:0,showMarker:true,markerSize:7,lineSize:2,objectName:id(s,'moment-chart')});
 [['固定荷载','P = 18 kN'],['固定跨度','L = 6 m'],['位置变量','a距左端：1 / 2 / 3 m']].forEach((v,i)=>{let x=.75+i*4.15;tag(s,v[0],x,6.24,1.2);t(s,v[1],x+1.34,6.3,2.63,.26,14,C.navy,true)});t(s,'解析预测，非新增实机测量。先预测，再在软件中改变位置并核对。',.75,6.66,12,.23,12,C.gray);break;
case 10:
 shot(s,'derivation-detail.png',4.66,2.1,7.83,1.6,'derivation-evidence');
 [['受力分析','隔离结构，列出外力与支座'],['整体平衡','ΣFx=0，ΣFz=0，ΣMy=0'],['截面内力','dV/dx+qz=0；dM/dx−V=0'],['结果检查','比较边界值、峰值与单位']].forEach((v,i)=>{let y=2.13+i*1.08;r(s,.67,y,3.55,.87,i%2?'E2EFF9':C.pale);label(s,i+1,v[0],.86,y+.2,3.1);if(i<3)l(s,2.4,y+.89,2.4,y+1.05,C.teal,1.5,true);t(s,v[1],4.8,4.15+i*.57,7.1,.32,18,C.navy)});
 t(s,'教学助手：让每一步都有可核对的物理含义',4.8,3.82,7.0,.3,19,C.blue,true);break;
case 11:
 t(s,'4 × 6 = 24：约束处理前节点自由度总数，不等于24个有效自由度。',6.2,1.71,6.3,.22,12,C.teal,true);
 shot(s,'space-detail.png',.65,1.98,5.1,4.48,'space-model');
 label(s,1,'每节点六自由度',6.12,2.1,3.8);['Ux','Uy','Uz','Rx','Ry','Rz'].forEach((v,i)=>{let x=6.22+(i%3)*2.14,y=3.45+Math.floor(i/3)*.73;tag(s,v,x,y,1.8,i<3?C.pale:'E2EFF9',i<3?C.blue:C.teal)});
 t(s,'两端共 12 自由度 → 12×12 单元刚度',6.22,4.98,6.2,.5,24,C.navy,true);t(s,'EA/L：轴向；GJ/L：扭转；EI：双向弯曲\n局部刚度 → 坐标变换 → 整体自由度装配\nEuler–Bernoulli梁；不含剪切变形修正',6.22,5.69,6.2,.93,18,C.gray);break;
case 12:
 t(s,'核验步骤：读取外力 → 读取总反力 → 逐方向求和 → 明确未检查的力矩。',.7,1.73,11.9,.21,12,C.teal,true);
 shot(s,'space-table.png',.65,2.0,3.35,4.45,'space-results');
 [['4','节点'],['3','构件'],['24','总自由度']].forEach((v,i)=>{let x=4.36+i*2.85;r(s,x,2.0,2.64,1.08);t(s,v[0],x+.18,2.16,1.04,.5,30,C.blue,true);t(s,v[1],x+1.27,2.43,1.25,.34,17,C.navy,true)});
 table(s,[['方向','D点外力 / N','A点反力 / N','平衡'],['x','8000','−8000','0'],['y','−5000','5000','0'],['z','−12000','12000','0']],4.36,3.47,8.34,2.25,[1.25,2.4,2.4,2.29],'space-balance-table',19);
 t(s,'本次界面报告：Worker CPU；残差约 6×10⁻¹⁴；变形显示放大 2.4 倍。',4.4,6.08,8.2,.43,16,C.gray);t(s,'仅核对三向力平衡；扭矩数值未捕获，应力 / 安全系数未补填。',4.4,6.59,8.2,.23,12,C.gray);break;
case 13:
 r(s,4.85,2.23,3.55,3.98,'DCEBF8');t(s,'本地计算核心',5.05,4.6,3.12,.42,22,C.blue,true);t(s,'单元组装 / 约束分块\n位移 → 反力与端力',5.05,5.29,3.12,.64,16,C.navy);
 [['模型数据','节点、材料、截面\n约束与荷载',.7,2.12],['可视交互','Vue 3 / TypeScript\nThree.js 视图',8.95,2.12],['学习解释','公式库 / 分步推导\n内力与结果表',.7,4.65],['离线交付','Electron / PWA\nWorker CPU + sparse LU',8.95,4.65]].forEach((v,i)=>{r(s,v[2],v[3],3.67,1.59,i%2?'E5F0FA':C.pale);t(s,v[0],v[2]+.2,v[3]+.17,3.25,.35,21,C.blue,true);t(s,v[1],v[2]+.2,v[3]+.76,3.25,.63,17,C.navy);l(s,i%2?8.4:i===2?4.8:4.38,v[3]+.79,i%2?8.9:i===2?4.38:4.8,v[3]+.79,C.teal,1.6,true)});
 t(s,'计算链：K组装 → 约束分块 → sparse LU → 位移 → 反力与端力；Worker不可用回退主线程，WebGPU仅检测。',.85,6.55,11.8,.24,13,C.gray);break;
case 14:
 const tiers=[['已实现 · 学习功能','二维梁 / 刚架','反力、N / V / M、变形','空间杆系','节点自由度、构件端力','使用前检查条件与符号'],['实验中 · 继续验证','Tet4实验内核','与主编辑器实体链仍待完善','WebGPU能力检测','不等于GPU数值求解','不把界面入口当作成熟能力'],['用途边界 · 如实说明','课堂学习与训练','解析对照、可视化理解','尚非工程认证','不用于设计、鉴定或商业用途','功能存在 ≠ 充分验证']];
 tiers.forEach((v,i)=>{let x=.65+i*4.16;r(s,x,2.06,3.84,4.56,i===1?'E4EFF9':C.pale);r(s,x,2.06,3.84,.85,C.blue);t(s,v[0],x+.18,2.28,3.47,.55,20,'FFFFFF',true);[1,3].forEach((j,k)=>{t(s,v[j],x+.2,3.15+k*1.18,3.44,.38,20,C.navy,true);t(s,v[j+1],x+.2,3.7+k*1.18,3.44,.56,16,C.gray)});t(s,v[5],x+.2,6.09,3.44,.35,14,C.blue,true)});break;
case 15:
 shot(s,'02-guide.jpg',.65,2.0,6.7,3.77,'guide-evidence');
 [['载入案例','帮助 → 使用指导与默认案例'],['检查条件','单位、截面、约束、荷载方向'],['求解与核对','二维自动求解；三维点本地求解'],['改变单参数','固定P、L与截面，仅改a；核对反力和弯矩']].forEach((v,i)=>{let y=2.0+i*1.07;label(s,i+1,v[0],7.72,y,4.8);t(s,v[1],8.2,y+.5,4.48,.4,17,C.gray)});
 t(s,'排错线索：不稳定→约束；量级异常→单位；图形异常→方向与局部坐标。',.75,6.28,11.9,.44,18,C.blue,true);break;
case 16:
 t(s,'把“看见结果”推进到“解释结果”',.75,2.1,11.8,.65,33,C.blue,true);
 [['01','可视化建模','把条件转成节点与构件','已见：二维与空间工作区'],['02','结果解释','联系内力图、公式与危险位置','已见：默认梁幅值对照'],['03','独立核验','平衡关系与解析解交叉检查','已见：空间三向力平衡']].forEach((v,i)=>{let x=.7+i*4.15;r(s,x,3.25,3.82,2.56,i%2?'E1EEF9':C.pale);r(s,x,3.25,3.82,1.3,C.blue);t(s,v[0],x+.2,3.44,.7,.42,26,'FFFFFF',true);t(s,v[1],x+.2,4.12,3.4,.4,23,'FFFFFF',true);t(s,v[2],x+.2,4.77,3.4,.57,17,C.navy);t(s,v[3],x+.2,5.43,3.4,.26,12,C.gray)});
 t(s,'下一步',.82,6.18,1.3,.34,19,C.teal,true);t(s,'验证优先：边界与荷载组合 → 解析回归算例 → 空间完整力矩平衡 → 实体链路完善',2.25,6.16,10.2,.48,17,C.navy);break;
case 17:
 [['轴向拉压','σ=N/A；ΔL=NL/(EA)','N：轴力；A：面积；E：弹性模量','均匀等截面、线弹性；统一N/m/Pa'],['弯曲响应','σmax=M/W；EI控制挠度','M：弯矩；W：抗弯截面系数','线弹性、小变形；截面与边界须匹配'],['圆轴扭转','τmax=T/Wt；φ=TL/(GJ)','T：扭矩；J：极惯性矩；G：剪切模量','均匀圆轴、小变形；角度按rad'],['集中力简支梁','RA=P(L−a)/L；Mpeak=Pa(L−a)/L','a：距左支座位置；0<a<L','本稿P=18kN，L=6m；仅解析预测']].forEach((v,i)=>{let x=.65+(i%2)*6.2,y=2.04+Math.floor(i/2)*2.32;r(s,x,y,5.85,2.05,i>1?'E5F0FA':C.pale);r(s,x,y,5.85,.65,C.blue);tag(s,String(i+1),x+.18,y+.17,.5);t(s,v[0],x+.9,y+.17,4.7,.37,22,'FFFFFF',true);t(s,v[1],x+.2,y+.77,5.42,.4,20,C.navy);t(s,v[2],x+.2,y+1.34,5.42,.28,14,C.navy);t(s,v[3],x+.2,y+1.75,5.42,.23,12,C.gray)});break;
case 18:
 [['实机已观察','二维梁9/9kN与27kN·m幅值；空间三向力平衡','本地实机截图与运行记录'],['解析预测','荷载位置a=1/2/3m的反力与弯矩趋势','sources/native-data.json，非新增测量'],['实验与缺项','Tet4实验；完整力矩核验待补；GPU仅检测','README及求解能力审计'],['视觉协作','网页规划与逐项独立素材生成，模型名未核验','用户授权当前网页版继续']].forEach((v,i)=>{let y=2.02+i*1.08;tag(s,'0'+(i+1),.7,y,.55);t(s,v[0],1.45,y+.01,2.2,.38,21,C.blue,true);t(s,v[1],3.9,y+.01,8.4,.4,18,C.navy);t(s,v[2],3.9,y+.58,8.4,.23,12,C.gray);l(s,1.45,y+.89,12.52,y+.89,C.line,.8)});
 t(s,'欢迎带着模型、单位和截图交流：先定位条件，再判断差异。',.85,6.49,11.7,.29,18,C.teal,true);break;
}}
if(!editDemo)fs.writeFileSync(path.join(out,'sources/speaker-notes.md'),plan.slides.map(q=>`## ${q.slide_number}. ${q.title}\n\n${q.speaker_notes}\n`).join('\n'));
p.writeFile({fileName:path.join(out,'build',editDemo?'editing-demo-native.pptx':rep?'representatives-native.pptx':'deck-native.pptx')});
