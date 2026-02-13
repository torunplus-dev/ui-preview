import { Button, Space, Tag } from 'antd';
import type { Role } from '@ui-preview/ui-spec';
import React from 'react';

export function RoleBadge({ role }: { role: Role }) {
  const colors: Record<Role, string> = { admin: 'red', user: 'blue', guest: 'gold' };
  return <Tag color={colors[role]}>Role: {role}</Tag>;
}

export function PanelSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

export function SmallActions({
  items
}: {
  items: { key: string; label: string; onClick: () => void; disabled?: boolean }[];
}) {
  return (
    <Space wrap>
      {items.map((item) => (
        <Button key={item.key} size="small" onClick={item.onClick} disabled={item.disabled}>
          {item.label}
        </Button>
      ))}
    </Space>
  );
}
