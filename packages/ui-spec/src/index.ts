import { z } from 'zod';

export const actionSchema = z.object({
  type: z.enum(['openModal', 'delete', 'submit', 'refresh']),
  label: z.string(),
  roleRequired: z.array(z.enum(['admin', 'user', 'guest'])).optional()
});

export const columnSchema = z.object({
  key: z.string(),
  title: z.string(),
  dataIndex: z.string()
});

export const formFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  component: z.enum(['input', 'select']),
  required: z.boolean().default(false)
});

export const screenSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('dataScreen'),
  api: z.object({
    list: z.string(),
    create: z.string(),
    delete: z.string()
  }),
  table: z.object({
    rowKey: z.string(),
    columns: z.array(columnSchema)
  }),
  search: z.object({
    placeholder: z.string()
  }),
  createForm: z.object({
    title: z.string(),
    fields: z.array(formFieldSchema)
  }),
  actions: z.array(actionSchema)
});

export type ScreenSpec = z.infer<typeof screenSpecSchema>;
export type Role = 'admin' | 'user' | 'guest';

export function validateScreenSpec(input: unknown): ScreenSpec {
  return screenSpecSchema.parse(input);
}
