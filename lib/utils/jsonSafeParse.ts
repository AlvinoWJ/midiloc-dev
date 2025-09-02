import { NextRequest } from 'next/server';
import { z } from 'zod';

type Ok<T> = { success: true; data: T };
type Err = { success: false; status: number; error: unknown };

export async function jsonSafeParse<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<Ok<T> | Err> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      success: false,
      status: 400,
      error: { message: 'Invalid JSON body' },
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      status: 422,
      error: result.error.issues,
    };
  }

  return { success: true, data: result.data };
}