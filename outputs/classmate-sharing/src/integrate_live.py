from pathlib import Path
import json,hashlib
from PIL import Image
r=Path(__file__).absolute().parent; out=r.parent; assets=out/'assets'/'live'
crops={
 'moment-detail':('03-beam-moment.jpg',(246,70,957,470)),
 'shear-detail':('06-shear.jpg',(246,70,957,470)),
 'load-detail':('07-load-properties.jpg',(962,72,1280,335)),
 'beam-model':('07-load-properties.jpg',(246,70,957,695)),
 'derivation-detail':('04-derivation.jpg',(8,505,1273,694)),
 'end-force-detail':('05-element-results.jpg',(6,506,1273,600)),
 'space-detail':('11-space-results.jpg',(247,70,958,694)),
 'space-table':('11-space-results.jpg',(968,297,1265,679)),
}
manifest=[]
for name,(source,box) in crops.items():
 f=assets/(name+'.png');Image.open(str(assets/source)).crop(box).save(str(f))
 manifest.append({'file':f.name,'source':source,'crop_xyxy':box,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'review':'source screenshot inspected; content unchanged'})
(assets/'crop-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
t=(r/'build-v2.cjs').read_text(encoding='utf-8')
t=t.replace('拉压弯扭大师_同学分享_视觉增强版.pptx','拉压弯扭大师_同学分享_实机截图版.pptx').replace('讲稿与现场演示_增强版.md','讲稿与现场演示_实机版.md')
idx=t.index('function beam(')
t=t[:idx]+'''function shot(s,file,x,y,w,h,label){rect(s,x-.035,y-.035,w+.07,h+.07,'BCCBD4');s.addImage({path:path.join(out,'assets/live',file),x,y,w,h,objectName:`live-${file}`,altText:`本地程序运行截图：${label}`});}
function side(s,x,y,w,num,title,body){rect(s,x,y,w,.34,C.ink);tx(s,num,x+.12,y+.07,w-.24,.2,10,'DCE9E4',true);tx(s,title,x,y+.55,w,.5,22,C.teal,true);tx(s,body,x,y+1.24,w,2.05,17,C.gray);}
''' +t[idx:]
pages={
4:'''s=base(4,'真实工作区：模型、视图、属性并排联动','实机 · 界面导航');
shot(s,'01-workspace.jpg',.62,1.98,8.6,4.84,'二维刚架工作区');
side(s,9.55,2.04,3.15,'01 / WORKSPACE','按对象组织操作','左侧：节点、构件与条件\\n中部：受力与结果视图\\n右侧：属性和显示开关\\n\\n先选对象，再检查参数\\n底部状态栏反馈求解状态');
tx(s,'本地已有离线构建的实际运行画面；界面标识2.0，项目包版本2.0.2。',9.55,6.05,3.15,.72,12,C.gray);
note(s,4,'【50秒】这一页已替换为本地已有dist构建的真实运行截图。展示二维刚架而非默认简支梁。左模型树、中视图区、右属性栏均来自程序。当前截图环境的部分工具栏图标显示为方框，文字及结果可读，未修改截图伪装图标。');
''',
5:'''s=base(5,'同一根梁，切换剪力图与弯矩图','实机 · 后处理');
shot(s,'shear-detail.png',.65,2.15,5.88,3.31,'简支梁剪力图局部');shot(s,'moment-detail.png',6.83,2.15,5.88,3.31,'简支梁弯矩图局部');
tx(s,'剪力 V / 左右段幅值 9 kN',.68,5.64,5.8,.4,21,'557969',true);tx(s,'弯矩 M / 跨中标注 −27 kN·m',6.86,5.64,5.8,.4,21,C.teal,true);
rect(s,.65,6.25,12.06,.47,C.mint);tx(s,'观察顺序：集中力位置 → 剪力跳变 → 弯矩峰值 → 对照解析解',.85,6.36,11.65,.25,17,C.teal,true);
note(s,5,'【55秒】两个局部截图来自同一个已求解的6米简支梁。先看剪力图两段的幅值，再看弯矩图跨中极值。保留实际坐标、荷载与符号，不把负号改成正号。原始全图和裁剪范围均保存。');
''',
6:'''s=base(6,'默认案例如何组织：一个单元、跨中集中力','实机 · 建模检查');
shot(s,'beam-model.png',.65,2.05,6.5,4.63,'模型和剪力结果视口');
shot(s,'load-detail.png',7.47,2.05,2.78,2.3,'单元荷载属性');
tx(s,'模型结构',10.55,2.15,2.25,.45,20,C.teal,true);tx(s,'节点 A / B\\n跨度 6 m\\n单元 E1\\n集中力位置 3 m',10.55,2.95,2.25,1.8,17,C.gray);
rect(s,7.47,4.72,5.31,1.94,C.paper);tx(s,'读题与读模型相互对应',7.69,4.93,4.87,.45,21,C.ink,true);tx(s,'A端约束2个自由度，B端约束1个自由度。\\n本案例采用单元内集中力，无需增设跨中节点。\\n荷载分量、单位和方向以程序属性栏为准。',7.69,5.56,4.87,.83,15,C.gray);
note(s,6,'【65秒】实际默认案例只有A、B两个节点和E1一个单元，集中力通过单元荷载施加在3米处。这纠正了之前采用跨中节点分段的通用演示说法。属性栏显示分量0、-1.800e4、0、3.000，说明负z分量18000N、位置3米。按程序坐标约定读方向，不通过截图外观擅自更改符号。');
''',
7:'''s=base(7,'实机结果与解析解：先核对幅值，再核对符号','实机 · 结果校核');
shot(s,'moment-detail.png',.65,2.1,7.25,4.08,'含反力和弯矩峰值的局部');
rect(s,8.3,2.1,4.43,4.08,C.mint);tx(s,'本次界面读数',8.58,2.4,3.88,.45,24,C.teal,true);tx(s,'两端反力幅值各 9 kN\\n弯矩图跨中标注 −27 kN·m',8.58,3.2,3.88,1.1,22,C.ink,true);tx(s,'解析幅值：18 × 6 ÷ 4 = 27\\n与本次显示幅值一致\\n\\n弯矩符号遵循软件局部坐标约定',8.58,4.68,3.88,1.12,16,C.gray);
tx(s,'校核范围：此默认案例的显示幅值对照；不代表全部工况或整体精度认证。',.7,6.45,12,.3,13,C.gray);
note(s,7,'【65秒】本次确实运行了默认二维案例，状态为二维求解完成。图中两端反力幅值9和跨中弯矩-27清楚可读。解析弯矩幅值27与显示一致，负号按软件约定。单元结果表端弯矩为0并不矛盾，最大弯矩在单元内部。这里只完成该默认案例的界面数值对照，不宣称全软件计算验证。');
''',
8:'''s=base(8,'教学助手：把图形、平衡关系与边界条件连接起来','实机 · 分步推导');
shot(s,'04-derivation.jpg',.65,2.05,7.45,4.19,'教学助手分步推导全界面');
side(s,8.48,2.05,4.2,'02 / EXPLAIN','推导入口就在结果旁','① 选择“教学助手”\\n② 切换“分步推导”\\n③ 查看平衡关系和符号约定\\n④ 下滚检查边界与内力摘要');
tx(s,'演示时让同学先说明受力与约束，再借助助手核对。',.7,6.5,12,.3,17,C.teal,true);
note(s,8,'【55秒】截图已点击教学助手的分步推导，显示整体平衡、局部轴与内力关系。通过界面读取还看到了A端Dx/Dz约束、Ry自由，B端Dz约束、Dx/Ry自由，以及内力摘要9kN和27kNm。助手中“位移约束”计数0与下方支座自由度表是不同字段口径，不将该计数解释为没有支座。');
''',
9:'''s=base(9,'空间刚架：真实三维变形与节点结果','实机 · 三维求解');
shot(s,'space-detail.png',.65,2.02,5.1,4.48,'空间刚架位移图层');shot(s,'space-table.png',6.02,2.02,3.46,4.45,'节点位移与杆件轴力表');
side(s,9.8,2.05,2.98,'03 / SPACE','已执行本地求解','4个节点、3个空间构件\\nQ235 / 箱形截面\\n节点六自由度\\n\\n位移图层：放大2.4倍\\n结果属于空间杆系');
tx(s,'变形为放大显示，不能按截图像素读取真实位移；并非实体连续应力云图。',.7,6.63,12,.22,12,C.gray);
note(s,9,'【60秒】从帮助载入默认3D空间悬臂刚架，点击本地求解，求解结果OK。节点4、构件3、总DOF24。截图显示位移图层、自动2.4倍变形，并保留节点结果和杆件轴力表。当前显示不是实体应力云图。界面明确本次使用Worker CPU，GPU只是能力检测可用。');
''',
12:'''s=base(12,'从默认案例开始，带着一个问题体验','实机 · 一起改进');
shot(s,'02-guide.jpg',.65,2.06,7.85,4.42,'使用指导与默认案例弹窗');
side(s,8.87,2.06,3.85,'START / FEEDBACK','推荐上手顺序','帮助 → 使用指导与默认案例\\n2D简支梁 / 3D空间刚架\\n确认条件 → 求解 → 校核\\n\\n反馈附上：模型、单位、截图\\n说清哪一步不直观或不一致');
tx(s,'先预测，再操作，最后解释你看到的变化。',.7,6.63,12,.25,18,C.teal,true);
note(s,12,'【45秒】已用真实引导弹窗替换文字卡片。可随时从帮助打开指导，二维载入后自动求解，三维载入后点击本地求解。实际操作都发生在独立本地浏览器会话，未修改用户已有项目。');
''',
}
for n,body in pages.items():
 start=t.index(f's=base({n},'); end=t.index(f's=base({n+1},',start)
 t=t[:start]+body+t[end:]
t=t.replace('第6—7页可切到软件做现场演示；若现场条件不允许，使用解析示意完成讲解。','第4—9、12页已加入实机截图；第6—7页适合切到软件现场演示。截图来自本地已有离线构建，不代表安装包界面的独立验收。')
(r/'build-v3.cjs').write_text(t,encoding='utf-8')
