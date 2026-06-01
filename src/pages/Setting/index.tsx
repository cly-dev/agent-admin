import { PageContainer } from '@ant-design/pro-components';

const SettingPage: React.FC = () => {
  return (
    <PageContainer ghost>
      <div className="p-6">
        <div className="app-panel p-6">
        <section className="app-card p-6">
          <p className="text-sm text-on-surface/70">
            平台级配置、集成与通知偏好设置。
          </p>
        </section>
        </div>
      </div>
    </PageContainer>
  );
};

export default SettingPage;
