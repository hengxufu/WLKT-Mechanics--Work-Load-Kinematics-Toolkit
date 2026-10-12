请实际规划一份中国高校科研汇报·证据与结构可编辑PPT。先分析材料，再逐页规划，再审查。
材料：
# 任务与设计约束
为材料力学同学分享拉压弯扭大师，约12分钟，16页主稿加2页附录。全新重制，不复用通用三卡片排版。用户参考为蓝白中国科研汇报：蓝色顶部章节导航、深蓝结论标题、浅蓝证据容器、底部结论条；不能使用北航校徽冒充官方。中文微软雅黑，英文Times New Roman。复杂且美观来自受力示意、流程、截面解释、局部放大和数据比较。至少8种布局；科学图和数据全部原生可编辑。计划3个有意义的单主体生成元素：封面金属杆件概念、扭转圆轴概念、结尾蓝色轻薄轨迹装饰，逐项生成，不能整页或拼贴。18页内规划完整content_blocks和演讲稿，每页给具体值和来源。

# 已核对事实
README.md版本2.0.2，本地离线学习教学软件；四类拉压弯扭及组合变形。二维节点梁材料截面约束节点/单元荷载集中矩梯形/温度。结果反力NVM变形端力。公式库支持轴应力弯曲扭转vonMises变形安全系数，符号F N V M T E G A I J W Wt L fy。教学助手分步推导危险截面模板。空间桁架闭环，空间梁刚架EulerBernoulli12x12，节点6自由度；Worker CPU sparseLU；WebGPU仅能力检测尚无数值内核；Tet4实验。Vue3 TS Vite Three.js Electron/PWA离线。不是北航官方，不用于实际工程。

# 实机证据
已运行本地dist，截图保存在outputs/classmate-sharing/assets/live，证据qa/live-run-evidence.json。非安装exe。图标字体在捕获浏览器部分方框，原图如实保留。01-workspace.jpg全工作区；03-beam-moment.jpg弯矩；04-derivation.jpg教学推导；05-element-results.jpg端力；06-shear.jpg剪力；07-load-properties.jpg荷载属性；11-space-results.jpg空间模型和结果表。另有对应PNG局部裁剪可用。
二维6m简支梁，跨中18kN，2节点1单元，反力幅值9/9kN，弯矩图-27kNm，教学助手最大弯矩幅值27kNm。解析RA=RB=P/2=9，Mmax=PL/4=27。端弯矩0不能作为全梁最大弯矩0。位移转角约±.023144rad。截图符号约定与解析幅值分开。
三维4节点3单元空间正交Q235刚架，24DOF，A全约束。D节点力8000,-5000,-12000N，扭矩数值未捕获不能编。反力A-8000,5000,12000N。界面相对残差6e-14，单次123.4ms不能当性能基准。变形显示2.4x不是物理尺度。应力和安全系数字段为空不能补。没有连续实体应力云图。
理论比较（必须标注解析预测非软件新增实测）：P18kN L6m，位置a=1/2/3m，对应RA15/12/9、RB3/6/9kN，Mpeak15/24/27kNm。用原生带嵌入数据图表，独立单位坐标，不混力和力矩轴。

# 建议论证节奏
1产品定位封面，2学习问题，3四类变形与统一量，4端到端技术路线，5真实工作区导航，6默认梁建模约束，7剪力弯矩对应，8解析与实机数值核验，9载荷位置参数影响原生图表，10教学推导及危险截面，11空间刚架6DOF与局部坐标，12空间实机结果与平衡，13本地计算架构，14能力边界矩阵，15现场操作与排错，16结尾与下一步验证；附录17公式/单位，18证据来源与验证范围。
不编用户数量、性能提升、测试通过率、竞品比较、文献、GPU加速。


