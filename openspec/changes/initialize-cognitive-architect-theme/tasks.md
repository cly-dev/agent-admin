## 1. 主题基础设施初始化

- [x] 1.1 在全局样式中定义 `The Cognitive Architect` 语义令牌（surface tiers、primary 系列、on_surface、outline_variant、surface_tint）
- [x] 1.2 在 Tailwind 主题层建立令牌映射，确保页面与组件可通过统一类名/语义变量复用
- [x] 1.3 补齐基础视觉规则（统一圆角 0.375rem、浮层阴影、文本色禁止 #000000）

## 2. 组件规则落地

- [x] 2.1 实现按钮三态（Primary/Secondary/Tertiary）主题化样式与复用方案
- [x] 2.2 实现输入框默认态与聚焦态（背景切换 + 2px surface_tint 外发光 10%）
- [x] 2.3 实现卡片/列表的无分割线分层规则（8px 留白或 hover 背景分隔）
- [x] 2.4 为浮层类组件（Modal/Popover/Dropdown）应用统一扩散阴影规范

## 3. 规范治理与验收

- [x] 3.1 在项目规范中明确“所有新建/改造 UI 必须基于主题令牌实现”的强约束
- [x] 3.2 为编辑器场景定义并接入深色工作台样式（inverse_surface + monospace 栈 + 语义高亮色）
- [x] 3.3 选择一个页面进行规范试点并完成对齐验收
- [x] 3.4 建立评审检查清单，覆盖无分割线规则、语义令牌使用和组件状态一致性
