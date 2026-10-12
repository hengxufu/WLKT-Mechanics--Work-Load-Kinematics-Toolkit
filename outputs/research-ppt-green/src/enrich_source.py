from pathlib import Path
import re
W=Path(__file__).resolve().parents[1]
p=W/'src/design.cjs'; s=p.read_text(encoding='utf8')
s=s.replace("s.background={color:C.white};", "s.background={color:'F7FAFE'};panel(s,.35,1.86,12.63,4.96,C.white,'content-canvas');")
s=s.replace("panel(s,0,0,13.333,.7,C.blue", "panel(s,0,0,13.333,.7,'083B68'")
s=s.replace("text(s,String(num),x,y+.055,.34,.21,13,C.white,true);", "s.addText(String(num),{x,y:y+.055,w:.34,h:.21,fontFace:'Times New Roman',fontSize:13,color:C.white,bold:true,margin:0,align:'center',objectName:id(s)});")
s=s.replace("s.addTable(rows,{", "rows=rows.map((row,i)=>row.map(v=>({text:String(v),options:{fill:i===0?C.blue:i%2?'F0F6FC':C.white,color:i===0?C.white:C.navy,bold:i===0}})));s.addTable(rows,{")
# Native engineering motifs limited to title area, not counted as substantive objects.
s=s.replace("text(s,plan.title,.45,.98,12.4,.62,28", "line(s,.48,1.63,1.05,1.63,C.orange,3);line(s,1.13,1.63,12.85,1.63,C.line,.8);text(s,plan.title,.45,.98,12.4,.62,28")
p.write_text(s,encoding='utf8')
p=W/'src/build.cjs';s=p.read_text(encoding='utf8')
cases={
1:r""" t(s,'从力学概念',.65,2.02,7.0,.68,37,C.navy,true);t(s,'到可验证计算',.65,2.86,7.0,.76,40,C.blue,true);
 t(s,'本地离线材料力学学习软件',.69,3.88,6.7,.42,24,C.teal,true);
 ['模型：节点 / 材料 / 截面','响应：内力 / 变形 / 反力','解释：公式 / 推导 / 核验'].forEach((v,i)=>{l(s,.72,4.64+i*.43,.95,4.64+i*.43,C.orange,2);t(s,v,1.1,4.5+i*.43,5.8,.31,18,C.navy)});
 r(s,7.7,1.98,4.82,3.78,'E4F0FA');shot(s,'01-workspace.jpg',8.0,2.43,4.2,2.35,'cover-workspace');
 t(s,'真实工作区 · 二维 / 空间杆系',8.0,5.08,4.2,.3,16,C.blue,true);
 ['本地离线','v2.0.2','同学分享'].forEach((v,i)=>tag(s,v,.7+i*2.1,6.0,1.88));
 t(s,'概念飘带仅作装饰',9.85,6.38,2.5,.23,11,C.gray);break;
""",
2:r""" const probs=[['建模抽象','支座究竟约束什么？','节点 / 单元 / 自由度','先画条件，再建立模型'],['符号难读','负弯矩是否表示错误？','局部坐标 / 正负约定','先辨符号，再比较幅值'],['可信度判断','求解完成就足够吗？','平衡关系 / 解析对照','先作预测，再核对结果']];
 probs.forEach((v,i)=>{let x=.65+i*4.15;r(s,x,2.05,3.85,3.45,i===1?'E5F3F2':C.pale);t(s,'0'+(i+1),x+.2,2.27,1,.5,30,i===1?C.teal:C.blue,true);t(s,v[0],x+.2,2.99,3.42,.4,23,C.navy,true);t(s,v[1],x+.2,3.62,3.42,.55,19,C.navy);l(s,x+.22,4.34,x+3.52,4.34,C.line,1);t(s,v[2],x+.2,4.61,3.42,.4,17,C.teal,true);t(s,v[3],x+.2,5.82,3.42,.52,18,C.blue,true)});
 t(s,'学习闭环：条件 → 模型 → 响应 → 解释 → 回到条件',.87,6.48,11.5,.25,15,C.gray);break;
""",
3:r""" const fields=[['拉伸','N → σ → ΔL','σ = N / A','ΔL = NL / EA','轴力与长度变化'],['压缩','N → σ → ΔL','σ = N / A','压缩取符号约定','短柱概念，非失稳分析'],['弯曲','V → M → σ、w','σmax = M / W','EI 控制挠度','关注危险截面位置'],['扭转','T → τ → φ','τmax = T / Wt','φ = TL / GJ','均匀圆轴、小变形']];
 fields.forEach((v,i)=>{let x=.65+i*3.12;r(s,x,2.04,2.85,4.57,i%2?'E8F4F3':C.pale);t(s,'0'+(i+1),x+.17,2.22,.55,.34,18,C.blue,true);t(s,v[0],x+.9,2.21,1.7,.45,24,C.navy,true);t(s,v[1],x+.16,4.1,2.53,.35,18,C.teal,true);t(s,v[2],x+.16,4.69,2.53,.4,21,C.navy);t(s,v[3],x+.16,5.36,2.53,.43,17,C.navy);l(s,x+.17,5.98,x+2.67,5.98,C.line,.8);t(s,v[4],x+.16,6.18,2.53,.28,12,C.gray)});break;
""",
8:r""" shot(s,'moment-detail.png',.65,2.08,6.25,3.52,'validation-evidence');
 t(s,'解析期望 ↔ 实机读数',7.24,2.1,4.1,.42,24,C.blue,true);
 table(s,[['核验项','解析幅值','界面幅值'],['A端反力','9 kN','9 kN'],['B端反力','9 kN','9 kN'],['跨中弯矩','27 kN·m','27 kN·m']],7.24,2.9,5.28,2.42,[1.78,1.75,1.75],'validation-table',16);
 [['条件','6 m / 跨中18 kN'],['符号','图中−27遵循软件约定'],['位置','端弯矩0，内部峰值27']].forEach((v,i)=>{let x=.7+i*4.15;tag(s,v[0],x,5.99,.83);t(s,v[1],x+1.02,6.02,2.89,.5,15,C.navy)});
 t(s,'结论限于默认案例的显示幅值对照，尚非全工况精度认证。',.85,6.63,11.6,.21,12,C.gray);break;
""",
10:r""" shot(s,'derivation-detail.png',4.66,2.1,7.83,1.6,'derivation-evidence');
 [['受力分析','隔离结构，列出外力与支座'],['整体平衡','ΣFx=0，ΣFz=0，ΣMy=0'],['截面内力','dV/dx+qz=0；dM/dx−V=0'],['结果检查','比较边界值、峰值与单位']].forEach((v,i)=>{let y=2.13+i*1.08;r(s,.67,y,3.55,.87,i%2?'E3F2F1':C.pale);label(s,i+1,v[0],.86,y+.2,3.1);if(i<3)l(s,2.4,y+.89,2.4,y+1.05,C.teal,1.5,true);t(s,v[1],4.8,4.15+i*.57,7.1,.32,18,C.navy)});
 t(s,'教学助手：让每一步都有可核对的物理含义',4.8,3.82,7.0,.3,19,C.blue,true);break;
""",
13:r""" r(s,4.85,2.23,3.55,3.98,'E2F0F8');t(s,'本地计算核心',5.05,4.6,3.12,.42,22,C.blue,true);t(s,'单元组装 / 约束分块\n位移 → 反力与端力',5.05,5.29,3.12,.64,16,C.navy);
 [['模型数据','节点、材料、截面\n约束与荷载',.7,2.12],['可视交互','Vue 3 / TypeScript\nThree.js 视图',8.95,2.12],['学习解释','公式库 / 分步推导\n内力与结果表',.7,4.65],['离线交付','Electron / PWA\nWorker CPU + sparse LU',8.95,4.65]].forEach((v,i)=>{r(s,v[2],v[3],3.67,1.59,i%2?'E6F3F1':C.pale);t(s,v[0],v[2]+.2,v[3]+.17,3.25,.35,21,C.blue,true);t(s,v[1],v[2]+.2,v[3]+.76,3.25,.63,17,C.navy);l(s,i%2?8.4:4.38,v[3]+.79,i%2?8.9:4.8,v[3]+.79,C.teal,1.6,true)});
 t(s,'WebGPU 仅设备检测；未启用 GPU 数值内核。Worker不可用时回退主线程CPU。',.85,6.55,11.8,.24,13,C.gray);break;
""",
14:r""" const tiers=[['已实现 · 学习功能','二维梁 / 刚架','反力、N / V / M、变形','空间杆系','节点自由度、构件端力','使用前检查条件与符号'],['实验中 · 继续验证','Tet4实验内核','与主编辑器实体链仍待完善','WebGPU能力检测','不等于GPU数值求解','不把界面入口当作成熟能力'],['用途边界 · 如实说明','课堂学习与训练','解析对照、可视化理解','尚非工程认证','不用于设计、鉴定或商业用途','功能存在 ≠ 充分验证']];
 tiers.forEach((v,i)=>{let x=.65+i*4.16;r(s,x,2.06,3.84,4.56,i===1?'E9F4F2':C.pale);t(s,v[0],x+.18,2.28,3.47,.55,20,i===1?C.teal:C.blue,true);[1,3].forEach((j,k)=>{t(s,v[j],x+.2,3.15+k*1.18,3.44,.38,20,C.navy,true);t(s,v[j+1],x+.2,3.7+k*1.18,3.44,.56,16,C.gray)});t(s,v[5],x+.2,6.09,3.44,.35,14,C.blue,true)});break;
""",
16:r""" t(s,'把“看见结果”推进到“解释结果”',.75,2.1,11.8,.65,33,C.blue,true);
 [['01','可视化建模','把条件转成节点与构件','已见：二维与空间工作区'],['02','结果解释','联系内力图、公式与危险位置','已见：默认梁幅值对照'],['03','独立核验','平衡关系与解析解交叉检查','已见：空间三向力平衡']].forEach((v,i)=>{let x=.7+i*4.15;r(s,x,3.25,3.82,2.56,i%2?'E2F3F0':C.pale);t(s,v[0],x+.2,3.44,.7,.42,26,C.teal,true);t(s,v[1],x+.2,4.12,3.4,.4,23,C.navy,true);t(s,v[2],x+.2,4.77,3.4,.57,17,C.navy);t(s,v[3],x+.2,5.43,3.4,.26,12,C.gray)});
 t(s,'下一步',.82,6.18,1.3,.34,19,C.teal,true);t(s,'补充边界与荷载组合 → 建立回归算例 → 完善空间分析与完整力矩核验',2.25,6.16,10.2,.48,17,C.navy);break;
""",
17:r""" [['轴向拉压','σ=N/A；ΔL=NL/(EA)','N：轴力；A：面积；E：弹性模量','均匀等截面、线弹性；统一N/m/Pa'],['弯曲响应','σmax=M/W；EI控制挠度','M：弯矩；W：抗弯截面系数','线弹性、小变形；截面与边界须匹配'],['圆轴扭转','τmax=T/Wt；φ=TL/(GJ)','T：扭矩；J：极惯性矩；G：剪切模量','均匀圆轴、小变形；角度按rad'],['集中力简支梁','RA=P(L−a)/L；Mpeak=Pa(L−a)/L','a：距左支座位置；0<a<L','本稿P=18kN，L=6m；仅解析预测']].forEach((v,i)=>{let x=.65+(i%2)*6.2,y=2.04+Math.floor(i/2)*2.32;r(s,x,y,5.85,2.05,i>1?'E6F3F1':C.pale);tag(s,String(i+1),x+.18,y+.17,.5);t(s,v[0],x+.9,y+.17,4.7,.37,22,C.blue,true);t(s,v[1],x+.2,y+.77,5.42,.4,20,C.navy);t(s,v[2],x+.2,y+1.34,5.42,.28,14,C.navy);t(s,v[3],x+.2,y+1.75,5.42,.23,12,C.gray)});break;
""",
18:r""" [['实机已观察','二维梁9/9kN与27kN·m幅值；空间三向力平衡','本地实机截图与运行记录'],['解析预测','荷载位置a=1/2/3m的反力与弯矩趋势','sources/native-data.json，非新增测量'],['实验与缺项','Tet4实验；完整力矩核验待补；GPU仅检测','README及求解能力审计'],['视觉协作','网页规划与逐项独立素材生成，模型名未核验','用户授权当前网页版继续']].forEach((v,i)=>{let y=2.02+i*1.08;tag(s,'0'+(i+1),.7,y,.55);t(s,v[0],1.45,y+.01,2.2,.38,21,C.blue,true);t(s,v[1],3.9,y+.01,8.4,.4,18,C.navy);t(s,v[2],3.9,y+.58,8.4,.23,12,C.gray);l(s,1.45,y+.89,12.52,y+.89,C.line,.8)});
 t(s,'欢迎带着模型、单位和截图交流：先定位条件，再判断差异。',.85,6.49,11.7,.29,18,C.teal,true);break;
"""}
for n,v in cases.items():
 pattern=rf'case {n}:\n[\s\S]*?(?=case {n+1}:|\}}\}}\nif\(!editDemo\))'
 s,count=re.subn(pattern,lambda m:f'case {n}:\n'+v,s,count=1)
 assert count==1,n
