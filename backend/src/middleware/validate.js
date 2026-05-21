import { z } from 'zod';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues.map(i => i.message).join('; ');
      return res.status(400).json({ error: message });
    }
    req[source] = result.data;
    next();
  };
}

export const schemas = {
  upload: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').transform(s => s.trim()),
    userId: z.string().optional(),
  }),

  aiChat: z.object({
    question: z.string().min(1, 'Question is required').max(2000, 'Question too long').transform(s => s.trim()),
  }),

  meetingUpdate: z.object({
    title: z.string().min(1).max(200).optional(),
    category: z.string().max(50).optional(),
    tags: z.string().max(500).optional(),
    summary: z.string().max(5000).optional(),
    is_favorite: z.boolean().optional(),
  }),

  seedBody: z.object({
    userId: z.string().min(1, 'userId required'),
  }),
};
