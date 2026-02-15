import { Button, Space, Tag } from 'antd';
import type { Role } from '@ui-preview/ui-spec';
import React from 'react';

export function RoleBadge({ role }: { role: Role }) {
  // role を表示ルール(色)へマッピングする純粋関数的な書き方。
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
  // propsで受け取った配列を map してボタン群を描画する基本パターン。
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
