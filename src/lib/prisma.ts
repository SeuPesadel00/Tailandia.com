import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (!envUrl) {
    return 'postgresql://postgres.rgggdawwkmncpfetuhij:Q3jYPW_%5EwHvj%3Fdz@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
  }
  // Corrige automaticamente o erro de digitação do hostname caso esteja configurado no painel da Vercel
  return envUrl.replace(/rgggdawwkmcnpfetuhij/g, 'rgggdawwkmncpfetuhij');
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
