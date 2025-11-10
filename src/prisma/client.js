const { PrismaClient } = require('@prisma/client');

const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
const testUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;

const url = process.env.NODE_ENV === 'test' ? testUrl : devUrl;

const prisma = new PrismaClient({
  datasourceUrl: url,
});

module.exports = prisma;
