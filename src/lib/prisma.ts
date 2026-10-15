import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const defaultDatabaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.rgggdawwkmncpfetuhij:Q3jYPW_%5EwHvj%3Fdz@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: defaultDatabaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
