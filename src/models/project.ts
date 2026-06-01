import { AppClientController_findAll } from '@/services/admin-app-client';
import type { AppClient } from '@/types/admin-app-client';
import {
  CURRENT_PROJECT_STORAGE_KEY,
  getCleanPathFromEntry,
  getCurrentPagePath,
  getRouteProjectIdFromPath,
} from '@/utils/project-path';
import { history } from '@umijs/max';
import { useCallback, useEffect, useMemo, useState } from 'react';

const useProject = () => {
  const [projects, setProjects] = useState<AppClient[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(() => {
    const stored = localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });
  const [loading, setLoading] = useState(false);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === currentProjectId) ?? null,
    [currentProjectId, projects],
  );

  const setProjectId = useCallback((projectId: number) => {
    setCurrentProjectId(projectId);
    localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, String(projectId));
  }, []);

  const refreshProjects = useCallback(async (): Promise<AppClient[]> => {
    setLoading(true);
    try {
      const list = await AppClientController_findAll().catch(() => [] as AppClient[]);
      setProjects(list);

      if (list.length === 0) {
        setCurrentProjectId(null);
        localStorage.removeItem(CURRENT_PROJECT_STORAGE_KEY);
        return list;
      }

      setCurrentProjectId((prev) => {
        const routeProjectId = getRouteProjectIdFromPath(history.location.pathname);
        if (routeProjectId) {
          localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, String(routeProjectId));
          return routeProjectId;
        }

        if (prev && list.some((item) => item.id === prev)) {
          return prev;
        }

        const storedId = localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);
        const storedProject = storedId
          ? list.find((item) => String(item.id) === storedId)
          : undefined;
        const nextId = storedProject?.id ?? list[0].id;
        localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, String(nextId));
        return nextId;
      });

      return list;
    } finally {
      setLoading(false);
    }
  }, []);

  const applyRouteProjectId = useCallback(
    (pathname: string) => {
      const routeProjectId = getRouteProjectIdFromPath(pathname);
      if (routeProjectId) {
        setProjectId(routeProjectId);

        const cleanPath = getCleanPathFromEntry(pathname);
        if (cleanPath && cleanPath !== pathname) {
          history.replace(cleanPath);
        }
      }
    },
    [setProjectId],
  );

  const switchProject = useCallback(
    (projectId: number) => {
      setProjectId(projectId);
      const targetPath = getCurrentPagePath(history.location.pathname);
      if (history.location.pathname !== targetPath) {
        history.push(targetPath);
      }
    },
    [setProjectId],
  );

  useEffect(() => {
    applyRouteProjectId(history.location.pathname);
    void refreshProjects();

    const unlisten = history.listen(({ location }) => {
      applyRouteProjectId(location.pathname);
    });

    return unlisten;
  }, [applyRouteProjectId, refreshProjects]);

  return {
    projects,
    currentProject,
    currentProjectId,
    loading,
    refreshProjects,
    switchProject,
    setProjectId,
    applyRouteProjectId,
  };
};

export default useProject;
