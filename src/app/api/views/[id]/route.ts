import { createViewsHandler } from '@/lib/views/handler';

/** One limiter per process (see `TtlLru` for the single-process assumption). */
const handle = createViewsHandler();

export async function POST(request: Request, ctx: RouteContext<'/api/views/[id]'>) {
  const { id } = await ctx.params;
  return handle(request, id);
}
