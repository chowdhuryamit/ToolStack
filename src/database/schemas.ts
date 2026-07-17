import { z } from 'zod'

export const localSnippetSchema = z.object({
  id: z.string(),
  type: z.enum(['json', 'regex', 'css', 'react']),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  synced: z.boolean(),
})

export const toolHistorySchema = z.object({
  id: z.string(),
  toolId: z.string(),
  input: z.string().optional(),
  output: z.string().optional(),
  createdAt: z.number(),
})

export const localProjectSchema = z.object({
  id: z.string(),
  type: z.enum(['react', 'component', 'api']),
  title: z.string(),
  files: z.record(z.string(), z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const snippetSchema = localSnippetSchema
export const historySchema = toolHistorySchema
export const projectSchema = localProjectSchema
