# 空间桁架最小闭环阶段报告

## 本阶段范围

本阶段完成“空间桁架接入主编辑器”的最小真实闭环。没有把三维渲染等同于空间求解，没有生成模拟结果，也没有将杆系结果命名为实体应力云图。

```text
空间分析工作台
→ 统一结构模型
→ 模型检查
→ 空间桁架输入适配器
→ 3 自由度编号与 6×6 单元刚度
→ sparse LU 本地求解
→ 统一结果模型
→ 节点/杆件结果表
→ Three.js 三维变形与轴力显示
```

## 修改文件

统一模型与状态：

- `src/types/structuralAnalysis.ts`
- `src/utils/structuralModel.ts`
- `src/store/structural.ts`

求解适配与边界检查：

- `src/utils/structuralAdapters.ts`
- `src/utils/spaceTruss3D.ts`
- `src/utils/spaceFrame3D.ts`
- `src/utils/solidTetra3D.ts`
- `src/utils/spacePostprocess3D.ts`

界面接入：

- `src/components/SpaceTrussWorkbench.vue`
- `src/components/Structure3DViewer.vue`
- `src/views/Editor.vue`
- `src/store/app.ts`
- `src/locales/cn.json`
- `src/locales/en.json`

检查、测试与文档：

- `tsconfig.3d.json`
- `src/tests/structuralModel.test.ts`
- `src/tests/spaceTrussAdapter.test.ts`
- `docs/typecheck-baseline.md`
- `docs/solver-capability-audit.md`
- `docs/3d-fem-roadmap.md`

## 已实现

- 统一分析类型、节点、六自由度约束、构件、材料、截面、节点载荷和结果 DTO。
- 旧二维节点到统一 XYZ 节点的迁移函数。
- 空间桁架只筛选 `Ux/Uy/Uz`，旋转自由度不会进入求解输入。
- 空间刚架适配器固定使用 `[Ux, Uy, Uz, Rx, Ry, Rz]` 顺序。
- 空间桁架工作台支持材料、截面、真实 XYZ 节点、约束、杆件、节点三向力和删除操作。
- 模型检查覆盖缺失节点/构件、重复位置、零长度、悬空节点、材料/截面缺失、载荷自由度不适用等问题。
- 结果记录 `modelRevision`；模型修改后旧结果标记过期，三维视图不再读取旧结果。
- 三维节点选择、杆件选择和节点 XYZ 坐标修改与统一模型同步。
- 空间桁架不适用的剪力和弯矩图层在界面中禁用。
- 空间刚架和实体分析在分析选择器中禁用并显示当前限制。
- 所有计算仍在用户本机执行，不连接云端求解服务。

## 验证结果

严格局部类型检查：

```text
npm run typecheck:3d
通过
```

空间有限元与适配层测试：

```text
8 个测试文件通过
36 项测试通过
```

生产构建：

```text
Vite 构建成功
1800 个模块完成转换
PWA 生成成功
```

完整项目类型基线：

```text
vue-tsc 错误总数：174
新增空间工作台、统一模型、适配层和三维查看器：0 项
```

这 174 项仍来自既有 `BottomBar.vue`、`Widget.vue`、`utils/index.ts`、旧测试与 SVG 组件，详见 `docs/typecheck-baseline.md`。

浏览器端到端校核：

- 页面标题为“拉压弯扭大师”。
- 空间分析页控制台 0 error。
- 校核模型求得 B 点 `Ux = 9.524e-6 m`。
- 杆件 AB 轴力 `10000 N`。
- 正应力 `1.000e6 Pa`。
- 安全系数 `235`。
- 桌面和 `390×844` 移动端布局均可用。
- 三维画布采样颜色分别为 318 和 201，确认画布非空白。

验收截图：

- `output/playwright/space-truss-solved.png`
- `output/playwright/space-truss-mobile.png`

## 剩余限制

- 空间桁架尚无构件分布荷载、温度、初始应变和多工况组合。
- 当前机构诊断由奇异刚度求解异常转为用户可读错误，尚未提供机构模态图。
- 空间刚架主工作台尚未开放六自由度约束、完整截面参数和局部轴编辑。
- 空间刚架只有节点载荷，尚无构件荷载、端部释放和内部站点形函数插值。
- Tet4 仍是实验性常应变单元，没有网格导入、面力、体力、应力恢复、节点平均和连续云图。
- sparse LU 使用 mathjs；WASM Cholesky/LDLT 与 Web Worker 仍属于后续性能阶段。
- 完整项目仍有 174 项历史 `vue-tsc` 错误，项目级类型收尾尚未完成。
