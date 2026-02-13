import { Layout, Tabs, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { loadSpecFromPublic } from '@ui-preview/ui-renderer';
import { NavTree } from '@/components/NavTree';
import { AppProvider, useAppState } from '@/contexts/AppContext';
import { AuthPanel } from '@/panels/AuthPanel';
import { LogPanel } from '@/panels/LogPanel';
import { ScenarioPanel } from '@/panels/ScenarioPanel';
import { setMockRole, setScenarioState } from '@/mock/scenarioBridge';
import { registerApiLogger } from '@/services/apiClient';
import { UserListScreen } from '@/screens/UserListScreen';
import type { ScreenSpec, TreeNodeItem } from '@/types';

const { Header, Sider, Content } = Layout;

type OpenTab = { key: string; title: string; spec: ScreenSpec };

function AppInner() {
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeKey, setActiveKey] = useState<string>();
  const { scenarios, role, pushLog } = useAppState();

  useEffect(() => {
    setScenarioState(scenarios);
  }, [scenarios]);

  useEffect(() => {
    setMockRole(role);
  }, [role]);

  useEffect(() => {
    registerApiLogger(pushLog);
  }, [pushLog]);

  const openScreen = async (node: TreeNodeItem) => {
    if (!node.screenSpecPath) return;
    const exists = tabs.find((t) => t.key === node.id);
    if (exists) {
      setActiveKey(exists.key);
      return;
    }
    const spec = await loadSpecFromPublic(node.screenSpecPath);
    pushLog({ type: 'ui', message: `open screen ${spec.id}` });
    const next = [...tabs, { key: node.id, title: node.title, spec }];
    setTabs(next);
    setActiveKey(node.id);
  };

  const items = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.key,
        label: tab.title,
        children: <UserListScreen spec={tab.spec} />
      })),
    [tabs]
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: '#fff' }}>
        <Typography.Text style={{ color: '#fff', fontSize: 18 }}>UI Preview (Spec + MSW)</Typography.Text>
      </Header>
      <Layout>
        <Sider width={260} theme="light" style={{ borderRight: '1px solid #eee', padding: 12 }}>
          <Typography.Title level={5}>Navigation</Typography.Title>
          <NavTree onOpenScreen={openScreen} />
        </Sider>
        <Content style={{ padding: 16 }}>
          <Tabs
            type="editable-card"
            hideAdd
            activeKey={activeKey}
            items={items}
            onChange={setActiveKey}
            onEdit={(targetKey, action) => {
              if (action === 'remove') {
                const next = tabs.filter((t) => t.key !== targetKey);
                setTabs(next);
                if (activeKey === targetKey) {
                  setActiveKey(next[0]?.key);
                }
              }
            }}
          />
        </Content>
        <Sider width={360} theme="light" style={{ borderLeft: '1px solid #eee', padding: 12, overflow: 'auto' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <AuthPanel />
            <ScenarioPanel />
            <LogPanel />
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
