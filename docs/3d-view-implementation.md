# 三维结构视图实施说明

## 当前项目分析

- 技术栈：Vue 3、TypeScript、Vite、Pinia、Vuetify 和 `ts-fem`；桌面版本由 Electron 打包，所有计算均在本地完成。
- 二维模型：`project` Pinia store 持有 `LinearStaticSolver`。节点、构件、材料、截面、荷载和边界条件均来自 `solver.domain` 与第一个 `loadCase`。
- 二维渲染：`SVGViewer.vue` 是主入口，`SVGElement.vue`、`SVGNode.vue` 与载荷 SVG 组件基于同一 solver 渲染；选择状态由 `project.selection` 和 `project.selection2` 统一维护。
- 计算结果：`project.solve()` 调用 `ts-fem`，梁单元可输出位移、轴力、剪力和弯矩。独立的空间桁架、空间刚架和四面体实体求解器位于 `src/utils`。
- 持久化：`serializeModel.ts` 与 Pinia persisted-state 保存旧项目格式，新增三维显示层不修改该格式。

## 数据流与兼容策略

```
ts-fem LinearStaticSolver
  -> createStructureSceneModel3D()
  -> Node3D / Member3D / Load3D / Constraint3D / Result3D
  -> Structure3DViewer (Three.js)
```

现有二维节点是 `ts-fem` 的 XZ 平面数据。适配器不会修改原坐标，而是在显示时映射为全局 XYZ 体系中的 XY 平面，即 `X -> X`、`Z -> Y`、显示 `Z = 0`。这保证历史项目、二维求解与保存格式不变。当前二维算例的 Z 坐标在属性面板中明确锁定，避免产生不存在的空间计算结果。

## 新增文件

- `src/types/model3d.ts`：统一三维节点、构件、载荷、位移、内力和局部坐标类型。
- `src/utils/model3d.ts`：二维兼容适配、向量变换、局部坐标构造、结果提取及变形比例计算。
- `src/components/Structure3DViewer.vue`：Three.js 场景、轨道相机、投影切换、选取、坐标状态、图层与结果显示。
- `src/components/StructureSplitView.vue`：二维/三维同步分屏。
- `src/tests/model3d.test.ts`：坐标映射、局部轴退化处理、坐标变换和变形比例测试。

## 实施阶段

1. 完成：统一三维数据类型与二维兼容适配。
2. 完成：基础场景、坐标轴、网格、相机交互、标准视角、投影和自动居中。
3. 完成：节点、构件、约束、节点力、均布/梯形分布荷载、变形与轴力/剪力/弯矩图层。
4. 完成：二维、三维和分屏入口共用同一模型与选择状态。
5. 后续：空间求解器与主编辑器的统一建模入口、三维节点六自由度编辑、实体网格导入、真实实体应力云图和高性能实例化渲染。

## 风险与边界

- `ts-fem` 主编辑器仍为二维梁单元求解器，因此不提供虚构的三维梁、实体应力或扭转结果。
- 新增 Three.js 增加了前端包体；已通过按需场景创建和卸载时释放几何体、材质、纹理、监听器与动画循环降低资源风险。
- 当前大型模型的高性能实例化、网格导入和全三维边界条件编辑需要在空间求解器正式接入编辑器后继续实施。
