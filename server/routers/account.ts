import { randomInt } from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { validateCardNumber } from "@/lib/validation/card";
import { validateRoutingNumber } from "@/lib/validation/routing";

const ACCOUNT_NUMBER_MAX = 1_000_000_000;
const ACCOUNT_NUMBER_DIGITS = 10;
const MAX_ACCOUNT_NUMBER_ATTEMPTS = 100;

function generateAccountNumber(): string {
  const value = randomInt(0, ACCOUNT_NUMBER_MAX);
  return value.toString().padStart(ACCOUNT_NUMBER_DIGITS, "0");
}

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber: string | undefined;
      let attempts = 0;

      while (attempts < MAX_ACCOUNT_NUMBER_ATTEMPTS) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        if (!existing) break;
        attempts++;
      }

      if (!accountNumber || attempts >= MAX_ACCOUNT_NUMBER_ATTEMPTS) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not generate a unique account number; please try again.",
        });
      }

      // PERF-401: Use transaction and return only real row; never return fake balance on failure
      const account = db.transaction((tx) => {
        tx.insert(accounts)
          .values({
            userId: ctx.user.id,
            accountNumber: accountNumber!,
            accountType: input.accountType,
            balance: 0,
            status: "active",
          })
          .run();
        const created = tx.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();
        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Account was created but could not be read back",
          });
        }
        return created;
      });

      return account;
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z
        .object({
          accountId: z.number(),
          amount: z
            .number()
            .refine((n) => n > 0, "Amount must be greater than $0.00")
            .refine((n) => n <= 10_000, "Amount cannot exceed $10,000"),
          fundingSource: z.object({
            type: z.enum(["card", "bank"]),
            accountNumber: z.string().min(1, "Account or card number is required"),
            routingNumber: z.string().optional(),
          }),
        })
        .superRefine((data, ctx) => {
          if (data.fundingSource.type === "bank") {
            const err = validateRoutingNumber(data.fundingSource.routingNumber ?? "");
            if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fundingSource", "routingNumber"], message: err });
          }
          if (data.fundingSource.type === "card") {
            const err = validateCardNumber(data.fundingSource.accountNumber);
            if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fundingSource", "accountNumber"], message: err });
          }
        })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      if (account.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account is not active",
        });
      }

      // PERF-405/406/407: Single transaction so balance and transaction row stay in sync; return actual created row
      const processedAt = new Date().toISOString();
      const result = db.transaction((tx) => {
        tx.insert(transactions)
          .values({
            accountId: input.accountId,
            type: "deposit",
            amount,
            description: `Funding from ${input.fundingSource.type}`,
            status: "completed",
            processedAt,
          })
          .run();

        tx.update(accounts)
          .set({ balance: account.balance + amount })
          .where(eq(accounts.id, input.accountId))
          .run();

        const created = tx
          .select()
          .from(transactions)
          .where(eq(transactions.accountId, input.accountId))
          .orderBy(desc(transactions.id))
          .limit(1)
          .get();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Funding recorded but transaction could not be read back; please check your balance.",
          });
        }

        return { transaction: created, newBalance: account.balance + amount };
      });

      return result;
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.createdAt), desc(transactions.id));

      return accountTransactions.map((transaction) => ({
        ...transaction,
        accountType: account.accountType,
      }));
    }),
});
