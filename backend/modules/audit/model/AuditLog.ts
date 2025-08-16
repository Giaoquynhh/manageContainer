// Prisma model - no need for separate model file since it's defined in schema.prisma
export interface IAuditLog {
	actor_id: string | null;
	action: string;
	entity?: string;
	entity_id?: string;
	meta?: any;
	createdAt: Date;
}

// This file is kept for type definitions only
// The actual model is handled by Prisma
