import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const appConfig = {
	jwtSecret: process.env.JWT_SECRET || 'dev-secret',
	jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
	env: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT || 3001)
};

export const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
	await prisma.$connect();
	console.log('[DB] Connected to PostgreSQL via Prisma');
};
