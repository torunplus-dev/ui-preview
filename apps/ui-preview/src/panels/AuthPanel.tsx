import { Card, Select } from 'antd';
import { RoleBadge } from '@ui-preview/ui-components';
import { useAppState } from '@/contexts/AppContext';

export function AuthPanel() {
  const { role, setRole } = useAppState();
  return (
    <Card size="small" title="Auth Role">
      <div style={{ marginBottom: 8 }}>
        <RoleBadge role={role} />
      </div>
      <Select
        style={{ width: '100%' }}
        value={role}
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
          { value: 'guest', label: 'Guest' }
        ]}
        onChange={setRole}
      />
    </Card>
  );
}
