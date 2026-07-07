"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ForgotPasswordFormValues = {
  identifier: string
}

type ResetRequestResponse = {
  message?: string
  ok?: boolean
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Unable to request reset instructions."
}

export default function ForgotPasswordPage() {
  const [submittedIdentifier, setSubmittedIdentifier] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      identifier: "",
    },
  })

  const requestResetMutation = useMutation({
    mutationFn: async ({ identifier }: ForgotPasswordFormValues) => {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      })
      const data = (await response.json()) as ResetRequestResponse

      if (!response.ok) {
        throw new Error(data.message || "Unable to request reset instructions.")
      }

      return data
    },
    onSuccess: (data, variables) => {
      setSubmittedIdentifier(variables.identifier)
      toast.success(data.message || "Reset instructions sent.")
      reset()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  return (
    <main className="recordit-login-bg flex min-h-svh flex-col items-center justify-center bg-[#f7f9ff] px-4 py-10 text-[#0d1d2a] sm:px-6">
      <div className="w-full max-w-[460px]">
        <Card className="rounded-xl border-[#c5c6d2] bg-white shadow-[0_4px_12px_rgb(0_35_102/0.05)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgb(0_35_102/0.12)]">
          <CardContent className="p-8 md:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <Link href="/">
                <div className="mb-4 grid size-24 place-items-center">
                  <Image
                    src="/logo.png"
                    alt="RecordIT Logo"
                    width={120}
                    height={120}
                    loading="eager"
                    className="rounded-xl"
                  />
                </div>
              </Link>
              <p className="mt-1 text-base text-[#444650]">
                Password Recovery
              </p>
              <h1 className="mt-3 text-2xl font-bold text-[#00113a]">
                Reset access securely
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#444650]">
                Enter your registered email address or phone number. RecordIT
                will send secure reset instructions if the account is found.
              </p>
            </div>

            {submittedIdentifier ? (
              <div className="mb-6 rounded-xl border border-[#b8c7ff] bg-[#ecf4ff] p-4 text-sm text-[#00113a]">
                <div className="flex gap-3">
                  <MaterialSymbol icon="mark_email_read" />
                  <p>
                    Check your email and SMS inbox for the reset instructions
                    linked to {submittedIdentifier}.
                  </p>
                </div>
              </div>
            ) : null}

            <form
              className="space-y-6"
              onSubmit={handleSubmit((values) =>
                requestResetMutation.mutate(values)
              )}
              noValidate
            >
              <div className="group">
                <Label htmlFor="identifier" className="mb-2 block">
                  Email or Phone Number
                </Label>
                <div className="relative">
                  <MaterialSymbol
                    icon="contact_mail"
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[#757682] transition-colors group-focus-within:text-[#2552ca]"
                  />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="name@school.edu or 024..."
                    autoComplete="username"
                    aria-invalid={Boolean(errors.identifier)}
                    className="h-14 rounded-none border-0 border-b-2 border-[#c5c6d2] bg-[#ecf4ff] pr-4 pl-10 text-base text-[#0d1d2a] placeholder:text-[#757682] focus-visible:border-[#2552ca]"
                    {...register("identifier", {
                      required: "Email address or phone number is required.",
                      minLength: {
                        value: 3,
                        message: "Enter a valid email address or phone number.",
                      },
                    })}
                  />
                </div>
                {errors.identifier ? (
                  <p className="mt-2 text-sm text-[#ba1a1a]">
                    {errors.identifier.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={requestResetMutation.isPending}
                className="h-14 w-full rounded-xl bg-[#2552ca] text-sm font-semibold text-white shadow-lg shadow-[#2552ca]/20 hover:bg-[#003baf]"
              >
                {requestResetMutation.isPending ? (
                  <>
                    <MaterialSymbol
                      icon="progress_activity"
                      className="animate-spin"
                    />
                    Sending instructions...
                  </>
                ) : (
                  <>
                    Send Reset Instructions
                    <MaterialSymbol icon="arrow_forward" />
                  </>
                )}
              </Button>

              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-[#2552ca] underline-offset-4 transition-colors hover:text-[#003baf] hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
