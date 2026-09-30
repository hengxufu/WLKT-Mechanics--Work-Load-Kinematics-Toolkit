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
const outputDirectory = path.join(projectDirectory, 'output', 'playwright', 'teaching-demo');
const finalVideoPath = path.join(outputDirectory, '拉压弯扭大师-2D-3D全流程教学演示.mp4');
const previewUrl = process.env.DEMO_URL || 'http://127.0.0.1:4173/';
const delayScale = Number(process.env.DEMO_SPEED || 1);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds * delayScale));

const waitForPreview = async (url, attempts = 50) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The preview server may still be starting.
    }
    await sleep(200);
  }
  throw new Error(`Preview server did not become ready: ${url}`);
};

const ensureBuildExists = async () => {
  const indexPath = path.join(projectDirectory, 'dist', 'index.html');
  try {
    await stat(indexPath);
  } catch {
    throw new Error('dist/index.html is missing. Run `npm run build` before recording.');
  }
};

const runProcess = (executable, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, { cwd: projectDirectory, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(executable)} exited with code ${code}`));
    });
  });

const installDemoChrome = async (page) => {
  await page.addStyleTag({
    content: `
      #codex-demo-overlay { position: fixed; inset: 0; z-index: 2147483645; pointer-events: none; font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; }
      #codex-demo-overlay .demo-title-card { position: absolute; inset: 0; display: grid; place-items: center; background: linear-gradient(135deg, rgba(5,18,34,.94), rgba(11,54,78,.86)); color: #fff; opacity: 0; transition: opacity .35s ease; }
      #codex-demo-overlay .demo-title-card.visible { opacity: 1; }
      #codex-demo-overlay .demo-title-card__content { width: min(980px, 82vw); padding: 46px 56px; border: 1px solid rgba(133,210,255,.44); border-radius: 22px; background: rgba(4,21,38,.64); box-shadow: 0 28px 90px rgba(0,0,0,.42); backdrop-filter: blur(12px); }
      #codex-demo-overlay .demo-kicker { color: #7ed7ff; font-size: 22px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
      #codex-demo-overlay .demo-title { margin: 12px 0 14px; font-size: 54px; line-height: 1.14; letter-spacing: .01em; }
      #codex-demo-overlay .demo-body { max-width: 840px; color: #dceaf3; font-size: 25px; line-height: 1.7; }
      #codex-demo-overlay .demo-lower-third { position: absolute; left: 44px; bottom: 42px; max-width: 820px; padding: 18px 24px 19px; border-left: 5px solid #39c0ff; border-radius: 7px 14px 14px 7px; background: rgba(5,22,36,.92); color: #fff; box-shadow: 0 18px 44px rgba(0,0,0,.28); opacity: 0; transform: translateY(16px); transition: opacity .25s ease, transform .25s ease; backdrop-filter: blur(10px); }
      #codex-demo-overlay .demo-lower-third.visible { opacity: 1; transform: translateY(0); }
      #codex-demo-overlay .demo-lower-third strong { display: block; margin-bottom: 5px; color: #88ddff; font-size: 21px; }
      #codex-demo-overlay .demo-lower-third span { display: block; font-size: 18px; line-height: 1.55; }
      #codex-demo-overlay .demo-chapter { position: absolute; top: 82px; left: 44px; padding: 9px 15px; border: 1px solid rgba(126,215,255,.55); border-radius: 999px; background: rgba(4,22,37,.86); color: #bcecff; font-size: 17px; font-weight: 800; letter-spacing: .08em; opacity: 0; transition: opacity .25s ease; }
      #codex-demo-overlay .demo-chapter.visible { opacity: 1; }
      .codex-demo-focus { position: relative !important; z-index: 2147483644 !important; outline: 4px solid #ffcc4d !important; outline-offset: 5px !important; box-shadow: 0 0 0 10px rgba(255,204,77,.18), 0 0 36px rgba(255,204,77,.55) !important; transition: outline-color .2s ease, box-shadow .2s ease !important; }
    `,
  });
  await page.evaluate(() => {
    const root = document.createElement('div');
    root.id = 'codex-demo-overlay';
    root.innerHTML = `
      <div class="demo-title-card"><div class="demo-title-card__content"><div class="demo-kicker"></div><div class="demo-title"></div><div class="demo-body"></div></div></div>
      <div class="demo-chapter"></div>
      <div class="demo-lower-third"><strong></strong><span></span></div>`;
    document.body.append(root);
  });
};

const showTitle = async (page, kicker, title, body, milliseconds = 3000) => {
  await page.evaluate(({ kicker, title, body }) => {
    const card = document.querySelector('#codex-demo-overlay .demo-title-card');
    card.querySelector('.demo-kicker').textContent = kicker;
    card.querySelector('.demo-title').textContent = title;
    card.querySelector('.demo-body').textContent = body;
    card.classList.add('visible');
  }, { kicker, title, body });
  await sleep(milliseconds);
  await page.evaluate(() => document.querySelector('#codex-demo-overlay .demo-title-card')?.classList.remove('visible'));
  await sleep(450);
};

const showChapter = async (page, text) => {
  await page.evaluate((value) => {
    const chapter = document.querySelector('#codex-demo-overlay .demo-chapter');
    chapter.textContent = value;
    chapter.classList.add('visible');
  }, text);
};

const showNote = async (page, title, body, milliseconds = 1800) => {
  await page.evaluate(({ title, body }) => {
    const note = document.querySelector('#codex-demo-overlay .demo-lower-third');
    note.querySelector('strong').textContent = title;
    note.querySelector('span').textContent = body;
    note.classList.add('visible');
  }, { title, body });
  await sleep(milliseconds);
  await page.evaluate(() => document.querySelector('#codex-demo-overlay .demo-lower-third')?.classList.remove('visible'));
  await sleep(250);
};

const focus = async (locator) => {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => element.classList.add('codex-demo-focus'));
};

const unfocus = async (locator) => {
  await locator.evaluate((element) => element.classList.remove('codex-demo-focus')).catch(() => {});
};

const clickWithNote = async (page, locator, title, body, settle = 1100) => {
  await focus(locator);
  await showNote(page, title, body, 1200);
  await locator.click();
  await unfocus(locator);
  await sleep(settle);
};

const setOnlyResultLayer = async (page, name) => {
  for (const label of ['变形', '轴力 N', '剪力 V', '弯矩 M']) {
    const checkbox = page.getByRole('checkbox', { name: label, exact: true });
    if ((await checkbox.count()) === 0) continue;
    const shouldBeChecked = label === name;
    if ((await checkbox.isChecked()) !== shouldBeChecked) await checkbox.click();
  }
};

const record = async () => {
  await ensureBuildExists();
  await mkdir(outputDirectory, { recursive: true });

  let previewServer;
  try {
    await waitForPreview(previewUrl, 1);
  } catch {
    previewServer = spawn(process.execPath, ['scripts/serve-dist.mjs', 'dist', '4173'], {
      cwd: projectDirectory,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    await waitForPreview(previewUrl);
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
    colorScheme: 'dark',
    recordVideo: { dir: outputDirectory, size: { width: 1920, height: 1080 } },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(previewUrl, { waitUntil: 'networkidle' });
    await installDemoChrome(page);

    await showTitle(
      page,
      'MECHANICS STUDIO · 2D + 3D',
      '拉压弯扭大师教学演示',
      '从默认案例进入建模、载荷、约束、求解与后处理，并演示字母公式、复杂组合变形和空间有限元。',
      3500,
    );

    const guideCheckbox = page.getByRole('checkbox', { name: '载入后开始界面导览' });
    if (await guideCheckbox.isChecked()) await guideCheckbox.uncheck();
    await showChapter(page, '01 · 二维建模与弯曲分析');
    await clickWithNote(
      page,
      page.locator('button.welcome-example--2d'),
      '载入 2D 简支梁案例',
      '6 m 简支梁、跨中 18 kN 集中力；案例载入后自动完成二维求解。',
      1500,
    );

    await showNote(page, '二维模型检查', '模型树同步列出节点、梁单元、材料、截面、约束与载荷。', 2200);
    await clickWithNote(
      page,
      page.getByRole('button', { name: '求解', exact: true }).first(),
      '重新求解',
      '求解器校核自由度并更新反力、位移和内力结果。',
      1300,
    );

    for (const [layer, description] of [
      ['变形', '查看位移与挠度趋势，快速定位最大变形位置。'],
      ['轴力 N', '拉伸为正、压缩为负，展示杆件轴向受力路径。'],
      ['剪力 V', '剪力图用于判断载荷突变与弯矩斜率。'],
      ['弯矩 M', '弯矩图揭示危险截面与受拉、受压边缘。'],
    ]) {
      await setOnlyResultLayer(page, layer);
      await showNote(page, `二维后处理 · ${layer}`, description, 1750);
    }

    const educationTab = page.getByRole('tab', { name: /教学助手/ });
    await educationTab.click();
    await sleep(650);

    await clickWithNote(
      page,
      page.getByRole('button', { name: /字母计算/ }).last(),
      '字母计算功能',
      '参数表中的 F、L、E、I 等字母可以直接组成公式，修改参数后结果自动刷新。',
      900,
    );
    const formulaInput = page.getByLabel('输入公式');
    await focus(formulaInput);
    await formulaInput.fill('F*L^3/(3*E*I)');
    await showNote(
      page,
      '案例 A · 悬臂梁端部挠度',
      '输入 δ = F·L³/(3EI)，当前字母参数得到 6.6964×10⁻³ m。',
      2300,
    );
    await formulaInput.fill('sqrt((N/A+M/W)^2+3*(T/Wt)^2)');
    await showNote(
      page,
      '案例 B · 拉弯扭等效应力',
      '同一输入框支持括号、乘方和 sqrt 函数，直接计算 von Mises 等效应力。',
      2500,
    );
    await unfocus(formulaInput);

    const combinedButton = page.getByRole('button', { name: /组合变形/ }).last();
    await clickWithNote(
      page,
      combinedButton,
      '拉、压、弯、扭统一校核',
      '组合变形页按 N/A、M/W、T/Wt 计算应力，并给出 von Mises 应力与安全系数。',
      1900,
    );
    const combinedCase = {
      '轴力 N': '120000',
      '弯矩 M': '8500',
      '扭矩 T': '3200',
      '截面面积 A': '0.0045',
      '抗弯截面模量 W': '0.00012',
      '抗扭截面模量 Wt': '0.0002',
      '截面惯性矩 I': '0.000048',
      '极惯性矩/扭转常数 J': '0.000085',
      '弹性模量 E': '210000000000',
      '剪切模量 G': '80000000000',
      '杆件长度 L': '2.4',
      '屈服强度 fy': '355000000',
    };
    for (const [label, value] of Object.entries(combinedCase)) {
      await page.getByLabel(label, { exact: true }).last().fill(value);
    }
    await showNote(
      page,
      '案例 C · 高强钢杆件组合受力',
      'N=120 kN、M=8.5 kN·m、T=3.2 kN·m；同时输入截面、刚度、长度和 355 MPa 屈服强度。',
      2600,
    );
    const combinedResultHeading = page.getByRole('heading', { name: '组合校核结果', exact: true });
    await combinedResultHeading.scrollIntoViewIfNeeded();
    await focus(combinedResultHeading);
    await showNote(
      page,
      '复杂结果自动联算',
      '一次得到轴向应力、弯曲应力、扭转剪应力、von Mises 应力、安全系数、轴向变形、曲率和扭转角。',
      3000,
    );
    await unfocus(combinedResultHeading);

    await clickWithNote(
      page,
      page.getByRole('button', { name: /危险截面/ }).last(),
      '危险截面识别',
      '从应力、挠度与安全系数三个维度检查最不利位置。',
      900,
    );
    const solveCritical = page.getByRole('button', { name: /求解并识别/ });
    if ((await solveCritical.count()) > 0) await solveCritical.click();
    await sleep(2300);

    await clickWithNote(
      page,
      page.getByRole('button', { name: /典型题库/ }).last(),
      '复杂二维案例',
      '切换到门式刚架，展示水平力、竖向力与轴力—剪力—弯矩耦合。',
      700,
    );
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /刚架/ }).click();
    await sleep(1400);
    await setOnlyResultLayer(page, '弯矩 M');
    await showNote(
      page,
      '案例 D · 双柱门式刚架',
      '复杂杆系自动完成整体刚度组装、边界条件处理和内力恢复；弯矩图直接显示控制截面。',
      3000,
    );

    await page.getByRole('button', { name: '帮助', exact: true }).click();
    await page.getByText('使用指导与默认案例', { exact: true }).click();
    await sleep(600);
    const guideCheckbox3d = page.getByRole('checkbox', { name: '载入后开始界面导览' });
    if (await guideCheckbox3d.isChecked()) await guideCheckbox3d.uncheck();
    await showChapter(page, '02 · 三维空间刚架全流程');
    await clickWithNote(
      page,
      page.locator('button.welcome-example--3d'),
      '载入 3D 空间悬臂刚架',
      '三段正交 Q235 刚架在自由端承受三向力和扭矩。',
      1800,
    );

    await showNote(page, '三维模型定义', '4 个节点、3 根空间梁、固定端约束，以及 Fx、Fy、Fz 与 Mx 联合作用。', 2300);

    for (const view of ['前', '右', '俯', '轴测']) {
      const viewButton = page.getByRole('button', { name: view, exact: true });
      await viewButton.click();
      await showNote(page, `标准视图 · ${view}`, '用标准视角检查空间拓扑、局部方向与载荷位置。', 800);
    }

    await clickWithNote(
      page,
      page.getByRole('button', { name: /本地求解/ }).last(),
      '执行三维有限元求解',
      '组装 12×12 空间梁单元，计算轴向、双向弯曲、扭转、位移与支座反力。',
      1600,
    );
    await page.getByText(/求解完成/).last().waitFor({ timeout: 15000 });
    await showNote(page, '三维结果总览', '最大节点位移、相对残差与模型修订号共同用于确认结果有效性。', 2200);

    for (const [layer, description] of [
      ['位移 / 变形', '叠加变形后的空间构型并自动放大位移。'],
      ['轴力 N', '检查构件拉压分量。'],
      ['剪力 V', '查看两个局部方向上的合成剪力。'],
      ['弯矩 M', '观察双向弯曲控制位置。'],
    ]) {
      const button = page.getByRole('button', { name: layer, exact: true }).last();
      if ((await button.count()) > 0) {
        await button.click();
        await showNote(page, `三维结果图层 · ${layer}`, description, 1250);
      }
    }

    for (const [tabName, description] of [
      ['支座反力', '核对固定端三向反力与反力矩，完成整体平衡检查。'],
      ['构件端力', '逐杆读取轴力、剪力、扭矩与双向弯矩分量。'],
      ['位移与转角', '回到节点位移和转角表，定位最大响应节点。'],
    ]) {
      const tab = page.getByRole('tab', { name: tabName, exact: true });
      await tab.click();
      await showNote(page, tabName, description, 1750);
    }

    await showTitle(
      page,
      'LOCAL · TRACEABLE · TEACHING READY',
      '2D 与 3D 全流程演示完成',
      '字母公式 → 组合变形 → 门式刚架 → 空间有限元；模型、计算与结果均在本地完成。',
      4200,
    );
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    if (previewServer) previewServer.kill();
  }

  const recordedPath = await video.path();
  await runProcess(ffmpegPath, [
    '-y',
    '-i', recordedPath,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-r', '30',
    '-an',
    finalVideoPath,
  ]);
  await unlink(recordedPath).catch(() => {});

  console.log(`Teaching demo exported: ${finalVideoPath}`);
};

record().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
