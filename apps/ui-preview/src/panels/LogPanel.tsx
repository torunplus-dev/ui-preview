import { Button, Card, List, Typography } from 'antd';
import { useAppState } from '@/contexts/AppContext';

export function LogPanel() {
  const { logs, clearLogs } = useAppState();

  return (
    <Card
      size="small"
      title="Event & API Logs"
      extra={
        <Button size="small" onClick={clearLogs}>
          Clear
        </Button>
      }
    >
      <List
        size="small"
        dataSource={logs}
        locale={{ emptyText: 'No logs yet' }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={`${item.type.toUpperCase()} • ${item.message}`}
              description={
                <>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.timestamp}
                  </Typography.Text>
                  {item.payload ? (
                    <pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(item.payload, null, 2)}</pre>
                  ) : null}
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
