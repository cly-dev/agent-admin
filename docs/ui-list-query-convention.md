# 页面列表查询规范

管理端带分页、筛选的列表页统一采用 **AppQueryPanel + AppTable** 组合，不使用 ProTable 内置搜索。

## 组件职责

| 组件 | 路径 | 用途 |
|------|------|------|
| `AppQueryPanel` | `src/components/AppQueryPanel/` | 关键词 + 查询/重置 + 可展开高级筛选 |
| `AppTable` | `src/components/AppTable/` | 统一表格样式、分页、行点击 |
| `AppListSearchInput` | `src/components/AppQueryPanel/fields.tsx` | 列表页统一搜索输入框（Tool 样式基准） |

## 标准结构

```tsx
// 1. 页面级 hook：表单、appliedFilters、分页、load 请求
const { filterForm, appliedFilters, list, loading, page, pageSize, total, ... } = useXxxList();

// 2. 筛选面板（高级字段放在 AppQueryPanel.Grid 内）
<AppQueryPanel<FilterFormValues>
  form={filterForm}
  appliedFilters={appliedFilters}
  loading={loading}
  onSearch={handleFilterSearch}
  onReset={handleFilterReset}
  countActive={countActiveXxxFilters}  // 可选，默认 countActiveFilters
  advancedContent={
    <AppQueryPanel.Grid>
      <Form.Item name="agentId" label="...">...</Form.Item>
    </AppQueryPanel.Grid>
  }
/>

// 3. 数据表格
<AppTable rowKey="id" columns={columns} dataSource={list} pagination={{ page, pageSize, total, onChange }} />
```

## 筛选数据处理

每个列表页在同目录维护 `xxxFilter.ts`：

- `XxxFilterFormValues`：表单值（含 `''` 表示未选的下拉项）
- `XxxFilterValues`：提交 API 的干净参数
- `normalizeXxxFilter(formValues)`：表单 → API
- `countActiveXxxFilters(appliedFilters)`：高级筛选 badge 计数

参考：

- `src/pages/Agent/agentBoundToolsFilter.ts`
- `src/pages/AgentRun/agentRunFilter.ts`

## 国际化

通用文案使用 `appQueryPanel.*`：

- `appQueryPanel.keyword` / `keywordPlaceholder`
- `appQueryPanel.search` / `reset` / `advanced` / `any`

页面专属字段标签放在各模块命名空间（如 `agentRun.filter.*`）。

## 搜索输入框统一规范

- 页面列表的搜索输入框必须使用 `AppListSearchInput`，禁止手写 `label + input + SearchOutlined` 组合。
- `AppListSearchInput` 视觉以 Tool 页面为基准（`app-input`、左侧搜索图标、`py-2.5 pr-3 pl-9 text-sm`）。
- 非 `AppQueryPanel` 场景（如 Agent/Tool/Integrations 顶部工具栏）同样必须复用 `AppListSearchInput`。
- `AppQueryPanel` 主搜索框也必须使用 `AppListSearchInput`，确保跨页面一致。

## 禁止事项

- 列表页不要用 `ProTable` 的 `search` + `request` 做筛选（与全局样式不一致）
- 不要把筛选样式写在页面 `index.module.scss`，统一由 `AppQueryPanel/index.module.scss` 管理
- 高级筛选不要做成独立 Modal，统一用 Collapse 展开

## 参考实现

- Agent 关联工具：`AgentBoundToolsFilter` + `AgentAllowedToolsTable`
- Agent 运行记录：`AgentRunFilter` + `AgentRunTable` + `useAgentRunList`
