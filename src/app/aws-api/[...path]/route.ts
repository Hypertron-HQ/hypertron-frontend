import { proxyToAwsBackend } from "@/lib/aws-backend-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM =
  "http://hypertron-api-438173.us-west-2.elasticbeanstalk.com";

type Ctx = { params: Promise<{ path: string[] }> };

async function handle(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyToAwsBackend(request, UPSTREAM, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
