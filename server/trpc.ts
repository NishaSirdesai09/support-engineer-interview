import { initTRPC, TRPCError } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createContext(opts: CreateNextContextOptions | FetchCreateContextFnOptions) {
  let req: any;
  let res: any;

  if ("req" in opts && "res" in opts) {
    req = opts.req;
    res = opts.res;
  } else {
    req = opts.req;
    res = opts.resHeaders;
  }

  try {
    let token: string | undefined;
    const cookieHeader =
      typeof req?.headers?.cookie === "string"
        ? req.headers.cookie
        : typeof req?.headers?.get === "function"
          ? req.headers.get("cookie") || ""
          : "";

    const cookiesObj = Object.fromEntries(
      cookieHeader
        .split("; ")
        .filter(Boolean)
        .map((c: string) => {
          const [key, ...val] = c.split("=");
          return [key, val.join("=")];
        })
    );
    token = cookiesObj.session;

    const sessionExpiryBufferMs = 5 * 60 * 1000;
    let user = null;

    if (token && typeof token === "string") {
      const secret =
        process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "temporary-secret-for-interview");
      if (!secret) {
        throw new Error("JWT_SECRET not set");
      }
      const decoded = jwt.verify(token, secret) as { userId: number };

      const session = await db.select().from(sessions).where(eq(sessions.token, token)).get();
      const now = Date.now();
      const expiresAtMs = session ? new Date(session.expiresAt).getTime() : 0;
      const isValid = session && expiresAtMs > now + sessionExpiryBufferMs;

      if (isValid && decoded?.userId != null) {
        user = await db.select().from(users).where(eq(users.id, Number(decoded.userId))).get();
      }
    }

    return { user, req, res };
  } catch {
    return { user: null, req, res };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
