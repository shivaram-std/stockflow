import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number()
    .int('Default threshold must be an integer')
    .min(0, 'Default threshold cannot be negative'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
