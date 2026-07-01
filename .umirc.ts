import { defineConfig } from '@umijs/max';
import path from 'path';

// Umi 仅在构建时把 UMI_APP_* 注入到浏览器；此处显式 define，避免只配 .env.dev 且未设 UMI_ENV 时读不到
const envDefine = {
  'process.env.UMI_APP_API_BASE_URL': process.env.UMI_APP_API_BASE_URL ?? '',
};

export default defineConfig({
  define: envDefine,
  esbuildMinifyIIFE: true,
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  locale: {
    default: 'zh-CN',
    antd: true,
    baseNavigator: true,
    useLocalStorage: true,
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3030',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  layout: {
    title: 'agent',
  },
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      name: 'login',
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      name: 'dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
      component: './Dashboard',
    },
    {
      name: 'project',
      path: '/project',
      icon: 'ProjectOutlined',
      component: './Project',
    },
    {
      path: '/project/detail/:id',
      component: './Project/Detail',
      hideInMenu: true,
    },
    {
      name: 'agent',
      path: '/agent',
      icon: 'RobotOutlined',
      routes: [
        {
          path: '/agent',
          redirect: '/agent/list',
          hideInMenu: true,
        },
        {
          name: 'agentList',
          path: '/agent/list',
          component: './Agent',
        },
        {
          name: 'agentRun',
          path: '/agent/run',
          component: './AgentRun',
        },
        {
          name: 'promptTemplate',
          path: '/agent/prompt-template',
          component: './PromptTemplate',
        },
        {
          name: 'skill',
          path: '/agent/skill',
          component: './Skill',
        },
        {
          path: '/agent/skill/detail/create',
          component: './Skill/Detail',
          hideInMenu: true,
        },
        {
          path: '/agent/skill/detail/:skillId',
          component: './Skill/Detail',
          hideInMenu: true,
        },
        {
          path: '/agent/skill/detail/:agentId/:skillId',
          redirect: '/agent/skill/detail/:skillId',
          hideInMenu: true,
        },
        {
          path: '/agent/run/detail/:id',
          component: './AgentRun/Detail',
          hideInMenu: true,
        },
        {
          path: '/agent/create',
          redirect: '/agent/detail/create',
          hideInMenu: true,
        },
        {
          path: '/agent/detail/:id',
          component: './Agent/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      name: 'tool',
      path: '/tool',
      icon: 'ToolOutlined',
      routes: [
        {
          path: '/tool',
          redirect: '/tool/list',
          hideInMenu: true,
        },
        {
          name: 'toolList',
          path: '/tool/list',
          component: './Tool',
        },
        {
          name: 'toolCategory',
          path: '/tool/category',
          component: './ToolCategory',
        },
        {
          path: '/tool/category/detail/:id',
          component: './ToolCategory/Detail',
          hideInMenu: true,
        },
        {
          name: 'hostTool',
          path: '/tool/host-tool',
          component: './HostTool',
        },
        {
          path: '/tool/host-tool/page/:id',
          component: './HostTool/Detail',
          hideInMenu: true,
        },
        {
          name: 'integration',
          path: '/tool/integration',
          component: './Integrations',
        },
        {
          path: '/tool/create',
          component: './Tool/Detail',
          hideInMenu: true,
        },
        {
          path: '/tool/detail/:id',
          component: './Tool/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      name: 'workflow',
      path: '/workflow',
      icon: 'PartitionOutlined',
      routes: [
        {
          path: '/workflow',
          redirect: '/workflow/frontend-tool-flow',
          hideInMenu: true,
        },
        {
          name: 'frontendToolFlow',
          path: '/workflow/frontend-tool-flow',
          component: './PageAction',
        },
        {
          name: 'workflowAssets',
          path: '/workflow/assets',
          component: './Workflow',
        },
        {
          path: '/workflow/assets/detail/create',
          component: './Workflow/Detail',
          hideInMenu: true,
        },
        {
          path: '/workflow/assets/detail/:id',
          component: './Workflow/Detail',
          hideInMenu: true,
        },
        {
          name: 'pageActionRun',
          path: '/workflow/page-action-run',
          component: './PageAction/Run',
        },
        {
          path: '/workflow/frontend-tool-flow/create',
          component: './PageAction/Create',
          hideInMenu: true,
        },
        {
          path: '/workflow/frontend-tool-flow/detail/:id',
          component: './PageAction/Edit',
          hideInMenu: true,
        },
        {
          path: '/workflow/page-action-run/detail/:id',
          component: './PageAction/Run/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      path: '/tool/workflow',
      redirect: '/workflow/frontend-tool-flow',
      hideInMenu: true,
    },
    {
      path: '/integration',
      redirect: '/tool/integration',
      hideInMenu: true,
    },
    {
      name: 'chat',
      path: '/chat',
      icon: 'MessageOutlined',
      routes: [
        {
          path: '/chat',
          redirect: '/chat/list',
          hideInMenu: true,
        },
        {
          name: 'chatList',
          path: '/chat/list',
          component: './Chat',
        },
        {
          name: 'chatFeedback',
          path: '/chat/feedback',
          component: './Chat/Feedback',
        },
        {
          path: '/chat/detail/:id',
          component: './Chat/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      name: 'user',
      path: '/user',
      icon: 'UserOutlined',
      routes: [
        {
          path: '/user',
          redirect: '/user/list',
          hideInMenu: true,
        },
        {
          name: 'userList',
          path: '/user/list',
          component: './User',
        },
        {
          name: 'rolePermission',
          path: '/user/role',
          component: './Role',
        },
        {
          path: '/user/detail/:id',
          component: './User/Detail',
          hideInMenu: true,
        },
      ],
    },
    {
      name: 'setting',
      path: '/setting',
      icon: 'SettingOutlined',
      routes: [
        {
          path: '/setting',
          redirect: '/setting/llm-model',
          hideInMenu: true,
        },
        {
          name: 'settingLlmModel',
          path: '/setting/llm-model',
          component: './Setting/LlmModelConfig',
        },
        {
          name: 'settingIntentRecall',
          path: '/setting/intent-recall',
          component: './Setting/IntentRecall',
        },
      ],
    },
  ],
  npmClient: 'pnpm',
  alias: {
    react: path.dirname(require.resolve('react/package.json')),
    'react-dom': path.dirname(require.resolve('react-dom/package.json')),
  },
  depTranspiler: 'none',
  mfsu: false,
});
