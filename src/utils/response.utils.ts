import { HttpException } from '@nestjs/common';

export function responder<T>(status: number, data: T, message?: string) {
  if (status >= 200 && status < 300) {
    return {
      status,
      data,
      message,
    };
  }
  throw new HttpException(
    {
      status,
      message,
    },
    status,
  );
}
