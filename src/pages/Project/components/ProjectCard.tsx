import type { AppClient } from '@/types/admin-app-client';
import {
  KeyOutlined,
  ProjectOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import styles from '../index.module.scss';

type ProjectCardProps = {
  project: AppClient;
  onOpen: (project: AppClient) => void;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen }) => {
  const intl = useIntl();
  const isInactive = !project.isActive;
  const statusLabelId = isInactive
    ? 'project.status.inactive'
    : 'project.status.active';

  return (
    <article
      className={[
        styles.projectCard,
        isInactive ? styles.projectCardInactive : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={styles.projectCardClickLayer}
        onClick={() => onOpen(project)}
        aria-label={intl.formatMessage({ id: 'project.card.configure' })}
      />

      <div className={styles.projectCardInner}>
        <div className={styles.projectCardHeader}>
          <div className={styles.projectCardIdentity}>
            <div className={styles.projectCardAvatar}>
              <ProjectOutlined />
            </div>
            <div className={styles.projectCardHeading}>
              <h3 className={styles.projectCardTitle} title={project.name}>
                {project.name}
              </h3>
              <div className={styles.projectCardMeta}>
                <span
                  className={
                    isInactive
                      ? styles.projectCardStatusInactive
                      : styles.projectCardStatus
                  }
                >
                  <span className={styles.projectCardStatusDot} />
                  {intl.formatMessage({ id: statusLabelId })}
                </span>
                <span className={styles.projectCardBadge}>
                  {intl.formatMessage(
                    { id: 'project.card.id' },
                    { id: project.id },
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {project.dsn?.trim() ? (
          <p className={styles.projectCardDsn} title={project.dsn}>
            <KeyOutlined />
            <span>{project.dsn}</span>
          </p>
        ) : null}

        <p className={styles.projectCardDescription}>
          {project.description?.trim() ||
            intl.formatMessage({ id: 'project.card.noDescription' })}
        </p>

        <div className={styles.projectCardFooter}>
          {project.updatedAt ? (
            <p className={styles.projectCardMetaLine}>
              {intl.formatMessage(
                { id: 'project.card.updatedAt' },
                { time: project.updatedAt },
              )}
            </p>
          ) : (
            <span className={styles.projectCardMetaLinePlaceholder} />
          )}
          <button
            type="button"
            className={styles.projectCardActionConfigure}
            onClick={(event) => {
              event.stopPropagation();
              onOpen(project);
            }}
          >
            <SettingOutlined />
            {intl.formatMessage({ id: 'project.card.configure' })}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
