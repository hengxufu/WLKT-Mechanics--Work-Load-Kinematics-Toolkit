import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const outputDirectory = path.join(projectDirectory, 'output', 'playwright', 'manual-workflow-demo');
const finalVideoPath = path.join(outputDirectory, '拉压弯扭大师-2D-3D逐点击建模操作演示.mp4');
const previewUrl = process.env.DEMO_URL || 'http://127.0.0.1:4173/';
const speed = Number(process.env.DEMO_SPEED || 1);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * speed));

const runProcess = (exe, args) => new Promise((resolve, reject) => {
  const child = spawn(exe, args, { cwd: projectDirectory, stdio: 'inherit', windowsHide: true });
  child.once('error', reject);
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${path.basename(exe)} exited with ${code}`)));
});

const waitForPreview = async (attempts = 50) => {
  for (let i = 0; i < attempts; i += 1) {
    try { if ((await fetch(previewUrl)).ok) return; } catch {}
    await sleep(200);
  }
  throw new Error(`Preview server unavailable: ${previewUrl}`);
};

const installOverlay = async (page) => {
  await page.addStyleTag({ content: `
    #manual-demo {position:fixed;inset:0;z-index:2147483645;pointer-events:none;font-family:"Microsoft YaHei",sans-serif}
    #manual-demo .title{position:absolute;inset:0;display:grid;place-items:center;background:linear-gradient(135deg,rgba(4,18,34,.96),rgba(5,57,79,.91));opacity:0;transition:.3s;color:#fff}
    #manual-demo .title.on{opacity:1}.title-card{width:min(1040px,84vw);padding:46px 54px;border:1px solid #68d0ff77;border-radius:22px;background:#061c30cc;box-shadow:0 30px 90px #0008}
    .title-card b{display:block;color:#70dcff;font-size:20px;letter-spacing:.14em}.title-card h1{font-size:50px;margin:12px 0}.title-card p{font-size:24px;line-height:1.7;color:#d9eaf3}
    #manual-demo .step{position:absolute;left:34px;bottom:32px;max-width:920px;padding:16px 22px;border-left:6px solid #ffcb45;border-radius:8px 16px 16px 8px;background:#071c2eef;color:#fff;box-shadow:0 16px 45px #0007;opacity:0;transform:translateY(12px);transition:.2s}
    #manual-demo .step.on{opacity:1;transform:none}.step b{display:block;font-size:19px;color:#ffdb73;margin-bottom:4px}.step span{font-size:17px;line-height:1.5}
    #manual-demo .chapter{position:absolute;left:34px;top:76px;padding:9px 16px;border:1px solid #59d0ff88;border-radius:999px;background:#071c2eee;color:#bcecff;font-weight:800;font-size:16px}
    #manual-cursor{position:fixed;width:24px;height:24px;border:3px solid #fff;border-radius:50%;background:#ff3d00aa;box-shadow:0 0 0 4px #ffcf4088,0 4px 18px #0008;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);transition:width .08s,height .08s}
    .manual-ripple{position:fixed;width:18px;height:18px;border:4px solid #ffcf40;border-radius:50%;z-index:2147483646;pointer-events:none;transform:translate(-50%,-50%);animation:ripple .55s ease-out forwards}@keyframes ripple{to{width:74px;height:74px;opacity:0}}
    .manual-focus{outline:4px solid #ffcb45!important;outline-offset:4px!important;box-shadow:0 0 0 9px #ffcb4533,0 0 30px #ffcb4588!important;position:relative!important;z-index:2147483644!important}
  `});
  await page.evaluate(() => {
    const root = document.createElement('div'); root.id = 'manual-demo';
    root.innerHTML = '<div class="title"><div class="title-card"><b></b><h1></h1><p></p></div></div><div class="chapter"></div><div class="step"><b></b><span></span></div>';
    document.body.append(root);
    const cursor = document.createElement('div'); cursor.id = 'manual-cursor'; document.body.append(cursor);
    addEventListener('mousemove', (e) => { cursor.style.left=`${e.clientX}px`; cursor.style.top=`${e.clientY}px`; });
    addEventListener('click', (e) => { const r=document.createElement('div'); r.className='manual-ripple'; r.style.left=`${e.clientX}px`; r.style.top=`${e.clientY}px`; document.body.append(r); setTimeout(()=>r.remove(),650); }, true);
  });
};

let stepNo = 0;
const step = async (page, title, body, ms = 700) => {
  stepNo += 1;
  console.log(`[${String(stepNo).padStart(2,'0')}] ${title}`);
  await page.evaluate(({ n, title, body }) => {
    const box=document.querySelector('#manual-demo .step'); box.querySelector('b').textContent=`步骤 ${String(n).padStart(2,'0')}｜${title}`; box.querySelector('span').textContent=body; box.classList.add('on');
  }, { n: stepNo, title, body });
  await sleep(ms);
};
const chapter = (page, text) => page.evaluate((v) => { document.querySelector('#manual-demo .chapter').textContent=v; }, text);
const titleCard = async (page, kicker, title, body, ms=3200) => {
  await page.evaluate(({kicker,title,body}) => { const x=document.querySelector('#manual-demo .title'); x.querySelector('b').textContent=kicker;x.querySelector('h1').textContent=title;x.querySelector('p').textContent=body;x.classList.add('on'); }, {kicker,title,body});
  await sleep(ms); await page.evaluate(()=>document.querySelector('#manual-demo .title').classList.remove('on')); await sleep(400);
};
const center = async (locator) => { await locator.scrollIntoViewIfNeeded(); const b=await locator.boundingBox(); if(!b) throw new Error('No bounding box'); return {x:b.x+b.width/2,y:b.y+b.height/2}; };
const click = async (page, locator, title, body, settle=550) => {
  await step(page,title,body); await locator.evaluate((e)=>e.scrollIntoView({block:'center',inline:'center'})); await locator.evaluate((e)=>e.classList.add('manual-focus')).catch(()=>{});
  const p=await center(locator); await page.mouse.move(p.x,p.y,{steps:18}); await sleep(250); await page.mouse.click(p.x,p.y); await sleep(settle);
  await locator.evaluate((e)=>e.classList.remove('manual-focus')).catch(()=>{});
};
const enter = async (page, locator, value, title, body) => {
  await click(page,locator,title,body,200); await page.keyboard.press('Control+A'); await page.keyboard.type(String(value),{delay:Math.max(4,45*speed)}); await sleep(350);
};
const choose = async (page, label, option, scope=page) => {
  const field=scope.getByLabel(label,{exact:true}).last(); await click(page,field,`打开“${label}”列表`,`单击下拉框，再选择 ${option}。`,220);
  const overlay=page.locator('.v-overlay--active').last();
  await click(page,overlay.getByText(String(option),{exact:true}).last(),`选择 ${option}`,`把“${label}”设置为 ${option}。`,350);
};
const menu = async (page, heading, item) => {
  await click(page,page.getByText(heading,{exact:true}).first(),`打开“${heading}”菜单`,`鼠标移到顶部菜单并单击。`,180);
  await click(page,page.getByText(item,{exact:true}).last(),`单击“${item}”`,`进入对应的设置对话框。`,400);
};

const add2dNode = async (page, x, z, fixed=false) => {
  await menu(page,'建模','创建节点'); const d=page.getByRole('dialog'); const inputs=d.locator('input[type="text"]');
  await enter(page,inputs.nth(0),x,'输入 X 坐标',`本节点 X = ${x} m。`); await enter(page,inputs.nth(1),z,'输入 Z 坐标',`本节点 Z = ${z} m。`);
  if(fixed) for(const name of ['Dx','Dz','Ry']) await click(page,d.getByRole('checkbox',{name,exact:true}),`勾选约束 ${name}`,'固定该自由度。',220);
  await click(page,d.getByRole('button',{name:'添加节点',exact:true}),`确认添加节点`,`保存坐标${fixed?'和固定端约束':''}。`,500);
};
const add2dBeam = async (page, a, b) => {
  await menu(page,'建模','创建梁单元'); const d=page.getByRole('dialog');
  await choose(page,'起始节点',a,d); await choose(page,'终止节点',b,d); await choose(page,'材料','1',d); await choose(page,'截面','1',d);
  await click(page,d.getByRole('button',{name:'添加单元',exact:true}),`确认添加梁 ${a}—${b}`,'由起点、终点、材料和截面生成梁单元。',550);
};

const record = async () => {
  await stat(path.join(projectDirectory,'dist','index.html')); await mkdir(outputDirectory,{recursive:true});
  let server; try{await waitForPreview(1);}catch{server=spawn(process.execPath,['scripts/serve-dist.mjs','dist','4173'],{cwd:projectDirectory,windowsHide:true});await waitForPreview();}
  let browser; try{browser=await chromium.launch({channel:'msedge',headless:true});}catch{browser=await chromium.launch({headless:true});}
  const context=await browser.newContext({viewport:{width:1920,height:1080},screen:{width:1920,height:1080},deviceScaleFactor:1,locale:'zh-CN',colorScheme:'dark',recordVideo:{dir:outputDirectory,size:{width:1920,height:1080}}});
  const page=await context.newPage(); const video=page.video();
  page.setDefaultTimeout(8000);
  try{
    await page.goto(previewUrl,{waitUntil:'networkidle'}); await installOverlay(page);
    await titleCard(page,'逐点击操作版 · 含普通话配音','2D 与 3D 从零建模','每一次菜单单击、字段输入、下拉选择、节点拖动、载荷调整和求解操作都在画面中标注。');
    const guide=page.getByRole('checkbox',{name:'载入后开始界面导览'}); if(await guide.isChecked()) await click(page,guide,'关闭自动导览','保持画面稳定，改用逐点击教学。',250);
    await chapter(page,'01 · 2D 从空白模型开始');
    await click(page,page.locator('button.welcome-example--2d'),'进入二维工作区','先载入工作区，再清空示例，得到空白模型。',700);
    await menu(page,'文件','清空当前模型'); const confirm=page.getByRole('dialog');
    await click(page,confirm.getByRole('checkbox',{name:'删除材料'}),'同时删除材料','勾选后从完全空白的材料库开始。',200);
    await click(page,confirm.getByRole('checkbox',{name:'删除截面'}),'同时删除截面','勾选后从完全空白的截面库开始。',200);
    await click(page,confirm.getByRole('button',{name:'确认'}),'确认清空','删除示例的节点、梁、载荷、材料和截面。',600);

    await chapter(page,'02 · 2D 材料、截面、节点与约束');
    await menu(page,'建模','定义材料'); let d=page.getByRole('dialog'); let ins=d.locator('input[type="text"]');
    for(const [i,v,t] of [[0,'210000','弹性模量 E'],[1,'81000','剪切模量 G'],[2,'7850','密度'],[3,'0.000012','线膨胀系数']]) await enter(page,ins.nth(i),v,`设置${t}`,`输入 ${v}，单位以字段右侧显示为准。`);
    await click(page,d.getByRole('button',{name:'添加材料'}),'保存材料 1','完成第一种钢材定义。',500);
    await menu(page,'建模','定义截面'); d=page.getByRole('dialog'); ins=d.locator('input[type="text"]');
    for(const [i,v,t] of [[0,'0.012','面积 A'],[1,'0.00018','惯性矩 Iy'],[2,'0.30','截面高度 h'],[3,'0.85','剪切系数 k']]) await enter(page,ins.nth(i),v,`设置${t}`,`输入 ${v}。`);
    await click(page,d.getByRole('button',{name:'添加截面'}),'保存截面 1','完成梁截面定义。',500);
    await add2dNode(page,0,0,true); await add2dNode(page,4,0,false); await add2dNode(page,4,-3,false);
    await menu(page,'视图','适应窗口');
    await add2dBeam(page,'1','2'); await add2dBeam(page,'2','3'); await menu(page,'视图','适应窗口');

    await chapter(page,'03 · 2D 拖动节点与设置外载荷');
    const node2=page.locator('.nodes .node .handle[data-node-id="2"]').last(); const p=await center(node2);
    await step(page,'按住节点 2 并拖动','黄色高亮处先按下左键，移动鼠标后再松开；连接梁会实时跟随。',900);
    await page.mouse.move(p.x,p.y,{steps:15}); await page.mouse.down(); await page.mouse.move(p.x+65,p.y-42,{steps:32}); await page.mouse.up(); await sleep(1100);
    await menu(page,'载荷','集中力 / 力矩'); d=page.getByRole('dialog');
    await choose(page,'节点','3',d); ins=d.locator('input[type="text"]');
    await enter(page,ins.nth(0),'-6','设置水平力 Fx','负号代表指向全局 X 负方向。'); await enter(page,ins.nth(1),'-12','设置竖向力 Fz','负号改变箭头方向，大小为 12 kN。'); await enter(page,ins.nth(2),'2.5','设置节点力矩 My','正负号控制顺、逆时针方向。');
    await click(page,d.getByRole('button',{name:'添加节点荷载'}),'保存节点荷载','将三分量荷载施加到节点 3。',700);
    const loadHandle=page.locator('.nodal-loads .handle, .node-loads .handle, [data-nodal-load-id]').first();
    if(await loadHandle.count()){
      await click(page,loadHandle,'选中并双击荷载箭头','双击载荷图形打开编辑对话框。',150); await loadHandle.dblclick(); await sleep(400);
      if(await page.getByRole('dialog').count()){
        d=page.getByRole('dialog'); ins=d.locator('input[type="text"]'); await enter(page,ins.nth(1),'-18','修改 Fz 大小与方向','把 Fz 改为 -18 kN；改成正值即可反转方向。');
        await click(page,d.getByRole('button',{name:'编辑节点荷载'}),'保存荷载修改','重新求解并刷新箭头。',700);
      }
    }
    await click(page,page.getByRole('button',{name:'求解',exact:true}).first(),'执行二维求解','检查边界条件并计算位移、反力与内力。',900);
    await click(page,page.getByRole('button',{name:'弯矩 M',exact:true}).last(),'查看弯矩图','单击结果图层，检查危险截面。',900);

    await chapter(page,'04 · 3D 从零摆放节点和杆件');
    await menu(page,'帮助','使用指导与默认案例');
    const guide3d=page.getByRole('checkbox',{name:'载入后开始界面导览'}); if(await guide3d.isChecked()) await click(page,guide3d,'关闭三维自动导览','继续使用逐点击教学标注。',200);
    await click(page,page.locator('button.welcome-example--3d'),'切换到 3D 求解器','进入空间刚架建模与有限元求解界面。',900);
    await click(page,page.getByTitle('清空空间模型'),'清空三维模型','从零演示空间节点和杆件。',600);
    const last=(label)=>page.getByLabel(label,{exact:true}).last();
    for(const [label,value] of [['材料编号','Q355'],['材料名称','结构钢 Q355'],['E / Pa','210000000000'],['G / Pa','81000000000'],['屈服强度 / Pa','355000000'],['截面编号','BOX300'],['截面名称','箱形截面'],['A / m²','0.012'],['Iy / m⁴','0.00018'],['Iz / m⁴','0.00016'],['J / m⁴','0.00025']]) await enter(page,last(label),value,`设置 ${label}`,`输入 ${value}。`);
    await click(page,page.getByRole('button',{name:'添加',exact:true}).last(),'添加材料与截面','把 Q355 与 BOX300 写入三维模型。',700);
    const add3dNode=async(id,x,y,z,fixed=false)=>{
      for(const [label,value] of [['编号',id],['X / m',x],['Y / m',y],['Z / m',z]]) await enter(page,last(label),value,`节点 ${id}：${label}`,`输入 ${value}。`);
      const constraints=['约束 Ux','约束 Uy','约束 Uz','约束 Rx','约束 Ry','约束 Rz'];
      if(fixed) {
        for(const n of constraints) await click(page,page.getByRole('checkbox',{name:n,exact:true}).last(),`节点 ${id}：${n}`,'固定该空间自由度。',160);
      } else {
        for(const n of constraints) {
          const box=page.getByRole('checkbox',{name:n,exact:true}).last();
          if(await box.isChecked()) await click(page,box,`节点 ${id}：取消${n.replace('约束 ','')}约束`,'表单会保留上一节点状态；自由节点必须逐项取消继承的约束。',160);
        }
      }
      await click(page,page.getByRole('button',{name:'添加节点',exact:true}).last(),`添加节点 ${id}`,`坐标为 (${x}, ${y}, ${z}) m。`,480);
    };
    await add3dNode('N1',0,0,0,true); await add3dNode('N2',3,0,0); await add3dNode('N3',3,2,0); await add3dNode('N4',3,2,2);
    const addMember=async(id,a,b)=>{
      await enter(page,last('杆件编号'),id,`输入杆件 ${id} 编号`,`本杆件连接 ${a} 与 ${b}。`); await choose(page,'起点',a); await choose(page,'终点',b); await choose(page,'材料','结构钢 Q355'); await choose(page,'截面','箱形截面');
      await click(page,page.getByRole('button',{name:'添加杆件',exact:true}).last(),`添加杆件 ${id}`,'生成空间梁柱单元。',500);
    };
    await addMember('M1','N1','N2'); await addMember('M2','N2','N3'); await addMember('M3','N3','N4');

    await chapter(page,'05 · 3D 载荷位置、大小、方向与视角拖动');
    await enter(page,last('载荷编号'),'L1','输入载荷编号','创建自由端组合荷载。'); await choose(page,'作用节点','N4');
    for(const [label,value] of [['Fx / N','12000'],['Fy / N','-8000'],['Fz / N','-18000'],['Mx / N·m','2500'],['My / N·m','0'],['Mz / N·m','0']]) await enter(page,last(label),value,`设置 ${label}`,`输入 ${value}；正负号决定方向。`);
    await click(page,page.getByRole('button',{name:'添加荷载',exact:true}).last(),'添加 L1','荷载作用在 N4。',600);
    await click(page,page.getByTitle('删除荷载').last(),'删除 L1 以调整位置','当前 3D 编辑器通过删除并重建来更换作用节点。',450);
    await enter(page,last('载荷编号'),'L2','输入新载荷编号','重建调整后的荷载。'); await choose(page,'作用节点','N3');
    for(const [label,value] of [['Fx / N','-9000'],['Fy / N','6000'],['Fz / N','-14000'],['Mx / N·m','0'],['My / N·m','0'],['Mz / N·m','1800']]) await enter(page,last(label),value,`修改 ${label}`,`新值 ${value}，同时演示大小和方向改变。`);
    await click(page,page.getByRole('button',{name:'添加荷载',exact:true}).last(),'添加调整后的 L2','作用点由 N4 改到 N3。',650);
    const canvas=page.locator('canvas').last(); const c=await center(canvas);
    await step(page,'拖动 3D 视图旋转观察','在三维画布中按住左键拖动；这是相机环绕，不改变节点坐标。',1000); await page.mouse.move(c.x,c.y); await page.mouse.down(); await page.mouse.move(c.x+220,c.y-95,{steps:45}); await page.mouse.up(); await sleep(1000);
    for(const v of ['前','右','俯','轴测']) { const b=page.getByRole('button',{name:v,exact:true}).last(); if(await b.count()) await click(page,b,`切换到${v}视图`,'用标准方向核对空间拓扑。',350); }
    await click(page,page.getByRole('button',{name:'本地求解',exact:true}).last(),'执行三维本地求解','组装空间刚架刚度矩阵并计算六自由度响应。',1200);
    await page.getByText(/求解完成/).last().waitFor({timeout:15000}).catch(()=>{});
    const results=page.getByRole('tab',{name:'结果',exact:true}).last(); if(await results.count()) await click(page,results,'打开三维结果页','查看位移、支座反力和构件端力。',900);
    await titleCard(page,'从空白模型到可追溯结果','逐点击操作演示完成','二维：材料、截面、节点、约束、梁、拖动、载荷与结果；三维：XYZ 摆放、六自由度约束、空间杆件、载荷迁移、视角拖动与求解。',4200);
  } finally { await page.close(); await context.close(); await browser.close(); if(server) server.kill(); }
  const raw=await video.path(); await runProcess(ffmpegPath,['-y','-i',raw,'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart','-r','30','-an',finalVideoPath]); await unlink(raw).catch(()=>{});
  console.log(`Manual workflow demo exported: ${finalVideoPath}`);
};
record().catch((e)=>{console.error(e);process.exitCode=1;});
