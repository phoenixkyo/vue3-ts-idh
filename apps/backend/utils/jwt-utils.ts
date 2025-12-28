import type { EventHandlerRequest, H3Event } from 'h3';

import type { UserInfo } from './mock-data';

import { getHeader } from 'h3';
import jwt from 'jsonwebtoken';

import { getDb } from './db';

// TODO: Replace with your own secret key
const ACCESS_TOKEN_SECRET = 'access_token_secret';
const REFRESH_TOKEN_SECRET = 'refresh_token_secret';

export interface UserPayload extends UserInfo {
  iat: number;
  exp: number;
}

export function generateAccessToken(user: UserInfo) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
}

export function generateRefreshToken(user: UserInfo) {
  return jwt.sign(user, REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
}

export async function verifyAccessToken(
  event: H3Event<EventHandlerRequest>,
): Promise<null | Omit<UserInfo, 'password'>> {
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
    ) as unknown as UserPayload;

    const username = decoded.username;
    // 从数据库中查找用户，而不是从静态数组
    const db = await getDb();
    const users = db.query(
      'SELECT id, username, nickname as realName, status, is_deleted FROM sys_user WHERE username = ? AND status = 1 AND is_deleted = 0',
      [username],
    );
    const user = users[0];
    if (!user) {
      return null;
    }
    const { password: _pwd, ...userinfo } = user;
    return userinfo;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<null | Omit<UserInfo, 'password'>> {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as UserPayload;
    const username = decoded.username;
    // 从数据库中查找用户，而不是从静态数组
    const db = await getDb();
    const users = db.query(
      'SELECT id, username, nickname as realName, status, is_deleted FROM sys_user WHERE username = ? AND status = 1 AND is_deleted = 0',
      [username],
    );
    const user = users[0];
    if (!user) {
      return null;
    }
    const { password: _pwd, ...userinfo } = user;
    return userinfo;
  } catch {
    return null;
  }
}
