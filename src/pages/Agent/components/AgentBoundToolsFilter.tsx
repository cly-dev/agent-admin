import {
  AppQueryInput,
  AppQueryInputNumber,
  AppQueryPanel,
  AppQuerySelect,
} from '@/components/AppQueryPanel';
import {
  countActiveAgentBoundToolsFilters,
  type AgentBoundToolsFilterFormValues,
  type AgentBoundToolsFilterValues,
} from '../agentBoundToolsFilter';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useMemo } from 'react';

type AgentBoundToolsFilterProps = {
  form: ReturnType<typeof Form.useForm<AgentBoundToolsFilterFormValues>>[0];
  appliedFilters: AgentBoundToolsFilterValues;
  loading?: boolean;
  onSearch: (values: AgentBoundToolsFilterFormValues) => void;
  onReset: () => void;
};

const HTTP_METHODS = ['Get', 'Post', 'Put', 'Delete'] as const;
const RISK_LEVELS = ['L1', 'L2', 'L3'] as const;

const AgentBoundToolsFilter: React.FC<AgentBoundToolsFilterProps> = ({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
}) => {
  const intl = useIntl();

  const triStateOptions = useMemo(
    () => [
      { value: '', label: intl.formatMessage({ id: 'agent.tools.filter.any' }) },
      { value: 'true', label: intl.formatMessage({ id: 'agent.tools.filter.yes' }) },
      { value: 'false', label: intl.formatMessage({ id: 'agent.tools.filter.no' }) },
    ],
    [intl],
  );

  const methodOptions = useMemo(
    () => [
      { value: '', label: intl.formatMessage({ id: 'agent.tools.filter.any' }) },
      ...HTTP_METHODS.map((method) => ({ value: method, label: method.toUpperCase() })),
    ],
    [intl],
  );

  const riskOptions = useMemo(
    () => [
      { value: '', label: intl.formatMessage({ id: 'agent.tools.filter.any' }) },
      ...RISK_LEVELS.map((level) => ({ value: level, label: level })),
    ],
    [intl],
  );

  const selectPlaceholder = intl.formatMessage({ id: 'appQueryPanel.selectPlaceholder' });
  const numberPlaceholder = intl.formatMessage({ id: 'appQueryPanel.numberPlaceholder' });

  return (
    <AppQueryPanel<AgentBoundToolsFilterFormValues>
      form={form}
      appliedFilters={appliedFilters}
      loading={loading}
      onSearch={onSearch}
      onReset={onReset}
      keywordLabel={intl.formatMessage({ id: 'agent.tools.filter.keyword' })}
      keywordPlaceholder={intl.formatMessage({ id: 'agent.tools.filter.keywordPlaceholder' })}
      countActive={countActiveAgentBoundToolsFilters}
      advancedContent={
        <AppQueryPanel.Grid>
          <Form.Item
            name="id"
            label={intl.formatMessage({ id: 'agent.tools.filter.bindingId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="toolId"
            label={intl.formatMessage({ id: 'agent.tools.filter.toolId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="definitionKey"
            label={intl.formatMessage({ id: 'agent.tools.filter.definitionKey' })}
          >
            <AppQueryInput placeholder={intl.formatMessage({ id: 'agent.tools.filter.definitionKeyPlaceholder' })} />
          </Form.Item>
          <Form.Item
            name="integrationId"
            label={intl.formatMessage({ id: 'agent.tools.filter.integrationId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="toolCategoryId"
            label={intl.formatMessage({ id: 'agent.tools.filter.toolCategoryId' })}
          >
            <AppQueryInputNumber min={1} placeholder={numberPlaceholder} />
          </Form.Item>
          <Form.Item
            name="toolCategoryIdIsNull"
            label={intl.formatMessage({ id: 'agent.tools.filter.toolCategoryIdIsNull' })}
          >
            <AppQuerySelect options={triStateOptions} placeholder={selectPlaceholder} />
          </Form.Item>
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'agent.tools.filter.name' })}
          >
            <AppQueryInput placeholder={intl.formatMessage({ id: 'agent.tools.filter.namePlaceholder' })} />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'agent.tools.filter.description' })}
          >
            <AppQueryInput placeholder={intl.formatMessage({ id: 'agent.tools.filter.descriptionPlaceholder' })} />
          </Form.Item>
          <Form.Item
            name="path"
            label={intl.formatMessage({ id: 'agent.tools.filter.path' })}
          >
            <AppQueryInput placeholder={intl.formatMessage({ id: 'agent.tools.filter.pathPlaceholder' })} />
          </Form.Item>
          <Form.Item
            name="riskLevel"
            label={intl.formatMessage({ id: 'agent.tools.filter.riskLevel' })}
          >
            <AppQuerySelect options={riskOptions} placeholder={selectPlaceholder} />
          </Form.Item>
          <Form.Item
            name="method"
            label={intl.formatMessage({ id: 'agent.tools.filter.method' })}
          >
            <AppQuerySelect options={methodOptions} placeholder={selectPlaceholder} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: 'agent.tools.filter.isActive' })}
          >
            <AppQuerySelect options={triStateOptions} placeholder={selectPlaceholder} />
          </Form.Item>
        </AppQueryPanel.Grid>
      }
    />
  );
};

export default AgentBoundToolsFilter;
