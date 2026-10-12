# 拉压弯扭大师 · 视觉与内容增强版

18页（16页主稿、2页附录），面向材料力学同学分享。参考用户提供的蓝白中国科研汇报样式，使用蓝色导航、深蓝结论栏、浅冰蓝和青色内容区、少量橙色强调。旧版位于相邻 research-ppt-redesign 工作空间，未覆盖。

## 文件

- `拉压弯扭大师_视觉与内容增强版.pptx`：可编辑主文件。
- 同名PDF：本机PowerPoint导出。
- `renders/final-v2/`：最终18页1600×900预览。
- `sources/speaker-notes.md`：逐页讲稿；PPT也包含演讲者备注。
- `planning/visual-assistant-reply.txt`：实际网页版规划；`web-density-review.txt`为第二轮逐页审查。
- `asset-jobs/R01`至`R10`：10个实际网页生成、下载、验收、逐对象合成的透明素材；提示词、原图、哈希、位置和网页会话均保留。
- `qa/density-audit.json`：每页实际对象清单与统计。
- `qa/delivery_review.json`、`qa/delivery-gate.json`：逐页审查和严格技能验收结果。

## 元素数量与编辑性

每页总对象29–50个。排除14个公共画布、导航、标题、结论栏、页码及来源组件后，每页正文15–36个独立对象。截图计1个，完整表格计1个，完整图表计1个，没有按表格单元格或曲线数据点重复计数，也没有不可见填充对象。

标题、正文、普通图形、流程连线、表格以及两张图表均为原生对象；两张图表各保留嵌入Excel工作簿。公式为可编辑文字，另附`equations.tex`，不是结构化Office数学公式。真实截图与生成素材仍为位图，可独立替换。

已实际查看18页首轮渲染；修正第5页截图与来源行间距、第13页计算核心至学习解释的连线后，重新渲染全稿，16页PNG与已审查图像哈希一致，另2页再次查看。最终文字字体检查通过。

独立编辑演示见`build/editing-demo-native.pptx`：中文标题改为“编辑演示”；反力图第一点15改16；支座表A改A*。已实际查看第1、6、9页渲染。演示改值仅证明可编辑性，不能当作正确物理结果。正式PPT仍为15/12/9、3/6/9及15/24/27。

## 事实和模型核验范围

实机截图复用2026-10-10本地dist构建运行记录，不是本轮重新捕获；部分图标字体方框原样保留。来源快照见`software-README.md`、`solver-capability-audit.md`及`live-run-evidence.json`。

二维默认梁为6m跨度、跨中18kN，反力幅值9/9kN，弯矩幅值27kN·m，界面显示负27。第9页不同荷载位置图表属于解析预测，非新增测量。三维仅核对三向合力，未补造完整力矩验证、应力或安全系数。Worker CPU为实际数值路径；WebGPU仅检测；Tet4为实验状态。概念金属素材不冒充试验或仿真图。

用户已授权：“允许用当前网页版完成规划和单元素生成，注明模型名未核验”。实际完成网页规划、第二轮审查及10个独立素材生成，但UI只观察到High/创建图像，无法确认GPT-6或Image 2.5具体型号。严格`delivery_gate.py`唯一未通过项是“GPT-6 must be observed in the actual model selector”，因此技能核验状态保留draft；不虚报完整在线型号验收通过。作品本身的逐页渲染、字体、对象、素材哈希闭环均已完成。

## 重建

保留源文件`src/build.cjs`和`src/design.cjs`，修改对应页的对象参数；不要重跑早期迁移脚本`enrich_source.py`、`final_tweaks.py`、`density_tweaks.py`、`prepare_rich.py`，它们仅作制作记录。

需要Node.js的`pptxgenjs`，Python的`python-pptx`、`Pillow`、`lxml`。本机可用Codex依赖运行时；Node模块根目录需放入NODE_PATH。用于重建的技能工具快照已放入`src/toolchain`。

从此文件所在目录运行：

```powershell
$env:NODE_PATH='C:\Users\21797\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
.\src\rebuild.ps1 -Python 'C:\Users\21797\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -Node 'C:\Program Files\nodejs\node.exe'
```

新PPT写入build目录，不覆盖交付文件。需要渲染时，使用`src/render.ps1`并传入Windows绝对路径和新输出目录。任何修改都需要重新渲染；旧QA记录只对应其记录的PPT哈希。
