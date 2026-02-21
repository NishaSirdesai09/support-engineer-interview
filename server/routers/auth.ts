import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, lt } from "drizzle-orm";
import { emailSchema } from "@/lib/validation/email";
import { dateOfBirthSchema } from "@/lib/validation/dateOfBirth";
import { stateSchema } from "@/lib/validation/state";
import { phoneSchema } from "@/lib/validation/phone";
import { passwordSchema } from "@/lib/validation/password";
import { zipSchema } from "@/lib/validation/zip";
import { encryptSsn, ssnLast4 } from "@/lib/encryption/ssn";

const SESSION_MAX_AGE_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET must be set in production. Add it to your environment.");
  }
  return secret || "temporary-secret-for-interview";
}
const JWT_SECRET = getJwtSecret();

async function pruneExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: passwordSchema,
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: phoneSchema,
        dateOfBirth: dateOfBirthSchema,
        ssn: z.string().regex(/^\d{9}$/),
        address: z.string().min(1),
        city: z.string().min(1),
        state: stateSchema,
        zipCode: zipSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const ssnEncrypted = encryptSsn(input.ssn);

      await db.insert(users).values({
        ...input,
        password: hashedPassword,
        ssn: ssnEncrypted,
        ssnLast4: ssnLast4(input.ssn),
      });

      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: SESSION_MAX_AGE_SECONDS,
      });

      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      const cookieOpts = `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; ${cookieOpts}`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; ${cookieOpts}`);
      }

      const { password: _p, ssn: _s, ...safeUser } = user;
      return { user: safeUser, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: SESSION_MAX_AGE_SECONDS,
      });

      const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

      await pruneExpiredSessions();
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      const cookieOpts = `Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; ${cookieOpts}`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; ${cookieOpts}`);
      }

      const { password: _p, ssn: _s, ...safeUser } = user;
      return { user: safeUser, token };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    let token: string | undefined;
    if ("cookies" in ctx.req) {
      token = (ctx.req as any).cookies?.session;
    } else {
      const cookieHeader = ctx.req.headers.get?.("cookie") || (ctx.req.headers as any).cookie;
      token = cookieHeader
        ?.split("; ")
        .find((c: string) => c.startsWith("session="))
        ?.split("=")[1];
    }

    let sessionEnded = false;
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
      const stillExists = await db.select().from(sessions).where(eq(sessions.token, token)).get();
      sessionEnded = !stillExists;
    }

    const clearCookie = "session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
    if ("setHeader" in ctx.res) {
      ctx.res.setHeader("Set-Cookie", clearCookie);
    } else {
      (ctx.res as Headers).set("Set-Cookie", clearCookie);
    }

    // PERF-402: Report failure when we had a session but could not invalidate it
    if (ctx.user && token && !sessionEnded) {
      return { success: false, message: "Session could not be ended; please try again." };
    }
    return {
      success: true,
      message: ctx.user ? "Logged out successfully" : "No active session",
    };
  }),
});
