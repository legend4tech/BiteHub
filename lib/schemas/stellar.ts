import { z } from "zod"

export const stellarSessionRequestSchema = z.object({
  amountInNaira: z.number().positive("Amount must be greater than 0"),
})

export const stellarSimulateRequestSchema = z.object({
  destinationAddress: z.string().min(10, "Invalid Stellar destination address"),
  memo: z.string().min(1, "Memo is required"),
  amount: z.string().default("5.00"),
})

export const stellarVerifyRequestSchema = z.object({
  memo: z.string().min(1, "Memo is required"),
})

export type StellarSessionRequest = z.infer<typeof stellarSessionRequestSchema>
export type StellarSimulateRequest = z.infer<
  typeof stellarSimulateRequestSchema
>
export type StellarVerifyRequest = z.infer<typeof stellarVerifyRequestSchema>
