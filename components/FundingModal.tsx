"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";
import { toFormValidate } from "@/lib/validation/refine";
import { validateFundingAmount, normalizeAmount } from "@/lib/validation/amount";
import { validateCardNumber } from "@/lib/validation/card";
import { validateRoutingNumber } from "@/lib/validation/routing";

interface FundingModalProps {
  accountId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type FundingFormData = {
  amount: string;
  fundingType: "card" | "bank";
  accountNumber: string;
  routingNumber?: string;
};

export function FundingModal({ accountId, onClose, onSuccess }: FundingModalProps) {
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FundingFormData>({
    defaultValues: {
      fundingType: "card",
    },
  });

  const fundingType = watch("fundingType");
  const fundAccountMutation = trpc.account.fundAccount.useMutation();

  const onSubmit = async (data: FundingFormData) => {
    setError("");

    try {
      const amount = parseFloat(data.amount.replace(/,/g, "").trim());
      if (Number.isNaN(amount) || amount <= 0) {
        setError("Amount must be greater than $0.00.");
        return;
      }

      await fundAccountMutation.mutateAsync({
        accountId,
        amount,
        fundingSource: {
          type: data.fundingType,
          accountNumber: data.fundingType === "card" ? data.accountNumber.replace(/\D/g, "") : data.accountNumber,
          routingNumber: data.fundingType === "bank" ? data.routingNumber : undefined,
        },
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to fund account");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Fund Your Account</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted">Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted sm:text-sm">$</span>
              </div>
              <input
                {...register("amount", {
                  validate: toFormValidate(validateFundingAmount),
                  onBlur: () => {
                    const v = getValues("amount");
                    if (v) setValue("amount", normalizeAmount(v), { shouldValidate: true });
                  },
                })}
                type="text"
                className="form-input pl-7 block w-full rounded-md border focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Funding Source</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input {...register("fundingType")} type="radio" value="card" className="mr-2" />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex items-center">
                <input {...register("fundingType")} type="radio" value="bank" className="mr-2" />
                <span>Bank Account</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted">
              {fundingType === "card" ? "Card Number" : "Account Number"}
            </label>
            <input
              {...register("accountNumber", {
                required: `${fundingType === "card" ? "Card" : "Account"} number is required`,
                validate: (value) => {
                  if (fundingType === "card") return validateCardNumber(value ?? "") ?? true;
                  if (!value?.trim()) return "Account number is required.";
                  if (!/^\d+$/.test((value ?? "").replace(/\s/g, ""))) return "Account number can only contain digits.";
                  return true;
                },
              })}
              type="text"
              className="form-input mt-1 block w-full rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              placeholder={fundingType === "card" ? "1234567812345678" : "123456789"}
            />
            {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>}
          </div>

          {fundingType === "bank" && (
            <div>
              <label className="block text-sm font-medium text-muted">Routing Number</label>
              <input
                {...register("routingNumber", {
                  required: "Routing number is required for bank transfers",
                  validate: (v) => validateRoutingNumber(v ?? "") ?? true,
                })}
                type="text"
                className="form-input mt-1 block w-full rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                placeholder="123456789"
              />
              {errors.routingNumber && <p className="mt-1 text-sm text-red-600">{errors.routingNumber.message}</p>}
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-md hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fundAccountMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {fundAccountMutation.isPending ? "Processing..." : "Fund Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
