"use client"

import Image from "next/image"
import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

type ResetPasswordFormValues = {
  confirmPassword: string
  password: string
}

function getResetErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Unable to reset password."
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const tokenError = searchParams.get("error")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: ResetPasswordFormValues) => {
      if (!token) {
        throw new Error("This reset link is invalid or expired.")
      }

      const response = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (response.error) {
        throw new Error(
          response.error.message || "This reset link is invalid or expired."
        )
      }

      return response.data
    },
    onSuccess: () => {
      toast.success("Password reset. You can now sign in.")
      router.push("/login")
    },
    onError: (error) => {
      toast.error(getResetErrorMessage(error))
    },
  })

  const hasTokenError = Boolean(tokenError) || !token

  return (
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
          <p className="mt-1 text-base text-[#444650]">Password Recovery</p>
          <h1 className="mt-3 text-2xl font-bold text-[#00113a]">
            Choose a new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#444650]">
            Set a secure password for your RecordIT account.
          </p>
        </div>

        {hasTokenError ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#f3b8b5] bg-[#fff1f0] p-4 text-sm text-[#601410]">
              <div className="flex gap-3">
                <MaterialSymbol icon="error" />
                <p>
                  This reset link is invalid or expired. Request a new secure
                  password reset link to continue.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="h-14 w-full rounded-xl bg-[#2552ca] text-sm font-semibold text-white shadow-lg shadow-[#2552ca]/20 hover:bg-[#003baf]"
            >
              <Link href="/forgot-password">
                Request New Link
                <MaterialSymbol icon="arrow_forward" />
              </Link>
            </Button>
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={handleSubmit((values) =>
              resetPasswordMutation.mutate(values)
            )}
            noValidate
          >
            <div className="group">
              <Label htmlFor="password" className="mb-2 block">
                New Password
              </Label>
              <div className="relative">
                <MaterialSymbol
                  icon="lock"
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-[#757682] transition-colors group-focus-within:text-[#2552ca]"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  className="h-14 rounded-none border-0 border-b-2 border-[#c5c6d2] bg-[#ecf4ff] pr-12 pl-10 text-base text-[#0d1d2a] placeholder:text-[#757682] focus-visible:border-[#2552ca]"
                  {...register("password", {
                    required: "New password is required.",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters.",
                    },
                    maxLength: {
                      value: 128,
                      message: "Password must be 128 characters or fewer.",
                    },
                  })}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#757682] transition-colors hover:text-[#2552ca]"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <MaterialSymbol
                    icon={showPassword ? "visibility_off" : "visibility"}
                  />
                </button>
              </div>
              {errors.password ? (
                <p className="mt-2 text-sm text-[#ba1a1a]">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="group">
              <Label htmlFor="confirmPassword" className="mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <MaterialSymbol
                  icon="verified_user"
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-[#757682] transition-colors group-focus-within:text-[#2552ca]"
                />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className="h-14 rounded-none border-0 border-b-2 border-[#c5c6d2] bg-[#ecf4ff] pr-12 pl-10 text-base text-[#0d1d2a] placeholder:text-[#757682] focus-visible:border-[#2552ca]"
                  {...register("confirmPassword", {
                    required: "Confirm your new password.",
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match.",
                  })}
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#757682] transition-colors hover:text-[#2552ca]"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                >
                  <MaterialSymbol
                    icon={
                      showConfirmPassword ? "visibility_off" : "visibility"
                    }
                  />
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-2 text-sm text-[#ba1a1a]">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="h-14 w-full rounded-xl bg-[#2552ca] text-sm font-semibold text-white shadow-lg shadow-[#2552ca]/20 hover:bg-[#003baf]"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <MaterialSymbol
                    icon="progress_activity"
                    className="animate-spin"
                  />
                  Updating password...
                </>
              ) : (
                <>
                  Reset Password
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
        )}
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="recordit-login-bg flex min-h-svh flex-col items-center justify-center bg-[#f7f9ff] px-4 py-10 text-[#0d1d2a] sm:px-6">
      <div className="w-full max-w-[460px]">
        <Suspense
          fallback={
            <Card className="rounded-xl border-[#c5c6d2] bg-white shadow-[0_4px_12px_rgb(0_35_102/0.05)]">
              <CardContent className="flex min-h-[360px] items-center justify-center p-8">
                <MaterialSymbol
                  icon="progress_activity"
                  className="animate-spin text-[#2552ca]"
                />
              </CardContent>
            </Card>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  )
}
