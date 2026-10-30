import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { UpdateSettingsInput } from '../schemas/settings.schema';

export async function getSettings(req: Request, res: Response): Promise<void> {
  const organizationId = req.user!.organizationId;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      createdAt: true,
    },
  });

  if (!org) {
    res.status(404).json({ error: 'Organization not found.' });
    return;
  }

  res.json({ settings: org });
}

export async function updateSettings(
  req: Request<{}, {}, UpdateSettingsInput>,
  res: Response
): Promise<void> {
  const organizationId = req.user!.organizationId;
  const { defaultLowStockThreshold } = req.body;

  const updatedOrg = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      defaultLowStockThreshold,
    },
    select: {
      id: true,
      name: true,
      defaultLowStockThreshold: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'Settings updated successfully',
    settings: updatedOrg,
  });
}
