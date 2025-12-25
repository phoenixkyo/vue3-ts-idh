import type { EventHandlerRequest, H3Event } from 'h3';

import { getHeader } from 'h3';
import jwt from 'jsonwebtoken';
import { getDBManager } from './db-manager';

// TODO: Replace with your own secret key
const ACCESS_TOKEN_SECRET = 'access_token_secret';
const REFRESH_TOKEN_SECRET = 'refresh_token_secret';

export interface UserPayload {
  id: number;
  username: string;
  realName: string;
  roles: string[];
  homePath?: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(user: any) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(user: any) {
  return jwt.sign(user, REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
}

export async function verifyAccessToken(
  event: H3Event<EventHandlerRequest>,
): Promise<null | any> {
  const authHeader = getHeader(event, 'Authorization');
  if (!authHeader?.startsWith('Bearer')) {
    return null;
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2) {
    return null;
  }
  const token = tokenParts[1] as string;
  try {
    const decoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET,
    ) as unknown as any;

    return decoded;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<null | any> {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}
