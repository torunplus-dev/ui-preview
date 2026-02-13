import { Card, Select, Space } from 'antd';
import { PanelSection } from '@ui-preview/ui-components';
import { useAppState } from '@/contexts/AppContext';
import type { MockMode } from '@/types';

const options: { label: string; value: MockMode }[] = [
  { label: 'Success', value: 'success' },
  { label: '400 Bad Request', value: 'badRequest' },
  { label: '403 Forbidden', value: 'forbidden' },
  { label: '500 Server Error', value: 'serverError' },
  { label: 'Delay', value: 'delay' },
  { label: 'Timeout', value: 'timeout' }
];

export function ScenarioPanel() {
  const { scenarios, setScenarios } = useAppState();
  return (
    <Card size="small" title="Scenario Control">
      <Space direction="vertical" style={{ width: '100%' }}>
        <PanelSection title="GET /api/users">
          <Select
            style={{ width: '100%' }}
            options={options}
            value={scenarios.GET_USERS}
            onChange={(v) => setScenarios((prev) => ({ ...prev, GET_USERS: v }))}
          />
        </PanelSection>
        <PanelSection title="POST /api/users">
          <Select
            style={{ width: '100%' }}
            options={options}
            value={scenarios.POST_USER}
            onChange={(v) => setScenarios((prev) => ({ ...prev, POST_USER: v }))}
          />
        </PanelSection>
        <PanelSection title="DELETE /api/users/:id">
          <Select
            style={{ width: '100%' }}
            options={options}
            value={scenarios.DELETE_USER}
            onChange={(v) => setScenarios((prev) => ({ ...prev, DELETE_USER: v }))}
          />
        </PanelSection>
      </Space>
    </Card>
  );
}
