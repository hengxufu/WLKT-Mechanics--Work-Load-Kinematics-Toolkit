# 项目级 TypeScript 类型检查基线

检查命令：

```bash
npx vue-tsc --noEmit
```

基线日期：2026-07-26

2.0.0 复核结果：174 个错误，分布在 24 个文件，与本轮修改前基线一致。新增工作区、计算后端、WebGPU 检测、Worker 协议、Worker 入口和界面组件均未产生独立类型错误，但项目级 `vue-tsc` 仍受历史组件类型错误阻断。

## 完整错误索引

下表列出完整错误集合的文件、错误数量、错误码和全部涉及行号。所有条目均为当前项目级检查结果。

| 文件 | 数量 | 错误码 | 行号 | 本次三维引入 |
| --- | ---: | --- | --- | --- |
| `src/App.vue` | 1 | TS2339 | 428 | 否 |
| `src/components/BottomBar.vue` | 94 | TS2322, TS2339, TS2345, TS2349 | 20, 66, 75, 91, 93, 101, 111, 274, 284, 305, 315, 327, 343, 353, 408, 416, 423, 457, 511, 519, 535, 537, 545, 564, 576, 594, 612, 633, 645, 657, 670, 751, 752, 754, 760, 761, 762, 773, 780, 785, 790, 796, 797, 799, 805, 806, 807, 818, 825, 830, 835, 899, 963, 970, 977, 1006, 1015, 1032, 1034, 1036, 1037, 1045, 1056, 1126, 1135, 1151, 1153, 1161, 1172, 1259, 1267, 1288, 1307, 1325, 1342, 1355, 1363, 1379, 1381, 1389, 1398, 1590, 1593, 1594, 1600, 1610 | 否 |
| `src/components/ContextMenuNode.vue` | 2 | TS2345 | 45, 123 | 否 |
| `src/components/dialogs/AddNodalLoad.vue` | 5 | TS2345 | 12, 46, 60, 74, 135 | 否 |
| `src/components/dialogs/CrossSectionLibrary.vue` | 4 | TS2304, TS2322, TS2339 | 17, 27, 29, 128 | 否 |
| `src/components/dialogs/MaterialLibrary.vue` | 4 | TS2304, TS2322, TS2339 | 17, 27, 29, 307 | 否 |
| `src/components/Results.vue` | 5 | TS2322, TS2345, TS2578 | 4, 6, 9, 12, 58 | 否 |
| `src/components/StiffnessMatrix.vue` | 2 | TS2345, TS2352 | 54 | 否 |
| `src/components/svg/ElementLoad.vue` | 3 | TS2322, TS2345 | 18, 24, 26 | 否 |
| `src/components/svg/ElementLoad/Trapezoidal.vue` | 1 | TS2322 | 15 | 否 |
| `src/components/svg/ElementLoad/UDL.vue` | 1 | TS2322 | 15 | 否 |
| `src/components/svg/ElementTemperatureLoad.vue` | 1 | TS2322 | 14 | 否 |
| `src/components/svg/NodalLoad.vue` | 1 | TS2322 | 16 | 否 |
| `src/components/svg/Node.vue` | 1 | TS2322 | 23 | 否 |
| `src/components/svg/PrescribedDisplacement.vue` | 1 | TS2322 | 17 | 否 |
| `src/components/SVGElementViewer.vue` | 3 | TS2739, TS2740 | 314, 356, 381 | 否 |
| `src/components/SVGViewer.vue` | 2 | TS2345, TS2739 | 2045, 2318 | 否 |
| `src/components/Widget.vue` | 14 | TS2339 | 26, 27, 34, 36, 40, 46, 47, 48, 57, 63, 67 | 否 |
| `src/store/layout.ts` | 4 | TS2339 | 29, 30, 33, 34 | 否 |
| `src/store/project.ts` | 1 | TS2589 | 341 | 否 |
| `src/tests/spaceFrame3D.test.ts` | 7 | TS2322, TS2345 | 23, 45, 64, 110, 129, 130, 131 | 空间求解测试类型，非渲染模块 |
| `src/tests/spacePostprocess3D.test.ts` | 1 | TS2322 | 19 | 空间求解测试类型，非渲染模块 |
| `src/tests/spaceTruss3D.test.ts` | 3 | TS2345 | 93, 94, 95 | 空间求解测试类型，非渲染模块 |
| `src/utils/index.ts` | 13 | TS2322, TS2339, TS2538 | 364, 377, 596, 600, 651, 655, 682, 749, 754, 777, 782, 805, 810 | 否 |

