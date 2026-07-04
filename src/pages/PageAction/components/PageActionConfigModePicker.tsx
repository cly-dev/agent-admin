import { ApartmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import styles from '../index.module.scss';
import type { PageActionConfigMode } from '../pageActionFormShared';

type PageActionConfigModePickerProps = {
  value: PageActionConfigMode;
  onChange: (mode: PageActionConfigMode) => void;
};

const MODE_OPTIONS: {
  value: PageActionConfigMode;
  icon: React.ReactNode;
  accentClass: string;
}[] = [
  {
    value: 'prompt',
    icon: <FileTextOutlined />,
    accentClass: styles.configModeCardAccentPrompt,
  },
  {
    value: 'workflow',
    icon: <ApartmentOutlined />,
    accentClass: styles.configModeCardAccentWorkflow,
  },
];

const PageActionConfigModePicker: React.FC<PageActionConfigModePickerProps> = ({
  value,
  onChange,
}) => {
  const intl = useIntl();

  return (
    <section className={styles.configModeSection} aria-label="execution mode">
      <header className={styles.configModeHeader}>
        <p className={styles.configModeEyebrow}>
          {intl.formatMessage({ id: 'pageAction.form.configMode.eyebrow' })}
        </p>
        <h2 className={styles.configModeTitle}>
          {intl.formatMessage({ id: 'pageAction.form.configMode.title' })}
        </h2>
        <p className={styles.configModeLead}>
          {intl.formatMessage({ id: 'pageAction.form.configMode.lead' })}
        </p>
      </header>

      <div className={styles.configModeGrid} role="radiogroup">
        {MODE_OPTIONS.map((option) => {
          const selected = value === option.value;
          const titleId = `page-action-mode-${option.value}-title`;
          const descId = `page-action-mode-${option.value}-desc`;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-labelledby={titleId}
              aria-describedby={descId}
              className={`${styles.configModeCard} ${option.accentClass} ${
                selected ? styles.configModeCardSelected : ''
              }`.trim()}
              onClick={() => onChange(option.value)}
            >
              <span className={styles.configModeCardIcon}>{option.icon}</span>
              <span className={styles.configModeCardBody}>
                <span id={titleId} className={styles.configModeCardTitle}>
                  {intl.formatMessage({
                    id: `pageAction.form.configMode.${option.value}.title`,
                  })}
                </span>
                <span id={descId} className={styles.configModeCardDesc}>
                  {intl.formatMessage({
                    id: `pageAction.form.configMode.${option.value}.desc`,
                  })}
                </span>
              </span>
              <span className={styles.configModeCardMark} aria-hidden>
                {selected
                  ? intl.formatMessage({
                      id: 'pageAction.form.configMode.active',
                    })
                  : intl.formatMessage({
                      id: 'pageAction.form.configMode.inactive',
                    })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default PageActionConfigModePicker;
