import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ScreenSpec, User } from '@/types';
import { apiFetch } from '@/services/apiClient';
import { useAppState } from '@/contexts/AppContext';

export function UserListScreen({ spec }: { spec: ScreenSpec }) {
  // このコンポーネントは状態とイベントを持つため、Next.jsでは `use client` 側に置く。
  // 一方で一覧データ取得だけを Server Component に分離する構成もよく使う。
  const { role, pushLog } = useAppState();
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // 権限に応じたUI制御。認可そのものはサーバー側でも必須。
  const canCreate = role !== 'guest';
  const canDelete = role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      // Next.js に移行した場合:
      // - クライアントから叩く: `/api/users` (Route Handler)
      // - サーバーで先読み: Server Component から直接 fetch
      const data = await apiFetch<{ users: User[] }>(spec.api.list);
      setRows(data.users);
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  // specで指定されたAPIが変わったら再取得。
  // Next.js なら Server Component で fetch して渡す設計も可能。
  useEffect(() => {
    void loadData();
  }, [spec.api.list]);

  // 検索文字列や元データが変わった時だけ再計算。
  const filtered = useMemo(
    () => rows.filter((u) => u.name.toLowerCase().includes(searchText.toLowerCase())),
    [rows, searchText]
  );

  // テーブル定義を spec + UIロジックで組み立てる。
  const columns: ColumnsType<User> = [
    ...spec.table.columns.map((col) => ({ title: col.title, dataIndex: col.dataIndex, key: col.key })),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this user?"
          disabled={!canDelete}
          onConfirm={async () => {
            pushLog({ type: 'ui', message: `delete clicked for ${record.id}` });
            await apiFetch(spec.api.delete.replace(':id', record.id), { method: 'DELETE' });
            message.success('Deleted');
            await loadData();
          }}
        >
          <Button danger size="small" disabled={!canDelete}>
            Delete
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder={spec.search.placeholder}
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />
        <Button type="primary" onClick={() => setModalOpen(true)} disabled={!canCreate}>
          Create User
        </Button>
        <Button onClick={() => void loadData()}>Refresh</Button>
      </Space>
      <Table rowKey={spec.table.rowKey} columns={columns} dataSource={filtered} loading={loading} />
      <Modal
        title={spec.createForm.title}
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          // Form.Item の rules に沿ってバリデーション後、送信値を得る。
          const values = await form.validateFields();
          pushLog({ type: 'ui', message: 'create submit', payload: values });
          await apiFetch(spec.api.create, { method: 'POST', body: JSON.stringify(values) });
          message.success('Created');
          setModalOpen(false);
          form.resetFields();
          await loadData();
        }}
      >
        <Form form={form} layout="vertical">
          {/* フォーム定義も spec から生成して、画面実装の重複を減らす */}
          {spec.createForm.fields.map((field) => (
            <Form.Item key={field.name} name={field.name} label={field.label} rules={[{ required: field.required }]}>
              {field.component === 'select' ? (
                <Select
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'user', label: 'User' },
                    { value: 'guest', label: 'Guest' }
                  ]}
                />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </>
  );
}