## 原因分类与修复方式

| 类别 | 主要文件 | 原因 | 建议修复 | 影响空间建模 |
| --- | --- | --- | --- | --- |
| Vuetify 表格表头扩展字段 | `BottomBar.vue`、材料/截面库 | `InternalDataTableHeader` 不包含项目自定义的 `units`、`tooltip`、`removable` | 定义项目表头接口，保持 Vuetify 标准字段并在 slot 边界使用类型守卫 | 是，空间节点、截面和结果表需要复用表格 |
| 宽联合类型未收窄 | `BottomBar.vue`、`SVGElementViewer.vue`、`SVGViewer.vue` | `Element`、多种荷载和位移约束被混在一个联合类型中直接访问专属字段 | 使用 `instanceof`/判别字段建立类型守卫，拆分表格行模型 | 是，空间单元与载荷会扩大联合类型 |
| SVG 默认属性声明错误 | `svg/*` | `withDefaults` 中把 `Intl.NumberFormat` 实例当成工厂函数类型 | 使用显式 props 默认工厂或可选值加计算默认值 | 否，但阻断项目级检查 |
| 动态组件/布局推断为 unknown | `Widget.vue`、`layout.ts` | `reactive` 和动态组件条目未声明稳定接口 | 为 widget、component props 与布局位置定义接口 | 间接影响空间工具面板 |
| DOM 事件与 ref 类型缺失 | `App.vue`、`BottomBar.vue` | 模板 ref、`EventTarget` 未收窄 | 使用 `HTMLInputElement`/组件实例 ref，事件处理函数显式接收并收窄目标 | 否 |
| mathjs Matrix 与 number 混用 | `BottomBar.vue`、`Results.vue` | `Matrix.get()` 或矩阵子集返回类型未转换 | 在数据适配层读取并验证有限数值 | 是，结果表需要稳定数值类型 |
| 测试常量 readonly/布尔扩宽 | 空间求解测试 | `as const` 产生只读数组；约束对象的 `true` 被扩宽为 `boolean` | 给模型和约束显式标注求解器输入类型 | 是，直接影响空间模块局部检查 |
| 旧工具函数索引类型 | `utils/index.ts` | `unknown` 被用作动态索引，`EntityWithLabel` 定义过窄 | 使用 `Record<PropertyKey, unknown>` 边界和正确 label 联合类型 | 间接影响适配层 |
| 深层响应式类型实例化 | `project.ts` | Pinia 持久化对复杂 `ts-fem` 类实例进行深层类型推导 | 抽离持久化 DTO 和求解器运行时实例 | 是，统一模型应使用纯 DTO |

## 阶段性检查

已增加 `tsconfig.3d.json` 和 `typecheck:3d`，严格验证统一空间模型、输入适配器、空间求解内核、计算后端、WebGPU 能力检测、Worker 协议及相关回归测试。2.0.0 检查通过。该检查仅作为空间开发基线，不能替代项目级 `vue-tsc`。

## 第一阶段安全修改

1. 修复空间求解测试的显式输入类型。
2. 建立局部 `tsconfig.3d.json`。
3. 修复 SVG 默认 formatter 声明和缺失 import 等低风险错误。
4. 不在第一轮重写 1600 行的 `BottomBar.vue`，先把其错误整理为可逐组修复的表格、荷载和结果三个子域。
