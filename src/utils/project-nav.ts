import { AppClientController_findAll } from '@/services/admin-app-client';
import { CURRENT_PROJECT_STORAGE_KEY } from '@/utils/project-path';

export async function resolveDefaultProjectId(): Promise<number | null> {
  const list = await AppClientController_findAll().catch(() => []);
  if (list.length === 0) {
    return null;
  }

  const storedId = localStorage.getItem(CURRENT_PROJECT_STORAGE_KEY);
  const storedProject = storedId ? list.find((item) => String(item.id) === storedId) : undefined;
  const targetProject = storedProject ?? list[0];

  localStorage.setItem(CURRENT_PROJECT_STORAGE_KEY, String(targetProject.id));
  return targetProject.id;
}

export function getDefaultAppPath(pageKey = 'dashboard'): string {
  return `/${pageKey}`;
}
