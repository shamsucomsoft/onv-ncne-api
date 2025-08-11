export const environment = {
  rmq: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  port: process.env.PORT ?? 3000,
  origins: [
    process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    'http://localhost:5174',
    'https://ncaoosce.gov.ng',
    'https://ncne.bemisedu.org',
    'https://nmec.bemisedu.org',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
    'https://bemisedu.org',

  ],
};
