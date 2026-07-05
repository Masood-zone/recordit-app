"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import Image from "next/image"

type LoginFormValues = {
  email: string
  password: string
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "Unable to authenticate with those credentials."
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginFormValues) => {
      const response = await authClient.signIn.email({
        email,
        password,
      })

      if (response.error) {
        throw new Error(response.error.message || "Login failed")
      }

      return response.data
    },
    onSuccess: () => {
      toast.success("Authenticated. Redirecting to dashboard...")
      router.push("/")
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error))
    },
  })

  return (
    <main className="recordit-login-bg flex min-h-svh flex-col items-center justify-center bg-[#f7f9ff] px-4 py-10 text-[#0d1d2a] sm:px-6">
      <div className="w-full max-w-[440px]">
        <Card className="rounded-xl border-[#c5c6d2] bg-white shadow-[0_4px_12px_rgb(0_35_102/0.05)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgb(0_35_102/0.12)]">
          <CardContent className="p-8 md:p-10">
            <div className="mb-10 flex flex-col items-center">
              <div className="mb-4 grid size-24 place-items-center">
                <Image
                  src="/logo.png"
                  alt="RecordIT Logo"
                  width={120}
                  height={120}
                  className="rounded-xl"
                />
              </div>
              <p className="mt-1 text-base text-[#444650]">Login Portal</p>
            </div>

            <form
              className="space-y-6"
              onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
              noValidate
            >
              <div className="group">
                <Label htmlFor="email" className="mb-2 block">
                  Institution Email
                </Label>
                <div className="relative">
                  <MaterialSymbol
                    icon="mail"
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[#757682] transition-colors group-focus-within:text-[#2552ca]"
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.edu"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    className="h-14 rounded-none border-0 border-b-2 border-[#c5c6d2] bg-[#ecf4ff] pr-4 pl-10 text-base text-[#0d1d2a] placeholder:text-[#0d1d2a] focus-visible:border-[#2552ca]"
                    {...register("email", {
                      required: "Institution email is required.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid institution email.",
                      },
                    })}
                  />
                </div>
                {errors.email ? (
                  <p className="mt-2 text-sm text-[#ba1a1a]">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="group">
                <Label htmlFor="password" className="mb-2 block">
                  Security Password
                </Label>
                <div className="relative">
                  <MaterialSymbol
                    icon="lock"
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[#757682] transition-colors group-focus-within:text-[#2552ca]"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    className="h-14 rounded-none border-0 border-b-2 border-[#c5c6d2] bg-[#ecf4ff] pr-12 pl-10 text-base text-[#0d1d2a] placeholder:text-[#0d1d2a] focus-visible:border-[#2552ca]"
                    {...register("password", {
                      required: "Security password is required.",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters.",
                      },
                    })}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="h-14 w-full rounded-xl bg-[#2552ca] text-sm font-semibold text-white shadow-lg shadow-[#2552ca]/20 hover:bg-[#003baf]"
                >
                  {loginMutation.isPending ? (
                    <>
                      <MaterialSymbol
                        icon="progress_activity"
                        className="animate-spin"
                      />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Login to Dashboard
                      <MaterialSymbol
                        icon="arrow_forward"
                        className="transition-transform group-hover/button:translate-x-1"
                      />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#2552ca] underline-offset-4 transition-colors hover:text-[#003baf] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-center font-mono text-xs text-[#757682]">
            © 2026 RecordIT Biometric Systems. All Rights Reserved.
          </p>
        </div>
      </div>
    </main>
  )
}
