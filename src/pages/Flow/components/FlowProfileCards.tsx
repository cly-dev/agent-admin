import type { FlowProfile } from '@/types/flow';
import { useIntl } from '@umijs/max';
import styles from '../../Workflow/index.module.scss';

const PROFILES: FlowProfile[] = ['page_action', 'chat_skill', 'shared'];

type FlowProfileCardsProps = {
  value?: FlowProfile;
  disabled?: boolean;
  onChange: (profile: FlowProfile) => void;
};

const FlowProfileCards: React.FC<FlowProfileCardsProps> = ({
  value,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();

  return (
    <div className={styles.flowProfileGrid}>
      {PROFILES.map((profile) => {
        const active = value === profile;
        return (
          <button
            key={profile}
            type="button"
            disabled={disabled}
            className={`${styles.flowProfileCard} ${active ? styles.flowProfileCardActive : ''}`.trim()}
            onClick={() => onChange(profile)}
          >
            <span className={styles.flowProfileCardTitle}>
              {intl.formatMessage({ id: `flow.profile.card.${profile}.title` })}
            </span>
            <span className={styles.flowProfileCardDesc}>
              {intl.formatMessage({ id: `flow.profile.card.${profile}.desc` })}
            </span>
            <span className={styles.flowProfileCardBind}>
              {intl.formatMessage({ id: `flow.profile.card.${profile}.bind` })}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FlowProfileCards;
