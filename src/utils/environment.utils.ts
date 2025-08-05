export const environment = {
  rmq: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  port: process.env.PORT ?? 3000,
  origins: [
    process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    'http://localhost:5174',
  ],
};
