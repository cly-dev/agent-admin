import { defineConfig } from '@umijs/max';

export default defineConfig({
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
      name: 'integration',
      path: '/integration',
      icon: 'ApiOutlined',
      component: './Integrations',
    },
    {
      name: 'chat',
      path: '/chat',
      icon: 'MessageOutlined',
      component: './Chat',
    },
    {
      path: '/chat/detail/:id',
      component: './Chat/Detail',
      hideInMenu: true,
    },
    {
      name: 'user',
      path: '/user',
      icon: 'UserOutlined',
      component: './User',
    },
    {
      path: '/user/detail/:id',
      component: './User/Detail',
      hideInMenu: true,
    },
    {
      name: 'setting',
      path: '/setting',
      icon: 'SettingOutlined',
      component: './Setting',
    },
  ],
  npmClient: 'pnpm',
  utoopack: {},
});
