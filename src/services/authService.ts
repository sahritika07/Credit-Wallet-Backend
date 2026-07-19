import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface SignupInput {
  full_name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

class AuthService {
  public async signup(input: SignupInput) {
    const email = input.email.trim().toLowerCase();

    if (!input.full_name || !email || !input.password) {
      throw new Error('Full name, email, and password are required');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const password_hash = await bcrypt.hash(input.password, 10);
    const user = await User.create({
      full_name: input.full_name.trim(),
      email,
      password_hash,
      role: 'user',
      is_active: true,
    });

    const token = this.generateToken({ id: user.id, email: user.email, role: user.role });

    return {
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
    };
  }

  public async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    await user.update({ last_login_at: new Date() });

    const token = this.generateToken({ id: user.id, email: user.email, role: user.role });

    return {
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
    };
  }

  public async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'full_name', 'email', 'role', 'is_active', 'last_login_at', 'createdAt'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  private generateToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
  }
}

export default new AuthService();
