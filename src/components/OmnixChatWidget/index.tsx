import { useProjectRoute } from '@/hooks/useProjectRoute';
import { getAuthSnapshot } from '@/services/auth/user';
import {
  buildOmnixChatPageContext,
  consumeOmnixChatAutoOpen,
  getOmnixChatAccountToken,
  getOmnixChatBaseUrl,
  getOmnixChatDsn,
  OMNIX_CHAT_UPDATED_EVENT,
} from '@/utils/omnix-chat';
import { isAuthPage } from '@/utils/project-path';
import { getLocale, useLocation } from '@umijs/max';
import { AgentChat } from 'omnix-chat/react';
import { useEffect, useMemo, useState } from 'react';

const OMNIX_THEME_TOKEN = { colorPrimary: '#003d8f' };

const OmnixChatWidget: React.FC = () => {
  const { pathname } = useLocation();
  const { currentProject } = useProjectRoute();
  const locale = getLocale();
  const [revision, setRevision] = useState(0);
  const [autoOpen, setAutoOpen] = useState(false);

  const authSnapshot = getAuthSnapshot();
  const authUser = authSnapshot.user;
  const projectId = currentProject?.id ?? 0;
  const dsn = getOmnixChatDsn();
  const baseUrl = getOmnixChatBaseUrl();
  const isAuthenticated = authSnapshot.isAuthenticated;

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId?: number }>).detail;
      if (!detail?.projectId || detail.projectId === projectId) {
        setRevision((value) => value + 1);
      }
    };

    window.addEventListener(OMNIX_CHAT_UPDATED_EVENT, handleUpdate);
    return () =>
      window.removeEventListener(OMNIX_CHAT_UPDATED_EVENT, handleUpdate);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setAutoOpen(false);
      return;
    }
    if (consumeOmnixChatAutoOpen(projectId)) {
      setAutoOpen(true);
    }
  }, [projectId, revision]);

  const accountToken = useMemo(
    () => getOmnixChatAccountToken(projectId),
    [projectId, revision],
  );

  const pageContext = useMemo(
    () => buildOmnixChatPageContext(pathname),
    [pathname],
  );

  if (!isAuthenticated || isAuthPage(pathname) || !dsn || !authUser?.id) {
    return null;
  }

  return (
    <AgentChat
      key={`${dsn}:${accountToken ?? ''}:${authUser.id}`}
      dsn={dsn}
      baseUrl={baseUrl}
      accountToken={accountToken ?? authSnapshot.accessToken ?? undefined}
      locale={locale}
      autoOpen={autoOpen}
      project={{ name: currentProject?.name ?? 'Agent Admin' }}
      pageContext={pageContext}
      themeToken={OMNIX_THEME_TOKEN}
      position="bottom-right"
      debug={process.env.NODE_ENV === 'development'}
    />
  );
};

export default OmnixChatWidget;
