import { buildPagePath, getRouteProjectIdFromPath } from '@/utils/project-path';
import { history, useModel, useParams } from '@umijs/max';

export function useProjectId(): number {
  const params = useParams<{ projectId?: string }>();
  const { currentProjectId } = useModel('project');

  const fromParams = Number(params.projectId);
  if (Number.isFinite(fromParams) && fromParams > 0) {
    return fromParams;
  }

  const fromRoute = getRouteProjectIdFromPath(history.location.pathname);
  if (fromRoute) {
    return fromRoute;
  }

  return currentProjectId ?? 0;
}

export function useProjectRoute() {
  const projectId = useProjectId();
  const { currentProject, projects, loading, switchProject, refreshProjects } = useModel('project');

  const toPagePath = (pageKey: string, subPath?: string) => buildPagePath(pageKey, subPath);

  return {
    projectId,
    currentProject,
    projects,
    loading,
    switchProject,
    refreshProjects,
    toPagePath,
  };
}
