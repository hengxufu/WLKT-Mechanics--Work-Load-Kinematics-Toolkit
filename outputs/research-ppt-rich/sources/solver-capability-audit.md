# 求解器能力审计

## 能力矩阵

| 求解器 | 节点自由度 | 单元自由度/刚度矩阵 | 可处理载荷 | 可输出结果 | 已接入主编辑器 |
| --- | --- | --- | --- | --- | --- |
| 平面桁架 | 无独立实现 | 无独立实现 | 无 | 无 | 否 |
| 平面刚架 `ts-fem/Beam2D` | `Dx, Dz, Ry` | 6，自由度顺序为两端各 `[Dx, Dz, Ry]` | 节点力/弯矩、均布和梯形分布载荷、构件集中力/矩、温度、指定节点位移 | 节点位移、反力、轴力 N、剪力 V、弯矩 M | 是 |
| 空间桁架 `spaceTruss3D` | `Ux, Uy, Uz` | 6×6，两端各 3 个平移自由度 | 节点 `Fx, Fy, Fz`、指定平移 | 三向位移、三向反力、单元轴力、正应力、安全系数 | 是，独立“空间分析”工作台 |
| 空间刚架 `spaceFrame3D` | `Ux, Uy, Uz, Rx, Ry, Rz` | 12×12，两端各 6 自由度 | 节点六分量力/力矩、指定六自由度位移 | 六自由度位移、六分量反力、构件端 `N, Vy, Vz, T, My, Mz`、估算应力和安全系数 | 是，统一三维工作台 |
| 实体 Tet4 `solidTetra3D` | `Ux, Uy, Uz` | 12×12，四节点各 3 平移自由度 | 节点三向力、指定平移 | 节点位移/反力、单元常应变、六应力分量、von Mises、安全系数 | 否，实验性 |

## 实现确认

### 平面刚架

- 源于 `ts-fem` 的 `Beam2D`，模型在 XZ 平面。
- `getNodeDofs()` 明确返回 `[Dx, Dz, Ry]`。
- 局部刚度矩阵为 6×6，包含 `EA/L`、弯曲项和由 `kGA` 引入的 Timoshenko 剪切修正。
- 主编辑器 `project` store 直接持有 `LinearStaticSolver`，因此这是当前唯一完整接入的求解流程。
- 没有独立平面桁架单元；不能把 Beam2D 的轴向子项描述为平面桁架求解器。

### 空间桁架

- 每节点固定建立 3 个平移自由度，总自由度为 `3n`。
- 单元刚度为 `EA/L` 乘以三维方向余弦外积，单元矩阵 6×6。
- 约束通过自由/固定自由度分块消元，支持零或指定平移。
- 当前只有节点三分量载荷，没有构件荷载。
- 单元结果由两端相对位移在轴线方向投影得到，正值表示拉力。
- 已有单杆解析解、倾斜杆、符号参数、零长度、机构诊断和三种矩阵后端测试；多杆对称空间桁架仍需增加更多参考算例。

### 空间刚架

- 自由度顺序在所有模块中为每节点 `[ux, uy, uz, rx, ry, rz]`，单元按 i 端 6 个后接 j 端 6 个。
- 局部刚度为 12×12，包含 `EA/L`、`GJ/L`、绕局部 y/z 双向弯曲。
- 坐标变换矩阵为四个 3×3 方向余弦块，刚度转换使用 `T^T K_local T`。
- 局部轴参考向量平行时会切换备用参考方向，避免零向量。
- 当前刚度属于 Euler-Bernoulli 空间梁形式，没有剪切面积或剪切修正项，不应描述为 Timoshenko 空间梁。
- 当前仅支持节点六分量载荷；尚无构件均布载荷、温度或初始应变。
- 输出为构件两端六分量内力，没有内部站点插值。
- 2.0.0 主工作台已开放六自由度约束、节点力矩、`E/G` 材料和 `A/Iy/Iz/J` 截面输入。

