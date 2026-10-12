const pptxgen=require('pptxgenjs'),fs=require('fs'),path=require('path');
const {toolkit,C}=require('./design.cjs');const out=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(out,'planning/deck_plan.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(out,'sources/native-data.json'),'utf8'));
const editDemo=process.argv.includes('--edit-demo');if(editDemo){plan.slides[0].title='拉压弯扭大师（编辑演示）';data.reaction_chart.series[0].values[0]=16;}
const p=new pptxgen();p.layout='LAYOUT_WIDE';p.author='拉压弯扭大师';p.title='拉压弯扭大师｜中国科研分享重制版';p.lang='zh-CN';p.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
p._editDemo=editDemo;const {text:t,panel:r,line:l,circle:c,tag,shot,base,label,table,beam,mini,id}=toolkit(p);
const rep=process.argv.includes('--representatives');let s;
for(const q of plan.slides){let n=q.slide_number;if(rep&&![1,4,8].includes(n))continue;s=base(q);
switch(n){
case 1:
 t(s,'从力学概念',.6,2.0,7.1,.8,40,C.navy,true);t(s,'到可验证计算',.6,2.95,7.1,.85,40,C.blue,true);
 t(s,'一根梁，串起建模、求解、推导与独立校核',.65,4.12,7,.65,22,C.gray);
 ['本地离线','二维 / 空间杆系','符号公式'].forEach((v,i)=>tag(s,v,.65+i*2.1,5.25,1.88));
 t(s,'材料力学同学分享  ·  v2.0.2',.65,6.14,7,.35,17,C.gray);
 // Generated independent rod concept is composed into this reserved area.
 r(s,8.2,1.88,4.5,4.82,C.pale,'concept-stage');
 t(s,'概念插画 · 非实测结果',8.5,6.3,3.8,.25,12,C.gray);break;
case 2:
 label(s,1,'会算题，还需要能解释结果',.65,1.95,5.5);
 ['支座约束哪些自由度？','荷载改变后，内力图怎样变？','数值结果为什么可信？'].forEach((v,i)=>{c(s,.72,2.9+i*.88,.17,C.orange);t(s,v,1.08,2.77+i*.88,5.3,.48,22,C.navy,true)});
 beam(s,7.18,3.45,4.5,.5,false);t(s,'先作预测',6.95,2.0,2.1,.4,20,C.blue,true);t(s,'再看响应',10.25,2.0,2.1,.4,20,C.teal,true);
 r(s,.65,5.85,12.04,.78);t(s,'软件的学习价值：让“条件—模型—结果—解释”能相互对应',.88,6.04,11.55,.4,22,C.blue,true);break;
case 3:
 // Four distinct mechanics fields; equations and arrows remain editable.
 [['拉伸 / 压缩','N → σ → ΔL','σ = N / A','轴向力与长度变化'],['弯曲','V → M → σ、w','σmax = M / W','内力分布与危险截面'],['扭转','T → τ → φ','τmax = T / Wt','剪应力与扭转角'],['组合变形','N、M、T → 强度','σeq = √(σ² + 3τ²)','先区分分量与适用条件']].forEach((v,i)=>{let x=.65+(i%2)*6.18,y=1.98+Math.floor(i/2)*2.3;r(s,x,y,5.85,2.02);label(s,i+1,v[0],x+.2,y+.19,5.4);let dx=i===2?2.15:.25;t(s,v[1],x+dx,y+.83,5.5-dx,.38,20,C.teal,true);t(s,v[2],x+dx,y+1.32,i===2?3.3:2.9,.42,22,C.navy);if(i!==2)t(s,v[3],x+3.2,y+1.3,2.35,.5,14,C.gray)});t(s,'概念示意',.98,6.36,1.5,.23,11,C.gray);break;
case 4:
 // A full native technical route with verification feedback, not three cards.
 [['题目 / 物理条件','单位、几何、受力'],['离散结构模型','节点、构件、材料'],['约束与荷载','自由度、等效作用'],['局部到整体','单元刚度、坐标变换'],['本地求解','位移、反力、端力']].forEach((v,i)=>{let x=.65+i*2.46;r(s,x,2.15,2.16,1.35,i===4?'D9EFF1':C.pale);t(s,String(i+1).padStart(2,'0'),x+.16,2.3,.55,.3,16,C.blue,true);t(s,v[0],x+.16,2.75,1.88,.35,18,C.navy,true);t(s,v[1],x+.12,3.19,1.95,.22,12,C.gray);if(i<4)l(s,x+2.18,2.82,x+2.43,2.82,C.blue,1.5,true)});
 l(s,11.55,3.52,11.55,4.1,C.blue,1.6,true);r(s,7.15,4.15,5.55,1.15);t(s,'结果解释与可视化',7.4,4.35,4.95,.33,22,C.blue,true);t(s,'N / V / M、变形、结果表与教学推导',7.4,4.89,4.95,.24,15,C.gray);
 r(s,.65,4.15,5.85,1.15,'E2F2EF');t(s,'独立校核：平衡关系 + 解析解 + 参数实验',.88,4.39,5.4,.57,20,C.teal,true);l(s,7.12,4.72,6.52,4.72,C.teal,1.5,true);l(s,3.55,4.12,3.55,3.55,C.teal,1.5,true);
 t(s,'输入校核',.75,5.78,2,.3,18,C.blue,true);t(s,'约束是否足够 / 单位是否一致 / 荷载方向是否正确',2.8,5.72,9.7,.43,19,C.navy);
 t(s,'闭环原则',.75,6.37,2,.3,18,C.teal,true);t(s,'不只确认“求解完成”，还要解释结果是否符合物理预期',2.8,6.3,9.7,.42,19,C.navy);break;
case 5:
 shot(s,'01-workspace.jpg',.65,1.95,9.2,5.0,'workspace-evidence');
 [['1','模型树','节点、构件与条件'],['2','工作视图','几何、荷载与结果'],['3','属性栏','选中对象后检查参数']].forEach((v,i)=>{let y=2.15+i*1.35;label(s,v[0],v[1],10.08,y,2.65);t(s,v[2],10.13,y+.58,2.55,.58,17,C.gray)});break;
case 6:
 r(s,.65,2.0,7.1,4.65);beam(s,1.2,3.55,5.95);t(s,'单元 E1：A—B',2.48,2.05,4,.4,22,C.blue,true);t(s,'单元内集中力：a = 3 m',2.5,5.18,4.8,.4,20,C.orange,true);t(s,'2 个节点 · 1 个梁单元 · 无需新增跨中节点',.95,6.03,6.55,.32,17,C.gray);
 label(s,1,'边界条件与自由度',8.15,2.05,4.4);table(s,[['节点','受约束','自由'],['A','Dx、Dz','Ry'],['B','Dz','Dx、Ry']],8.1,2.78,4.58,1.88,[.7,1.85,2.03],'support-table',16);
 shot(s,'load-detail.png',8.1,4.91,2.55,1.77,'load-properties');t(s,'荷载属性\n−1.800×10⁴ N\n位置 3.000 m',10.91,5.08,1.85,1.3,16,C.navy,true);break;
case 7:
 label(s,1,'剪力：集中力处发生跳变',.65,1.95,5.9);label(s,2,'弯矩：跨中达到幅值峰值',6.95,1.95,5.8);
 shot(s,'shear-detail.png',.65,2.65,5.75,3.23,'shear-evidence');shot(s,'moment-detail.png',6.95,2.65,5.75,3.23,'moment-evidence');
 tag(s,'左右段幅值 9 kN',.83,6.13,3.1);tag(s,'跨中标注 −27 kN·m',7.13,6.13,3.6);t(s,'同一模型 / 同一荷载',4.55,6.2,2.1,.28,14,C.gray);break;
case 8:
 shot(s,'moment-detail.png',.65,1.97,7.25,4.08,'validation-evidence');
 r(s,8.23,1.98,4.47,1.15,'DDEFF8');t(s,'9 / 9 kN',8.48,2.13,3.95,.48,32,C.blue,true);t(s,'两端反力幅值：RA = RB = P/2',8.48,2.74,3.95,.27,15,C.gray);
 r(s,8.23,3.38,4.47,1.15,'E2F2EF');t(s,'27 kN·m',8.48,3.54,3.95,.46,32,C.teal,true);t(s,'最大弯矩幅值：PL/4 = 18×6/4',8.48,4.13,3.95,.28,15,C.gray);
 t(s,'核对符号与位置',8.28,4.91,4.2,.4,21,C.navy,true);t(s,'图中 −27 遵循软件约定；端弯矩为 0，内部峰值仍为 27。',8.28,5.49,4.2,.73,18,C.gray);
 t(s,'验证范围：默认梁案例的显示幅值对照；未构成全部工况的求解器精度认证。',.7,6.49,12,.29,13,C.gray);break;
case 9:
 const cfg={x:.7,y:2.57,w:5.65,h:3.55,showTitle:false,showLegend:true,legendPos:'b',legendFontSize:13,catAxisLabelFontSize:14,valAxisLabelFontSize:14,catAxisLabelColor:C.gray,valAxisLabelColor:C.gray,chartColors:[C.blue,C.teal],showValue:true,dataLabelPosition:'outEnd',dataLabelFormatCode:'0',showCatName:false,valGridLine:{color:'DCE7F0',width:.6},showBorder:false,showCatName:false,catAxisTitle:'荷载位置 a / m',showCatName:false,showCatName:false,fontFace:'Times New Roman'};
 t(s,'反力幅值 / kN',.75,2.0,5.5,.4,22,C.blue,true);t(s,'弯矩峰值幅值 / kN·m',6.95,2.0,5.5,.4,22,C.teal,true);
 p.ChartType=p.ChartType||pptxgen.ChartType;
 s.addChart(p.ChartType.bar,data.reaction_chart.series.map(z=>({name:z.name,labels:data.reaction_chart.categories,values:z.values})),{...cfg,barDir:'col',valAxisMaxVal:18,valAxisMinVal:0,objectName:id(s,'reaction-chart')});
 s.addChart(p.ChartType.line,data.moment_chart.series.map(z=>({name:z.name,labels:data.moment_chart.categories,values:z.values})),{...cfg,x:6.95,chartColors:[C.teal],showLegend:false,valAxisMaxVal:30,valAxisMinVal:0,showMarker:true,markerSize:7,lineSize:2,objectName:id(s,'moment-chart')});
 t(s,'条件固定：P = 18 kN，L = 6 m；a 为距左支座的距离，取 1 / 2 / 3 m。',.75,6.26,12,.35,18,C.navy,true);t(s,'解析预测，非新增实机测量。先预测，再在软件中改变位置并核对。',.75,6.66,12,.23,12,C.gray);break;
case 10:
 shot(s,'derivation-detail.png',.65,2.05,12.05,1.8,'derivation-evidence');
 [['整体平衡','ΣFx = 0；ΣFz = 0；ΣMy = 0'],['局部关系','dV/dx + qz = 0；dM/dx − V = 0'],['危险位置','先由 M(x) 找峰值，再结合截面评价']].forEach((v,i)=>{let x=.65+i*4.15;label(s,i+1,v[0],x,4.29,3.95);t(s,v[1],x+.05,4.99,3.78,.83,20,C.navy);});
 r(s,.65,6.12,12.05,.6);t(s,'助手用于核对推理：先说清受力与边界，再读取推导和结果摘要。',.88,6.28,11.55,.3,18,C.blue,true);break;
case 11:
 shot(s,'space-detail.png',.65,1.98,5.1,4.48,'space-model');
 label(s,1,'每节点：3 平移 + 3 转动',6.12,2.0,6.4);['Ux','Uy','Uz','Rx','Ry','Rz'].forEach((v,i)=>{let x=6.22+(i%3)*2.14,y=2.9+Math.floor(i/3)*.9;tag(s,v,x,y,1.8,i<3?C.pale:'E2F2EF',i<3?C.blue:C.teal)});
 t(s,'两端共 12 自由度 → 12×12 单元刚度',6.22,4.98,6.2,.5,24,C.navy,true);t(s,'EA/L：轴向  ·  GJ/L：扭转\n局部 y / z：双向弯曲\nEuler–Bernoulli 梁，不含剪切变形修正',6.22,5.69,6.2,.93,18,C.gray);break;
case 12:
 shot(s,'space-table.png',.65,2.0,3.35,4.45,'space-results');
 r(s,4.36,2.0,8.34,1.08);t(s,'4 节点  /  3 构件  /  24 总自由度',4.62,2.27,7.85,.52,27,C.blue,true);
 table(s,[['方向','D点外力 / N','A点反力 / N','平衡'],['x','8000','−8000','0'],['y','−5000','5000','0'],['z','−12000','12000','0']],4.36,3.47,8.34,2.25,[1.25,2.4,2.4,2.29],'space-balance-table',19);
 t(s,'本次界面报告：Worker CPU；残差约 6×10⁻¹⁴；变形显示放大 2.4 倍。',4.4,6.08,8.2,.43,16,C.gray);t(s,'仅核对三向力平衡；扭矩数值未捕获，应力 / 安全系数未补填。',4.4,6.59,8.2,.23,12,C.gray);break;
case 13:
 [['交互与数据层','Vue 3 / TypeScript','节点 · 材料 · 截面 · 约束 · 荷载'],['数值计算层','CPU / Worker / sparse LU','单元组装 → 约束分块 → 位移求解 → 反力与端力'],['显示与解释层','Three.js / 原生结果表','视图切换 · 内力 / 变形 · 教学助手']].forEach((v,i)=>{let y=2.05+i*1.4;r(s,.65,y,8.6,1.12);t(s,v[0],.9,y+.18,2.4,.4,22,C.blue,true);t(s,v[1],3.5,y+.18,5.4,.35,20,C.navy,true);t(s,v[2],3.5,y+.69,5.4,.24,15,C.gray);if(i<2)l(s,4.9,y+1.13,4.9,y+1.37,C.blue,1.5,true)});
 r(s,9.6,2.05,3.1,3.92,'E2F2EF');t(s,'本地执行',9.85,2.38,2.6,.48,26,C.teal,true);t(s,'Electron 桌面版\nPWA / 离线静态版\n\nWorker 不可用时\n回退主线程 CPU',9.85,3.23,2.6,1.95,19,C.navy);t(s,'WebGPU：仅能力检测\n未启用 GPU 数值内核',9.85,6.16,2.6,.56,14,C.gray);break;
case 14:
 table(s,[['模块','可以讲清的能力','当前边界'],['二维梁 / 刚架','反力、N / V / M、变形与推导','先检查模型与符号约定'],['空间杆系','桁架闭环；刚架六自由度与端力','杆系响应，不是实体云图'],['公式与组合变形','轴向 / 弯曲 / 扭转 / 强度计算','适用条件与单位需独立确认'],['GPU / 实体实验','WebGPU检测；Tet4实验内核','GPU内核与主编辑器实体链未完成']],.65,2.08,12.05,3.79,[2.1,5.1,4.85],'capability-table',18);
 t(s,'学习、教学与训练',.75,6.16,4.8,.4,24,C.blue,true);t(s,'非北航官方；不用于实际工程设计、鉴定或商业用途。',5.2,6.13,7.4,.53,17,C.gray);break;
case 15:
 shot(s,'02-guide.jpg',.65,2.0,6.7,3.77,'guide-evidence');
 [['载入案例','帮助 → 使用指导与默认案例'],['检查条件','单位、截面、约束、荷载方向'],['求解与核对','二维自动求解；三维点本地求解'],['改变单参数','先预测，改位置，再比较结果']].forEach((v,i)=>{let y=2.0+i*1.07;label(s,i+1,v[0],7.72,y,4.8);t(s,v[1],8.2,y+.5,4.48,.4,17,C.gray)});
 t(s,'排错线索：不稳定→约束；量级异常→单位；图形异常→方向与局部坐标。',.75,6.28,11.9,.44,18,C.blue,true);break;
case 16:
 t(s,'先预测，再求解，最后解释。',.65,2.02,9.9,.8,38,C.blue,true);
 [['已经看到','默认梁幅值对照\n空间刚架三向力平衡'],['接下来验证','更多边界条件与荷载类型\n建立可复现的回归案例'],['一起反馈','提供模型、单位与截图\n说清哪一步不直观或不一致']].forEach((v,i)=>{let x=.65+i*4.15;label(s,i+1,v[0],x,3.65,3.8);t(s,v[1],x+.03,4.42,3.8,1.2,20,C.navy)});
 t(s,'让计算结果成为理解材料力学的起点',.75,6.28,10.7,.43,24,C.teal,true);break;
case 17:
 table(s,[['对象','关系式','单位与适用条件'],['轴向','σ=N/A；ΔL=NL/(EA)','统一N、m、Pa；均匀等截面线弹性'],['弯曲','σmax=M/W；EI控制挠度','N·m、m³；线弹性小变形'],['圆轴扭转','τmax=T/Wt；φ=TL/(GJ)','N·m、m⁴；均匀圆轴与小变形'],['组合应力','σeq=√(σ²+3τ²)','正应力与剪应力采用同一单位'],['集中力简支梁','RA=P(L−a)/L；Mpeak=Pa(L−a)/L','本稿P=18kN、L=6m；0<a<L']],.65,2.0,12.05,4.25,[1.55,5.2,5.3],'formula-table',17);
 t(s,'公式是学习用的条件化关系；选公式之前先确认受力形式、截面与边界。',.75,6.53,11.8,.3,17,C.gray);break;
case 18:
 [['软件功能与实现','README.md；docs/solver-capability-audit.md；docs/version-2.0-stage-1.md'],['实机证据','outputs/classmate-sharing/assets/live；qa/live-run-evidence.json；本地已有dist构建'],['解析数据','sources/native-data.json；P=18kN、L=6m，a=1/2/3m；并非新增测量'],['网页协作','当前已登录ChatGPT完成规划与单元素生成；模型名未核验，用户允许继续']].forEach((v,i)=>{let y=2.0+i*1.0;label(s,i+1,v[0],.65,y,4.1);t(s,v[1],4.15,y+.01,8.55,.56,17,C.gray)});
 r(s,.65,6.2,12.05,.6);t(s,'验证仍有边界：默认案例 ≠ 全工况验证；单次耗时 ≠ 性能基准；放大变形 ≠ 真实比例。',.85,6.37,11.65,.27,16,C.blue,true);break;
}}
if(!editDemo)fs.writeFileSync(path.join(out,'sources/speaker-notes.md'),plan.slides.map(q=>`## ${q.slide_number}. ${q.title}\n\n${q.speaker_notes}\n`).join('\n'));
p.writeFile({fileName:path.join(out,'build',editDemo?'editing-demo-native.pptx':rep?'representatives-native.pptx':'deck-native.pptx')});
