# 页面列表查询规范

管理端带分页、筛选的列表页统一采用 **AppQueryPanel + AppTable** 组合，不使用 ProTable 内置搜索。

## 组件职责

| 组件 | 路径 | 用途 |
| --- | --- | --- |
| `ListPageHeader` | `src/components/ListPageHeader/` | 列表页主标题 + 说明 + 可选统计与右侧操作 |
| `AppQueryPanel` | `src/components/AppQueryPanel/` | 关键词 + 查询/重置 + 可展开高级筛选（`layout="list"`） |
| `AppListQueryToolbar` | `src/components/AppQueryPanel/` | 仅主搜索行，无高级筛选 |
| `AppTable` | `src/components/AppTable/` | 统一表格样式、分页、行点击 |
| `AppListSearchInput` | `src/components/AppQueryPanel/fields.tsx` | 列表页统一搜索输入框（Tool 样式基准） |

## 列表页顶栏（ListPageHeader）

所有列表页必须使用 `ListPageHeader`，禁止各页自定义 `h1` / 说明样式（如 `text-2xl`、独立 `*PageTitle` 等）。

```tsx
<ListPageHeader
  title={intl.formatMessage({ id: 'foo.title' })}
  description={intl.formatMessage({ id: 'foo.subtitle' })}
  meta={summaryText} // 可选：列表统计等次要信息
  actions={
    <button type="button" className="app-button-primary ...">
      {intl.formatMessage({ id: 'foo.add' })}
    </button>
  }
/>
```

- **title**：页面主标题（`1.25rem` / 700 / `-0.02em` 字距）
- **description**：主说明（`0.875rem`，约 55% 透明度）
- **meta**：可选第三行（`0.75rem`，约 42% 透明度），用于「共 N 条」等动态统计
- **actions**：右侧按钮区；无操作时省略

有项目上下文的卡片列表页（Agent / Tool / Integration）可将动态文案放在 `description` 或 `meta`，与静态说明拆分。

## 标准结构

```tsx
// 1. 页面级 hook：表单、appliedFilters、分页、load 请求
const { filterForm, appliedFilters, list, loading, page, pageSize, total, ... } = useXxxList();

// 2. 顶栏
<ListPageHeader title={...} description={...} actions={...} />

// 3. 筛选面板（高级字段放在 AppQueryPanel.Grid 内）
<AppQueryPanel<FilterFormValues>
  layout="list"
  showProjectScope // 项目上下文列表页按需
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

## 列表筛选区统一规范

### 带高级筛选（AppQueryPanel）

```tsx
<AppQueryPanel<FilterFormValues>
  layout="list"
  showProjectScope // 项目上下文列表页（Agent 运行、对话、用户表等按需）
  form={filterForm}
  appliedFilters={appliedFilters}
  loading={loading}
  onSearch={handleFilterSearch}
  onReset={handleFilterReset}
  keywordPlaceholder="..."
  keywordClassName="max-w-md"
  countActive={countActiveXxxFilters} // 可选
  advancedContent={<AppQueryPanel.Grid>...</AppQueryPanel.Grid>}
/>
```

- **`layout="list"`**：透明主行、与下方表格间距统一（等同原 `plainMainBlock`）
- **`showProjectScope`**：主行左侧自动插入 `ListScopeBar compact`（项目切换）
- 禁止再手写 `plainMainBlock` + `leadingContent={<ListScopeBar />}`

### 仅关键词搜索（AppListQueryToolbar）

卡片列表等即时搜索、无「查询/重置」按钮时：

```tsx
<AppListQueryToolbar showProjectScope>
  <AppListSearchInput
    className="max-w-md"
    value={keyword}
    onChange={(e) => setKeyword(e.target.value)}
    disabled={!projectId}
  />
</AppListQueryToolbar>
```

禁止各页自定义 `*PageToolbar` / `*PageSearch` 布局。

## 搜索输入框统一规范

- 页面列表的搜索输入框必须使用 `AppListSearchInput`，禁止手写 `label + input + SearchOutlined` 组合。
- `AppListSearchInput` 视觉以 Tool 页面为基准（`app-input`、左侧搜索图标、`py-2.5 pr-3 pl-9 text-sm`）。
- `AppQueryPanel` 与 `AppListQueryToolbar` 内必须使用 `AppListSearchInput`。

## 行内操作按钮颜色（AppTableButton）

表格行内、抽屉工具栏等**次要操作**统一使用 `AppTableButton`，通过 `variant` 区分语义，禁止全部用同一灰色或纯文字链接。

| variant           | 语义                 | 典型文案   | 视觉             |
| ----------------- | -------------------- | ---------- | ---------------- |
| `neutral`（默认） | 查看、打开详情       | 查看       | 灰边 + 深灰字    |
| `edit`            | 编辑、配置           | 编辑、配置 | 浅蓝底 + 主色字  |
| `primary`         | 发布、启用等正向提交 | 发布       | 主色渐变实心按钮 |
| `danger`          | 删除等不可逆操作     | 删除       | 浅红底 + 红色字  |

```tsx
<AppTableActions align="start">
  {' '}
  {/* 抽屉工具栏左对齐；表格列默认 end */}
  <AppTableButton variant="neutral" onClick={onView}>
    查看
  </AppTableButton>
  <AppTableButton variant="edit" onClick={onEdit}>
    编辑
  </AppTableButton>
  <AppTableButton variant="primary" onClick={onPublish}>
    发布
  </AppTableButton>
  <AppTableButton variant="danger" onClick={onDelete}>
    删除
  </AppTableButton>
</AppTableActions>
```

页面级主按钮（新建、保存）仍用全局类：`app-button-primary` / `app-button-secondary` / `app-button-tertiary`（见 `src/global.css`）。`danger` 属性仍兼容，等价于 `variant="danger"`。

## 详情页顶栏（AppDetailHeader / AppDetailPage）

详情、配置类页面顶栏统一：

| 区域 | 内容 |
| --- | --- |
| 左侧 | **返回列表**（`common.backToList`），`onBack` 跳回对应列表路由 |
| 右侧 | 可编辑页显示 **保存**（`common.save`），通过 `onSave` 触发；只读详情不传 `onSave` |

```tsx
// 只读详情（用户、运行记录、对话等）
<AppDetailPage loading={loading} onBack={() => history.push('/user/list')} title={title}>
  {content}
</AppDetailPage>

// 可编辑详情（Agent、Tool、工具类型等）
<AppDetailHeader
  bordered
  onBack={handleDiscard}
  onSave={() => form.submit()}
  saveDisabled={submitting}
  saveLoading={submitting}
/>
```

- 组件路径：`src/components/AppDetailHeader/`
- 复杂布局（Agent/Tool 双栏）仅用 `AppDetailHeader`；简单详情用 `AppDetailPage` 包裹 shell + 标题区
- 不要在顶栏中间放标题；标题放在 `AppDetailHeading` 或页面内容区首屏
- 可编辑页不要在顶栏放「放弃」——返回列表即离开；保存仅放右侧

## 禁止事项

- 列表页不要用 `ProTable` 的 `search` + `request` 做筛选（与全局样式不一致）
- 不要把筛选样式写在页面 `index.module.scss`，统一由 `AppQueryPanel/index.module.scss` 管理
- 高级筛选不要做成独立 Modal，统一用 Collapse 展开
- 行内操作不要用无样式的 `text-primary` / `text-error` 文字按钮代替 `AppTableButton`

## 参考实现

- Agent 关联工具：`AgentBoundToolsFilter` + `AgentAllowedToolsTable`
- Agent 运行记录：`AgentRunFilter` + `AgentRunTable` + `useAgentRunList`
