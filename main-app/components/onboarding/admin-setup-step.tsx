"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { getSchoolProfileDraft } from "@/components/onboarding/school-profile-step"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSubmitSchoolOnboarding } from "@/services/onboarding/school-onboarding"

type AdminDraft = {
  adminEmail: string
  adminFirstName: string
  adminLastName: string
  adminPhone: string
  confirmPassword: string
  password: string
}

const emptyDraft: AdminDraft = {
  adminEmail: "",
  adminFirstName: "",
  adminLastName: "",
  adminPhone: "",
  confirmPassword: "",
  password: "",
}

export function AdminSetupStep() {
  const router = useRouter()
  const mutation = useSubmitSchoolOnboarding()
  const [draft, setDraft] = useState(emptyDraft)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function update(field: keyof AdminDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const profile = getSchoolProfileDraft()

    try {
      const result = await mutation.mutateAsync({ ...profile, ...draft })
      window.sessionStorage.setItem(
        "recordit:onboarding:submitted",
        JSON.stringify({
          schoolId: result.schoolId,
          schoolName: profile.schoolName,
          status: result.status,
        })
      )
      toast.success("School application submitted")
      router.push("/onboarding/step-3")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_380px]"
    >
      <section className="recordit-card p-6 md:p-8">
        <p className="mb-2 text-sm font-bold tracking-[0.12em] text-primary uppercase">
          Step 2
        </p>
        <h1 className="text-3xl font-bold text-primary">
          Administrator Account Setup
        </h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Create the first school administrator. This account can sign in after
          submission to monitor approval status.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Field label="Admin First Name">
            <Input
              required
              value={draft.adminFirstName}
              onChange={(event) => update("adminFirstName", event.target.value)}
              placeholder="Julian"
            />
          </Field>
          <Field label="Admin Last Name">
            <Input
              required
              value={draft.adminLastName}
              onChange={(event) => update("adminLastName", event.target.value)}
              placeholder="Sterling"
            />
          </Field>
          <Field label="Admin Email">
            <Input
              required
              type="email"
              value={draft.adminEmail}
              onChange={(event) => update("adminEmail", event.target.value)}
              placeholder="admin@institution.edu.gh"
            />
          </Field>
          <Field label="Admin Phone">
            <Input
              required
              type="tel"
              value={draft.adminPhone}
              onChange={(event) => update("adminPhone", event.target.value)}
              placeholder="024 000 0000"
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              required
              show={showPassword}
              value={draft.password}
              onChange={(event) => update("password", event.target.value)}
              onToggle={() => setShowPassword((value) => !value)}
            />
          </Field>
          <Field label="Confirm Password">
            <PasswordInput
              required
              show={showConfirmPassword}
              value={draft.confirmPassword}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
              onToggle={() => setShowConfirmPassword((value) => !value)}
            />
          </Field>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/onboarding/step-1")}
          >
            Back
          </Button>
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>
      </section>

      <aside className="grid h-fit gap-4">
        {[
          [
            "verified_user",
            "Identity Verification",
            "RecordIT reviews every school before full access.",
          ],
          [
            "lock",
            "End-to-End Security",
            "Biometric and attendance workflows stay locked until approval.",
          ],
          [
            "shield",
            "Compliance Ready",
            "The first admin account is tied to the submitted school profile.",
          ],
        ].map(([icon, title, copy]) => (
          <div
            key={title}
            className="recordit-card bg-surface-container-lowest p-5"
          >
            <div className="mb-4 grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
              <MaterialSymbol icon={icon} />
            </div>
            <h2 className="font-bold text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {copy}
            </p>
          </div>
        ))}
      </aside>
    </form>
  )
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-on-surface-variant">
      <span className="tracking-[0.08em] uppercase">{label}</span>
      {children}
    </label>
  )
}

function PasswordInput({
  onToggle,
  show,
  ...props
}: React.ComponentProps<typeof Input> & {
  onToggle: () => void
  show: boolean
}) {
  return (
    <div className="relative">
      <Input
        {...props}
        className="pr-12"
        placeholder="Minimum 8 characters"
        type={show ? "text" : "password"}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <MaterialSymbol icon={show ? "visibility_off" : "visibility"} />
      </button>
    </div>
  )
}
