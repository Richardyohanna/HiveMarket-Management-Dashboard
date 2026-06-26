import { useCallback, useState } from "react";

import {
  chargeBankTransfer as chargeBankTransferApi,
  chargeCard as chargeCardApi,
  submitOtp as submitOtpApi,
  submitPin as submitPinApi,
  verifyPayment,
} from "../api/paymentApi";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export type ChargeStatus =
  | "idle"
  | "loading"
  | "send_pin"
  | "send_otp"
  | "success"
  | "failed"
  | "awaiting_transfer";

export type CardDetails = {
  number: string;
  cvv: string;
  expMonth: string;
  expYear: string;
};

export type ChargeResult = {
  status: ChargeStatus;
  reference: string;
  message: string;

  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  expiresAt?: string;
};

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function usePaystackInApp() {

  const [status, setStatus] =
    useState<ChargeStatus>("idle");

  const [result, setResult] =
    useState<ChargeResult | null>(null);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // INTERPRET BACKEND RESPONSE
  // ─────────────────────────────────────────────────────────

  const interpretResponse = useCallback(
    (
      data: any,
      reference: string
    ): ChargeResult => {

      const d = data?.data ?? data;

      const paymentStatus =
        d?.status;

      switch (paymentStatus) {

        case "success":

          return {
            status: "success",
            reference,
            message: "Payment successful",
          };

        case "send_pin":

          return {
            status: "send_pin",
            reference,
            message: "Enter your card PIN",
          };

        case "send_otp":

          return {
            status: "send_otp",
            reference,
            message:
              d?.display_text ??
              "Enter OTP sent to your phone",
          };

        case "pending_bank_transfer":
        case "pay_offline":

          return {
            status: "awaiting_transfer",
            reference,

            message:
              d?.display_text ??
              "Transfer to account provided",

            bankName:
              d?.bank_name ??
              d?.bank?.name,

            accountNumber:
              d?.account_number,

            accountName:
              d?.account_name,

            expiresAt:
              d?.expires_at,
          };

        default:

          return {
            status: "failed",
            reference,

            message:
              d?.message ??
              data?.message ??
              "Payment failed",
          };
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────
  // CHARGE CARD
  // ─────────────────────────────────────────────────────────

  const chargeCard = useCallback(
    async (params: {
      email: string;
      amount: number;
      reference: string;
      card: CardDetails;
    }): Promise<ChargeResult> => {

      try {

        setStatus("loading");
        setErrorMsg(null);

        const response =
          await chargeCardApi({
            email: params.email,
            amount: params.amount,
            reference: params.reference,

            card: {
              number:
                params.card.number.replace(/\s/g, ""),

              cvv:
                params.card.cvv,

              expiry_month:
                params.card.expMonth,

              expiry_year:
                params.card.expYear,
            },
          });

        const res =
          interpretResponse(
            response,
            params.reference
          );

        setResult(res);
        setStatus(res.status);

        return res;

      } catch (e: any) {

        const fail: ChargeResult = {
          status: "failed",
          reference: params.reference,
          message: e.message,
        };

        setResult(fail);
        setStatus("failed");
        setErrorMsg(e.message);

        return fail;
      }
    },
    [interpretResponse]
  );

  // ─────────────────────────────────────────────────────────
  // SUBMIT PIN
  // ─────────────────────────────────────────────────────────

  const submitPin = useCallback(
    async (
      pin: string,
      reference: string
    ): Promise<ChargeResult> => {

      try {

        setStatus("loading");

        const response =
          await submitPinApi(
            pin,
            reference
          );

        const res =
          interpretResponse(
            response,
            reference
          );

        setResult(res);
        setStatus(res.status);

        return res;

      } catch (e: any) {

        const fail: ChargeResult = {
          status: "failed",
          reference,
          message: e.message,
        };

        setResult(fail);
        setStatus("failed");

        return fail;
      }
    },
    [interpretResponse]
  );

  // ─────────────────────────────────────────────────────────
  // SUBMIT OTP
  // ─────────────────────────────────────────────────────────

  const submitOtp = useCallback(
    async (
      otp: string,
      reference: string
    ): Promise<ChargeResult> => {

      try {

        setStatus("loading");

        const response =
          await submitOtpApi(
            otp,
            reference
          );

        const res =
          interpretResponse(
            response,
            reference
          );

        setResult(res);
        setStatus(res.status);

        return res;

      } catch (e: any) {

        const fail: ChargeResult = {
          status: "failed",
          reference,
          message: e.message,
        };

        setResult(fail);
        setStatus("failed");

        return fail;
      }
    },
    [interpretResponse]
  );

  // ─────────────────────────────────────────────────────────
  // BANK TRANSFER
  // ─────────────────────────────────────────────────────────

 // ─────────────────────────────────────────────────────────
// CHARGE BANK TRANSFER
// ─────────────────────────────────────────────────────────

    const chargeBankTransfer = useCallback(
    async (
        params: {
        email: string;
        amount: number;
        reference: string;

        }
    ): Promise<ChargeResult> => {

        try {

        setStatus("loading");

        setErrorMsg(null);

        const response =
            await chargeBankTransferApi(
            params.email,
            params.amount,
            params.reference,
            
            );

           console.log("This is the bank transfer response " , response);


        const res =
            interpretResponse(
            response,
            params.reference
            );

        setResult(res);

        setStatus(res.status);

        return res;

        } catch (e: any) {

        const fail: ChargeResult = {
            status: "failed",
            reference: params.reference,
            message: e.message,
        };

        setResult(fail);

        setStatus("failed");

        setErrorMsg(e.message);

        return fail;
        }
    },
    [interpretResponse]
    );
  // ─────────────────────────────────────────────────────────
  // VERIFY
  // ─────────────────────────────────────────────────────────

  const verify = useCallback(
    async (
      reference: string
    ) => {

      try {

        const response =
          await verifyPayment(reference);

        return response;

      } catch (e) {
        throw e;
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────

  const reset = useCallback(() => {

    setStatus("idle");
    setResult(null);
    setErrorMsg(null);

  }, []);

  // ─────────────────────────────────────────────────────────

  return {
    status,
    result,
    errorMsg,

    chargeCard,
    submitPin,
    submitOtp,
    chargeBankTransfer,
    verify,

    reset,
  };
}