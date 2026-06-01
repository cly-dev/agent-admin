import { InfoCircleOutlined } from '@ant-design/icons';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';

const ProjectPage: React.FC = () => {
  const intl = useIntl();
  const { currentProject, projectId } = useProjectRoute();

  return (
    <PageContainer ghost>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-[-0.01em] text-on-surface">
            {intl.formatMessage({ id: 'project.page.title' })}
          </h1>
          <p className="mt-2 text-sm text-on-surface/70">
            {intl.formatMessage({ id: 'project.page.description' })}
          </p>
        </div>

        <section className="app-floating p-6">
          <div className="mb-5 flex items-center gap-2">
            <InfoCircleOutlined className="text-primary" />
            <h2 className="text-base font-semibold text-on-surface">
              {intl.formatMessage({ id: 'project.page.general' })}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/50">
                {intl.formatMessage({ id: 'project.page.name' })}
              </label>
              <input
                className="app-input w-full px-4 py-3 text-sm"
                defaultValue={currentProject?.name ?? ''}
                placeholder={intl.formatMessage({ id: 'project.page.namePlaceholder' })}
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/50">
                {intl.formatMessage({ id: 'project.page.id' })}
              </label>
              <input
                className="app-input w-full px-4 py-3 text-sm"
                value={String(projectId)}
                readOnly
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface/50">
                {intl.formatMessage({ id: 'project.page.primaryIntent' })}
              </label>
              <textarea
                className="app-input min-h-28 w-full px-4 py-3 text-sm"
                defaultValue={currentProject?.description ?? ''}
                placeholder={intl.formatMessage({ id: 'project.page.primaryIntentPlaceholder' })}
              />
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

export default ProjectPage;