# Add meaningful explanatory details to remaining pages without touching screenshots/data.
s=s.replace("case 5:\n", "case 5:\n t(s,'典型交互：选中对象 → 修改属性 → 观察视图 → 核对结果',.7,1.74,11.9,.22,13,C.teal,true);\n")
s=s.replace("case 7:\n", "case 7:\n t(s,'沿梁读取：A端 → 集中力左侧 → 集中力右侧 → B端；先辨符号，再比较幅值。',.7,1.72,12,.2,12,C.gray);\n")
s=s.replace("case 11:\n", "case 11:\n t(s,'4 × 6 = 24：约束处理前节点自由度总数，不等于24个有效自由度。',6.2,1.71,6.3,.22,12,C.teal,true);\n")
s=s.replace("case 12:\n", "case 12:\n t(s,'核验步骤：读取外力 → 读取总反力 → 逐方向求和 → 明确未检查的力矩。',.7,1.73,11.9,.21,12,C.teal,true);\n")
# User minimum15: add content landmarks on chart page, table treated as one object elsewhere.
s=s.replace("case 9:\n", "case 9:\n ['a=1m：反力偏向左端','a=2m：分配逐渐均衡','a=3m：对称且弯矩幅值最大'].forEach((v,i)=>tag(s,v,.72+i*4.15,1.75,3.8));\n")
s=s.replace("p.title='拉压弯扭大师｜中国科研分享重制版'", "p.title='拉压弯扭大师｜视觉与内容增强版'")
p.write_text(s,encoding='utf8')
print('14 layouts substantially rebuilt; all pages receive unified engineering visual system.')
