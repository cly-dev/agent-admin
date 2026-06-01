import { PlayCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { DEFAULT_DEBUG_INPUT } from '../constants';
import styles from '../index.module.scss';

type AgentDebugPanelProps = {
  disabled?: boolean;
};

const AgentDebugPanel: React.FC<AgentDebugPanelProps> = ({ disabled = false }) => {
  const intl = useIntl();
  const [input, setInput] = useState(DEFAULT_DEBUG_INPUT);

  return (
    <section className={styles.agentDetailTestPanel}>
      <div className={styles.agentDetailTestHead}>
        <h3 className={styles.agentDetailTestTitle}>
          {intl.formatMessage({ id: 'agent.detail.testTitle' })}
        </h3>
        <p className={styles.agentDetailTestDesc}>
          {intl.formatMessage({ id: 'agent.detail.testDesc' })}
        </p>
      </div>
      <label className={styles.agentDetailTestLabel} htmlFor="agent-debug-input">
        {intl.formatMessage({ id: 'agent.detail.testInput' })}
      </label>
      <textarea
        id="agent-debug-input"
        value={input}
        disabled={disabled}
        onChange={(event) => setInput(event.target.value)}
        className={`app-input ${styles.agentDetailTestTextarea}`}
        placeholder={intl.formatMessage({ id: 'agent.detail.testInputPlaceholder' })}
      />
      <button
        type="button"
        className="app-button-primary mt-3 inline-flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
      >
        <PlayCircleOutlined />
        {intl.formatMessage({ id: 'agent.detail.testRun' })}
      </button>
    </section>
  );
};

export default AgentDebugPanel;