设计候选：深蓝 #174B70、青色 #008E98、少量橙色 #DA9253。用户模板优先。叙事参考：问题与缺口→研究假设→方法设计→关键证据→贡献与边界→后续验证。
候选构图：question-figure, method-process, figure-analysis, paired-comparison, evidence-table；按内容选择，避免连续重复，不能全篇三卡片。
局部素材候选：独立研究对象概念插画、设备概念或方法图标；数据图与节点关系原生绘制。
请输出一个JSON对象：deck_thesis、audience、evidence_gaps、review_checklist、slides。
每页含slide_number、slide_id、title、takeaway、layout_family、visual_rationale、content_blocks、speaker_notes、evidence、asset_requests。
content_blocks每块给出具体text或data_ref/source_ref，并标明原生text/chart/table/process及建议box_inches。
每条asset_request给request_id、asset_id、object_id、kind、purpose、single_subject_prompt，默认decision=generate_web。
kind只能ornament/concept/art_text/icon/cutout；艺术字给exact_text。每条只有一个独立元素，无页面、正文、数据图、公式或拼贴。
版式坐标采用13.333×7.5英寸；主标题、中文说明、数据标注均原生，中文微软雅黑，西文Times New Roman。
预留证据图、概念元素、注释与引文的位置。不要用虚构事实填空。真实照片和证书不由图像模型生成。
请特别展开封面、最关键的技术/经历页和最密集结果页；指出如何将参考风格转化为本项目的构图。
额外输出design_system（背景、颜色角色、字号层级、间距、线条、材质与光照）和representative_slides（上述三类代表页）。
每页增加visual_hierarchy（primary/secondary/annotation）、composition_notes和native_details；说明一个主焦点、证据与解读的关系、原生标注/连接线/局部放大的具体用途。复杂度来自内容关系，不靠无意义堆图。
每条生成请求补充visual_context（slide_background、lighting、material、placement、avoid），并给建议box_inches；图标不混用线描和写实材质，艺术字只用于短章节词并另保留原生语义文字。
给出全篇视觉节奏：封面、章节、解释、密集证据、结论之间如何切换；连续相同构图需说明理由。必要时分两页，不能为复杂程度牺牲字号和证据可读性。
以严格评审者身份检查材料充分性、内容空洞、图文比例、布局重复、证据与装饰混淆。
仅提供规划和批评，不执行shell、不写本地源、不生成整页图。

