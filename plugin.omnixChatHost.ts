import type { IApi } from 'umi';

/**
 * omnix-chat host tweaks.
 * Do not alias `omnix-chat/react` to react.cjs.js — webpack cannot resolve named ESM imports from it.
 * react-is init is fixed in agent-chat postprocess (react.es.js).
 */
export default (api: IApi) => {
  api.describe({
    key: 'omnixChatHost',
  });

  api.modifyViteConfig((memo) => {
    memo.resolve = {
      ...memo.resolve,
      dedupe: ['react', 'react-dom'],
    };
    return memo;
  });
};
