import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';

const DashboardPage: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer ghost>
      <div className="p-6">
        <div className="app-panel p-6">
          <section className="app-card p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-on-surface">
              {intl.formatMessage({ id: 'dashboard.title' })}
            </h2>
            <p className="mt-2 text-sm text-on-surface/70">
              {intl.formatMessage({ id: 'dashboard.description' })}
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
