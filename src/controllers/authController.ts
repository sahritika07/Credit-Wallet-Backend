import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Currency from '../models/Currency';
import Wallet from '../models/Wallet';
import { createHttpError } from '../utils/httpError';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

const createWalletsForUser = async (userId: number) => {
  const currencies = await Currency.findAll({ where: { is_active: true } });

  await Promise.all(
    currencies.map((currency) =>
      Wallet.findOrCreate({
        where: { user_id: userId, currency_id: currency.id },
        defaults: { user_id: userId, currency_id: currency.id, current_balance: 0 },
      }),
    ),
  );
};

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const fullName = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!fullName || !email || !password) {
      throw createHttpError(400, 'Full name, email, and password are required');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw createHttpError(409, 'Email already registered');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name: fullName,
      email,
      password_hash,
      role: 'user',
      is_active: true,
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    try {
      await createWalletsForUser(user.id);
    } catch (error) {
      console.error('Failed to create wallets for new user:', error);
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      throw createHttpError(400, 'Email and password are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    await user.update({ last_login_at: new Date() });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const profile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createHttpError(401, 'Unauthorized');
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'full_name', 'email', 'role', 'is_active', 'last_login_at', 'createdAt'],
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export default { signup, login, profile };