### 实体 Tet4

- 四节点线性四面体，每节点 3 个平移自由度，单元 12×12。
- 使用各向同性线弹性本构矩阵和常应变 B 矩阵，`K = V B^T D B`。
- 单元只产生一个常应变/常应力状态，不存在积分点到节点的恢复或节点平均。
- 当前只有节点载荷与位移约束；没有面力、体力、温度、网格质量或误差估计。
- 因此只能标记为“实验性实体分析模块”，当前不具备连续实体应力云图条件。

### 线性代数与后处理

- 总刚度支持 dense、sparse-assembly 和 sparse-lu 三种后端。
- sparse-lu 使用 mathjs `lusolve`，不是独立 WASM Cholesky/LDLT。
- 2.0.0 统一空间求解通过本地 Web Worker 执行；WebGPU 只完成真实设备检测，尚无 GPU 数值内核。
- 奇异或病态矩阵通过捕获线性求解异常转成带上下文的错误。
- `spacePostprocess3D` 已能识别空间桁架和刚架的最大位移、轴力、剪力、扭矩、弯矩、应力和最小安全系数。
- 没有实体连续云图模块。

## 主编辑器与空间求解器的数据差异

| 项目 | 当前主编辑器 | 空间求解器 |
| --- | --- | --- |
| 模型载体 | `ts-fem` 类实例 | 纯 TypeScript DTO |
| 节点坐标 | 三元素数组但只使用 XZ 平面 | 真正 XYZ |
| 节点自由度 | `Dx, Dz, Ry` | 桁架 3 平移；刚架 6 自由度 |
| 构件 | `Beam2D` 类实例 | truss3d/frame3d DTO |
| 截面 | `a, iy, h, k` | 桁架 A；刚架 A, Iy, Iz, J |
| 载荷 | 二维节点/构件载荷对象 | 当前仅空间节点载荷 |
| 状态 | 几何、求解器和结果耦合 | 函数式输入/结果 |
| 修订号 | 无显式模型版本 | 模型和结果均绑定 `revision`，修改后旧结果标记为过期 |

## 建议统一接口

统一模型应保持纯数据结构，并由适配层转换到各求解器：

```ts
type AnalysisModelType =
  | 'planar-truss'
  | 'planar-frame'
  | 'space-truss'
  | 'space-frame'
  | 'solid';

interface StructuralAnalysisModel {
  schemaVersion: number;
  modelType: AnalysisModelType;
  revision: number;
  nodes: StructuralNode[];
  members: StructuralMember[];
  materials: StructuralMaterial[];
  sections: StructuralSection[];
  nodalLoads: StructuralNodalLoad[];
}

interface StructuralSolver<TInput, TResult> {
  validate(input: TInput): SolverValidationResult;
  solve(input: TInput): TResult;
}
```

适配器集中在 `src/utils/structuralAdapters.ts`，不得放进 Vue 组件或让求解器读取 Pinia。

## 风险

- 空间桁架：约束不足很容易形成机构；三维单杆必须约束横向自由度；当前缺少构件荷载。
- 空间刚架：局部轴和截面 Iy/Iz/J 定义错误会交换弯曲方向；当前无构件荷载和内部形函数结果。
- 实体分析：Tet4 常应变精度有限，缺少网格、面力、应力恢复和质量评价；不能接入为默认分析，也不能生成连续云图。

## 2.0.0 已落地文件

- 新增 `src/types/structuralAnalysis.ts`
- 新增 `src/utils/structuralAdapters.ts`
- 新增 `src/utils/structuralValidation.ts`
- 新增 `src/store/structural.ts`
- 新增 `src/components/SpaceTrussWorkbench.vue`
- 新增 `src/tests/structuralModel.test.ts`
- 新增 `src/tests/spaceTrussAdapter.test.ts`
- 新增 `tsconfig.3d.json`
- 修改 `src/store/app.ts`、`src/components/Structure3DViewer.vue` 和 `package.json`