以下是可调整的原生构图起点，按真实内容选取并修订，不能照搬占位框：
{"evidence-zoom": {"best_for": "整体证据与局部细节联合解释", "zones": {"source_figure": [0.7, 1.85, 7.4, 4.75], "detail_crop": [8.5, 1.85, 4.1, 2.6], "native_interpretation": [8.5, 4.75, 4.1, 1.65]}, "assembly": "保留整体图；放大区域来自真实源并标明对应位置，原生框线连接；禁止生成科学细节"}, "technical-layers": {"best_for": "系统层级与模块协作", "zones": {"native_architecture": [0.7, 1.9, 8.2, 4.65], "single_component": [9.35, 1.9, 3.25, 2.15], "interface_conditions": [9.35, 4.4, 3.25, 2.1]}, "assembly": "原生分层底板、模块、接口与箭头；颜色编码层级，独立部件插画只辅助识别"}, "validation-dashboard": {"best_for": "同一论点的多项验证", "zones": {"main_native_chart": [0.7, 1.9, 7.1, 4.65], "secondary_evidence": [8.25, 1.9, 4.35, 2.8], "conditions_and_limits": [8.25, 5, 4.35, 1.5]}, "assembly": "主图占优，副证据与条件分区；统一变量颜色与单位，不能把多个小图压成不可读仪表盘"}, "problem-solution": {"best_for": "现实痛点到方案作用的解释", "zones": {"real_context": [0.7, 1.9, 4.15, 3.7], "native_transition": [5.15, 2.5, 2.1, 2.5], "solution_object": [7.6, 1.9, 5, 3.7], "evidence_boundary": [0.7, 5.95, 11.9, 0.65]}, "assembly": "真实场景与单一方案主体并置，中间原生因果或作用链；区分已验证作用与设计预期"}, "achievement-metrics": {"best_for": "个人贡献与真实成果证据", "zones": {"main_contribution": [0.7, 1.9, 6.2, 1.4], "real_evidence": [0.7, 3.65, 6.2, 2.8], "native_metrics": [7.4, 1.9, 5.2, 2], "role_and_scope": [7.4, 4.3, 5.2, 2.1]}, "assembly": "贡献文字、真实证据和同口径数字互相支持；标清个人角色，不把团队成果全部算作个人"}, "honor-gallery": {"best_for": "少量代表性荣誉与成果", "zones": {"primary_real_certificate": [0.7, 1.9, 6.4, 4.5], "secondary_real_evidence": [7.55, 1.9, 5.05, 2.5], "meaning_and_role": [7.55, 4.75, 5.05, 1.65]}, "assembly": "主证据明显大于副证据，提取可读原生信息；避免缩略证书墙"}, "user-scenario": {"best_for": "用户任务与产品使用场景", "zones": {"real_scenario": [0.7, 1.9, 7.5, 4.5], "native_task_sequence": [8.65, 1.9, 3.95, 2.3], "verified_value": [8.65, 4.65, 3.95, 1.75]}, "assembly": "场景与任务序列对应；概念演示明确标记，不伪造客户照片或使用记录"}, "business-flow": {"best_for": "价值交付与业务关系", "zones": {"native_value_flow": [0.7, 2, 11.9, 2.65], "assumptions": [0.7, 5.05, 5.7, 1.35], "verified_conditions": [6.85, 5.05, 5.75, 1.35]}, "assembly": "关系、资金与交付用不同原生线型并给图例；假设与已验证条件分列"}, "roadmap": {"best_for": "阶段成果与下一步验证", "zones": {"native_stage_axis": [0.7, 2, 11.9, 1.2], "stage_deliverables": [0.7, 3.65, 11.9, 1.65], "risks_and_next_test": [0.7, 5.7, 11.9, 0.7]}, "assembly": "时间轴配交付物和验证标准；已完成与计划用不同填充，不能只列日期口号"}, "question-figure": {"best_for": "研究问题、缺口与观测对象", "zones": {"specific_question": [0.7, 1.9, 4.7, 1.7], "gap_and_hypothesis": [0.7, 4, 4.7, 2.4], "real_or_concept_subject": [5.9, 1.9, 6.7, 4.5]}, "assembly": "以问题组织对象与证据；概念插画标明示意，原生标注仅表达来源支持的关系"}, "evidence-table": {"best_for": "多项研究证据的对应关系", "zones": {"native_evidence_table": [0.7, 1.9, 9.1, 4.5], "native_synthesis": [10.15, 1.9, 2.45, 4.5]}, "assembly": "表格保留条件、结果、来源与边界；右侧只提炼表中可支持的结论"}, "portrait-hero": {"best_for": "个人定位/国奖开场", "zones": {"headline": [0.7, 1.4, 6.2, 1.5], "story": [0.7, 3.2, 6.2, 1.8], "real_portrait": [7.7, 1.1, 4.9, 5.3]}}, "product-hero": {"best_for": "产品与技术开场", "zones": {"headline": [0.7, 1.5, 6.1, 1.5], "promise": [0.7, 3.3, 5.8, 1.3], "single_product": [7.4, 1.4, 5.1, 4.8], "evidence_note": [0.7, 5.8, 6, 0.6]}}, "figure-analysis": {"best_for": "关键结果与来源图", "zones": {"evidence": [0.65, 1.9, 8.1, 4.65], "interpretation": [9.1, 1.9, 3.55, 4.65]}}, "paired-comparison": {"best_for": "同条件比较", "zones": {"left_evidence": [0.65, 2, 5.65, 3.5], "right_evidence": [7, 2, 5.65, 3.5], "shared_interpretation": [0.65, 5.85, 12, 0.7]}}, "comparison-matrix": {"best_for": "竞品/方案维度对比", "zones": {"native_table": [0.7, 2, 11.9, 3.9], "boundary": [0.7, 6.05, 11.9, 0.5]}}, "method-process": {"best_for": "研究设计与验证顺序", "zones": {"native_nodes_and_lines": [0.7, 2.1, 11.9, 2.3], "design_conditions": [0.7, 4.8, 7.3, 1.6], "local_concept": [8.6, 4.6, 3.4, 1.8]}}, "growth-timeline": {"best_for": "个人成长与项目里程碑", "zones": {"native_timeline": [0.7, 2.2, 11.9, 1.3], "evidence_photo": [0.7, 4, 4.5, 2.3], "milestone_explanation": [5.6, 4, 7, 2.3]}}, "photo-evidence": {"best_for": "真实实践与实验场景", "zones": {"real_photo": [6.7, 1.8, 5.9, 4.7], "claim": [0.7, 1.9, 5.5, 1.2], "specific_contribution": [0.7, 3.4, 5.5, 2.7]}}, "traction-chart": {"best_for": "增长/趋势与落地", "zones": {"native_chart": [0.7, 2, 8.4, 4.5], "metric_explanation": [9.5, 2, 3.1, 4.5]}}, "section-wordmark": {"best_for": "章节切换", "zones": {"native_section_title": [2.1, 2.3, 9.1, 1.2], "optional_art_text": [4.4, 4, 4.5, 1.2], "single_ornament": [9.8, 0.7, 2.6, 1.5]}}}