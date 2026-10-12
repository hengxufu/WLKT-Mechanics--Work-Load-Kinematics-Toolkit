const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const p = new pptxgen(); p.layout='LAYOUT_WIDE';
p.author='拉压弯扭大师项目组'; p.subject='材料力学教学软件技术路线'; p.title='拉压弯扭大师｜技术路线图'; p.company='项目组'; p.lang='zh-CN';
p.theme={headFontFace:'Microsoft YaHei',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
const C={ink:'172C38',teal:'007F7A',green:'E5F3EF',light:'F1F5F7',gray:'526675',amber:'A76515',sand:'FFF2DE',line:'A8BBC4',white:'FFFFFF'};
function text(s,t,x,y,w,h,size=16,color=C.ink,bold=false,align='left'){s.addText(t,{x,y,w,h,fontFace:'Microsoft YaHei',fontSize:size,color,bold,align,margin:0,breakLine:false,vertAlign:'mid',fit:'shrink'});}
function box(s,x,y,w,h,fill=C.light,line=fill){s.addShape(p.ShapeType.roundRect,{x,y,w,h,rectRadius:.12,radius:.12,fill:{color:fill},line:{color:line,width:1}});}
function arrow(s,x1,y1,x2,y2,color=C.teal,dash){s.addShape(p.ShapeType.line,{x:Math.min(x1,x2),y:Math.min(y1,y2),w:Math.abs(x2-x1),h:Math.abs(y2-y1),flipV:y2<y1,flipH:x2<x1,line:{color,width:1.8,beginArrowType:'none',endArrowType:'triangle',...(dash?{dashType:'dash'}:{})}});}
function base(n,title,sub){let s=p.addSlide();s.background={color:C.white};text(s,'拉压弯扭大师  /  技术路线',.55,.28,10,.25,11,C.teal,true);text(s,title,.55,.78,12.2,.62,30,C.ink,true);text(s,sub,.55,1.5,12.2,.4,13,C.gray);text(s,'材料力学教学与学习场景  ·  基于项目 README 与能力审计整理',.55,7.05,11,.22,9,C.gray);text(s,String(n).padStart(2,'0'),12.15,7.03,.6,.25,11,C.teal,true,'right');return s;}
function card(s,x,y,w,h,num,title,body,fill=C.light){box(s,x,y,w,h,fill);text(s,num,x+.18,y+.18,w-.36,.35,16,C.teal,true);text(s,title,x+.18,y+.72,w-.36,.45,20,C.ink,true);text(s,body,x+.18,y+1.35,w-.36,h-1.52,14,C.gray);}
let s=base(1,'从力学问题到可解释结果，构建本地教学闭环','目标：把拉伸压缩、弯曲、扭转与组合变形贯通为“建模—求解—解释—验证”的统一流程。');
const xs=[.55,3.05,5.55,8.05,10.55];
const titles=['问题与建模','统一模型','本地求解','解释与展示','验证与应用'];
const bodies=['拉 / 压 / 弯 / 扭\n节点、杆件与支座\n材料、截面与荷载','二维 / 三维模型\n自由度与单位校核\n模型修订与结果绑定','2D 梁与空间杆系\n刚度组装与约束处理\nCPU / Worker 求解','位移、反力与内力\n应力与危险位置\n公式计算与分步推导','典型案例 / 解析解\n数值校核与回归验证\n离线桌面教学应用'];
xs.forEach((x,i)=>{card(s,x,2.3,2.22,3.2,'0'+(i+1),titles[i],bodies[i],i===2?C.green:C.light);if(i<4)arrow(s,x+2.23,3.88,x+2.48,3.88);});
arrow(s,11.66,5.65,11.66,6.2);s.addShape(p.ShapeType.line,{x:1.66,y:6.2,w:10,h:0,line:{color:C.teal,width:1.8}});arrow(s,1.66,6.2,1.66,5.65);text(s,'案例与误差反馈 → 修正模型、求解策略和教学表达',3.2,5.77,6.9,.32,14,C.teal,true,'center');
s.addNotes('技术路线概览。当前实现和后续规划的边界详见第3页。来源：README.md、docs/solver-capability-audit.md、docs/version-2.0-stage-1.md。技术图全部为PowerPoint原生可编辑形状与文本。');
s=base(2,'四类力学问题，共享一套计算与校核流程','输入 E、G、A、I、J 等材料与截面参数；由内力与边界条件建立相应计算模型。');
const rows=[['拉伸 / 压缩','轴力 N','σ = N / A','ΔL = NL / EA','轴向应力与变形'],['弯曲','弯矩 M、剪力 V','σ = My / I','EI · v″ = M','弯曲应力与挠度'],['扭转','扭矩 T','τ = Tρ / J','φ = TL / GJ','剪应力与扭转角'],['组合变形','N、M、T 联合作用','正应力与剪应力组合','von Mises 等效应力','危险位置与安全系数']];
rows.forEach((r,i)=>{const y=2.18+i*.88;box(s,.55,y,2.12,.67,i===3?C.green:C.light);text(s,r[0],.74,y+.12,1.76,.4,17,C.teal,true);arrow(s,2.72,y+.34,3.04,y+.34);box(s,3.13,y,9.65,.67,C.light);text(s,r[1],3.32,y+.1,2.1,.44,14,C.ink,true);text(s,r[2],5.55,y+.1,2.4,.44,15);text(s,r[3],8.04,y+.1,2.15,.44,14);text(s,r[4],10.37,y+.1,2.24,.44,13,C.gray);});
box(s,.55,6.02,12.22,.62,C.ink);text(s,'统一校核：单位与符号 → 约束充分性 → 平衡 / 残差 → 解析解对照 → 结果解释',.8,6.14,11.72,.36,16,C.white,true,'center');
s.addNotes('公式用于教学概览：轴向和扭转变形公式适用于相应均匀杆与恒定内力假设；扭转应力式适用于圆截面Saint-Venant扭转，J为极惯性矩。一般非圆截面不能直接套用Tρ/J。弯曲正负号随项目约定。von Mises用于适用材料的等效应力评价。安全系数需给定强度准则和材料强度。本页公式路径并不宣称所有组合工况均已自动接入有限元流程。');
text(s,'注：公式为典型线弹性模型示意；扭转应力式适用于圆截面，具体计算需满足模型假设。',.6,6.7,12,.22,10,C.gray);
s=base(3,'以已实现的杆系分析为基础，分阶段扩展','优先级建议：先补齐计算与教学闭环，再扩展实体可视化与性能后端；不设未经评估的工期。');
card(s,.55,2.25,3.85,3.63,'01 · 已实现','杆系与教学基础','二维梁 / 刚架建模与求解\n空间桁架 / 刚架分析\n公式库、分步推导、结果表\n本地 Worker 与离线分发',C.green);
card(s,4.74,2.25,3.85,3.63,'02 · 建议近期','补齐与统一','统一模型接口与结果口径\n补充空间构件荷载与内力插值\n完善解析解、对称算例与回归\n强化局部轴、约束与错误提示');
card(s,8.93,2.25,3.85,3.63,'03 · 后续规划','实体与性能扩展','Tet4 网格与边界条件完善\n应力恢复与实体结果可视化\n评估 WASM / WebGPU 内核\n精度、残差与性能基准验证',C.sand);
arrow(s,4.42,4.05,4.72,4.05);arrow(s,8.61,4.05,8.91,4.05);
box(s,.55,6.17,12.23,.55,C.light);text(s,'能力边界：Tet4 为实验模块；WebGPU 当前仅设备检测；尚无实体连续应力云图。',.76,6.26,11.83,.34,14,C.amber,true,'center');
s.addNotes('依据项目仓库文档整理，不表示本次已运行软件验证。来源README.md（2.0.2）、docs/solver-capability-audit.md、docs/version-2.0-stage-1.md、docs/3d-fem-roadmap.md。空间刚架为Euler-Bernoulli形式。近期与后续阶段为建议路线。');
const out=path.join(__dirname,'拉压弯扭大师_技术路线图.pptx');
p.writeFile({fileName:out});
// Companion native draw.io model for the overview.
let cells=['<mxCell id="0"/><mxCell id="1" parent="0"/>'];
titles.forEach((t,i)=>{cells.push(`<mxCell id="n${i}" value="${t}&#xa;${bodies[i].replace(/\n/g,'&#xa;')}" style="rounded=1;whiteSpace=wrap;html=0;fillColor=${i===2?'#E5F3EF':'#F1F5F7'};strokeColor=#A8BBC4;fontColor=#172C38;fontSize=17;spacing=16;" vertex="1" parent="1"><mxGeometry x="${40+i*270}" y="100" width="230" height="230" as="geometry"/></mxCell>`);if(i>0)cells.push(`<mxCell id="e${i}" style="edgeStyle=orthogonalEdgeStyle;endArrow=block;strokeColor=#007F7A;strokeWidth=2;" edge="1" parent="1" source="n${i-1}" target="n${i}"><mxGeometry relative="1" as="geometry"/></mxCell>`);});
cells.push('<mxCell id="feedback" value="案例与误差反馈：修正模型、求解策略和教学表达" style="edgeStyle=orthogonalEdgeStyle;endArrow=block;strokeColor=#007F7A;fontSize=15;" edge="1" parent="1" source="n4" target="n0"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="1235" y="410"/><mxPoint x="155" y="410"/></Array></mxGeometry></mxCell>');
fs.writeFileSync(path.join(__dirname,'技术路线总览.drawio'),`<mxfile host="app.diagrams.net"><diagram name="技术路线总览"><mxGraphModel dx="1400" dy="700" grid="1" gridSize="10" page="1" pageWidth="1450" pageHeight="600"><root>${cells.join('')}</root></mxGraphModel></diagram></mxfile>`);


