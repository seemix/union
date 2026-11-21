import { revalidateTag } from 'next/cache';
import { createRevalidateHandler } from '@/lib/revalidate/handler';

export const POST = createRevalidateHandler({ revalidateTag });
