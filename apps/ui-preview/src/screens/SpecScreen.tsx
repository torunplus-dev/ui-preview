import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Role, ScreenSpec } from '@/types';
import { apiFetch } from '@/services/apiClient';
import { useAppState } from '@/contexts/AppContext';

type EntityRecord = Record<string, unknown> & { id: string };

function isAllowed(role: Role, required?: Role[]) {
  if (!required || required.length === 0) return true;
  return required.includes(role);
}

export function SpecScreen({ spec }: { spec: ScreenSpec }) {
  const { role, pushLog } = useAppState();
  const [rows, setRows] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const createAction = spec.actions.find((a) => a.type === 'openModal');
  const deleteAction = spec.actions.find((a) => a.type === 'delete');
  const canCreate = isAllowed(role, createAction?.roleRequired);
  const canDelete = isAllowed(role, deleteAction?.roleRequired);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ users?: EntityRecord[]; items?: EntityRecord[] }>(spec.api.list);
      setRows(data.users ?? data.items ?? []);
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [spec.api.list]);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return rows;
    const query = searchText.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [rows, searchText]);

  const columns: ColumnsType<EntityRecord> = [
    ...spec.table.columns.map((col) => ({
      title: col.title,
      dataIndex: col.dataIndex,
      key: col.key,
      render: (value: unknown) => (typeof value === 'string' && value.length < 30 ? value : String(value ?? ''))
    })),
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this item?"
          disabled={!canDelete}
          onConfirm={async () => {
            pushLog({ type: 'ui', message: `delete clicked for ${record.id}` });
            await apiFetch(spec.api.delete.replace(':id', String(record.id)), { method: 'DELETE' });
            message.success('Deleted');
            await loadData();
          }}
        >
          <Button danger size="small" disabled={!canDelete || !spec.api.delete}>
            {deleteAction?.label || 'Delete'}
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }} wrap>
        <Input.Search
          placeholder={spec.search.placeholder}
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />
        <Button type="primary" onClick={() => setModalOpen(true)} disabled={!canCreate}>
          {createAction?.label || 'Create'}
        </Button>
        <Button onClick={() => void loadData()}>Refresh</Button>
        <Tag color={canCreate ? 'green' : 'default'}>Create: {canCreate ? 'enabled' : 'disabled'}</Tag>
        <Tag color={canDelete ? 'green' : 'default'}>Delete: {canDelete ? 'enabled' : 'disabled'}</Tag>
      </Space>

      <Table rowKey={spec.table.rowKey} columns={columns} dataSource={filtered} loading={loading} />

      <Modal
        title={spec.createForm.title}
        open={isModalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
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
