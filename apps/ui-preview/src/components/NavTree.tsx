import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/apiClient';
import type { TreeNodeItem } from '@/types';

type Props = {
  onOpenScreen: (node: TreeNodeItem) => void;
};

function toDataNodes(nodes: TreeNodeItem[]): DataNode[] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.title,
    isLeaf: node.isLeaf,
    screenSpecPath: node.screenSpecPath
  }));
}

export function NavTree({ onOpenScreen }: Props) {
  const [treeData, setTreeData] = useState<DataNode[]>([]);

  useEffect(() => {
    apiFetch<TreeNodeItem[]>('/api/tree').then((nodes) => setTreeData(toDataNodes(nodes)));
  }, []);

  const onLoadData = async (node: DataNode): Promise<void> => {
    const children = await apiFetch<TreeNodeItem[]>(`/api/tree?parentId=${node.key}`);
    node.children = toDataNodes(children);
    setTreeData([...treeData]);
  };

  return (
    <Tree
      treeData={treeData}
      loadData={onLoadData}
      onSelect={(_, info) => {
        const n = info.node as DataNode & TreeNodeItem;
        if (n.isLeaf && n.screenSpecPath) {
          onOpenScreen({
            id: String(n.key),
            title: String(n.title),
            isLeaf: true,
            screenSpecPath: n.screenSpecPath
          });
        }
      }}
    />
  );
}
