import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { SignupInput, LoginInput } from '../schemas/auth.schema';
import { ensureDemoAccount, DEMO_EMAIL } from '../utils/demo';

export async function signup(req: Request<{}, {}, SignupInput>, res: Response): Promise<void> {
  const { email, password, organizationName } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    res.status(409).json({ error: 'A user with this email already exists.' });
    return;
  }

  const hashedPassword = await hashPassword(password);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const org = await tx.organization.create({
      data: {
        name: organizationName.trim(),
        defaultLowStockThreshold: 5,
      },
    });

    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    return { user, org };
  });

  const token = generateToken({
    userId: result.user.id,
    email: result.user.email,
    organizationId: result.org.id,
    organizationName: result.org.name,
  });

  res.status(201).json({
    message: 'Signup successful',
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      organizationId: result.org.id,
      organization: {
        id: result.org.id,
        name: result.org.name,
        defaultLowStockThreshold: result.org.defaultLowStockThreshold,
      },
    },
  });
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === DEMO_EMAIL) {
    await ensureDemoAccount();
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      organization: true,
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      organizationId: user.organization.id,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    },
  });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    include: {
      organization: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      organizationId: user.organization.id,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    },
  });
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  const { user, organization } = await ensureDemoAccount();

  const token = generateToken({
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
    organizationName: organization.name,
  });

  res.json({
    message: 'Demo login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      organizationId: organization.id,
      organization: {
        id: organization.id,
        name: organization.name,
        defaultLowStockThreshold: organization.defaultLowStockThreshold,
      },
    },
  });
}
