"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  GHANA_CITIES_BY_REGION,
  GHANA_REGIONS,
  OTHER_LOCATION_VALUE,
} from "@/components/onboarding/ghana-location"

const storageKey = "recordit:onboarding:school-profile"

export type SchoolProfileDraft = {
  city: string
  contactEmail: string
  contactName: string
  contactPhone: string
  contactRole: string
  region: string
  schoolAddress: string
  schoolCode: string
  schoolEmail: string
  schoolName: string
  schoolPhone: string
}

const emptyDraft: SchoolProfileDraft = {
  city: "",
  contactEmail: "",
  contactName: "",
  contactPhone: "",
  contactRole: "",
  region: "",
  schoolAddress: "",
  schoolCode: "",
  schoolEmail: "",
  schoolName: "",
  schoolPhone: "",
}

function loadDraft(): SchoolProfileDraft {
  if (typeof window === "undefined") {
    return emptyDraft
  }

  try {
    return {
      ...emptyDraft,
      ...JSON.parse(window.sessionStorage.getItem(storageKey) || "{}"),
    }
  } catch {
    return emptyDraft
  }
}

export function getSchoolProfileDraft() {
  return loadDraft()
}

export function SchoolProfileStep() {
  const router = useRouter()
  const [draft, setDraft] = useState<SchoolProfileDraft>(loadDraft)
  const [regionMode, setRegionMode] = useState(
    draft.region && !GHANA_REGIONS.includes(draft.region as never)
      ? OTHER_LOCATION_VALUE
      : draft.region
  )
  const cityOptions =
    regionMode && regionMode !== OTHER_LOCATION_VALUE
      ? (GHANA_CITIES_BY_REGION[regionMode] ?? [])
      : []
  const [cityMode, setCityMode] = useState(
    draft.city && !cityOptions.includes(draft.city)
      ? OTHER_LOCATION_VALUE
      : draft.city
  )

  function update(field: keyof SchoolProfileDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function handleRegionChange(value: string) {
    setRegionMode(value)
    setCityMode("")
    update("city", "")
    update("region", value === OTHER_LOCATION_VALUE ? "" : value)
  }

  function handleCityChange(value: string) {
    setCityMode(value)
    update("city", value === OTHER_LOCATION_VALUE ? "" : value)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.sessionStorage.setItem(storageKey, JSON.stringify(draft))
    router.push("/onboarding/step-2")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      <section className="recordit-card p-6 md:p-8">
        <p className="mb-2 text-sm font-bold tracking-[0.12em] text-primary uppercase">
          Step 1
        </p>
        <h1 className="text-3xl font-bold text-primary">Institution Details</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Submit the school profile that RecordIT will review before full access
          is enabled.
        </p>

        <div className="mt-8 grid gap-8">
          <fieldset className="grid gap-4">
            <legend className="mb-2 text-xl font-bold">
              General Information
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="School Name">
                <Input
                  required
                  value={draft.schoolName}
                  onChange={(event) => update("schoolName", event.target.value)}
                  placeholder="e.g. St. Lawrence Academy"
                />
              </Field>
              <Field label="School Code">
                <Input
                  required
                  value={draft.schoolCode}
                  onChange={(event) => update("schoolCode", event.target.value)}
                  placeholder="e.g. SLA-2026"
                />
              </Field>
              <Field label="School Email">
                <Input
                  required
                  type="email"
                  value={draft.schoolEmail}
                  onChange={(event) =>
                    update("schoolEmail", event.target.value)
                  }
                  placeholder="administration@school.edu.gh"
                />
              </Field>
              <Field label="School Phone">
                <Input
                  required
                  type="tel"
                  value={draft.schoolPhone}
                  onChange={(event) =>
                    update("schoolPhone", event.target.value)
                  }
                  placeholder="024 000 0000"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-2 text-xl font-bold">Location Details</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Street Address">
                <Input
                  required
                  value={draft.schoolAddress}
                  onChange={(event) =>
                    update("schoolAddress", event.target.value)
                  }
                  placeholder="123 Academic Road"
                />
              </Field>
              <Field label="Country">
                <Input readOnly value="Ghana" />
              </Field>
              <Field label="Region">
                <Select
                  required
                  value={regionMode}
                  onChange={(event) => handleRegionChange(event.target.value)}
                >
                  <option value="">Select region</option>
                  {GHANA_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                  <option value={OTHER_LOCATION_VALUE}>Other</option>
                </Select>
              </Field>
              {regionMode === OTHER_LOCATION_VALUE ? (
                <Field label="Other Region">
                  <Input
                    required
                    value={draft.region}
                    onChange={(event) => update("region", event.target.value)}
                    placeholder="Type region name"
                  />
                </Field>
              ) : null}
              <Field label="City">
                <Select
                  required
                  value={cityMode}
                  onChange={(event) => handleCityChange(event.target.value)}
                  disabled={!regionMode}
                >
                  <option value="">Select city</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                  <option value={OTHER_LOCATION_VALUE}>Other</option>
                </Select>
              </Field>
              {cityMode === OTHER_LOCATION_VALUE ? (
                <Field label="Other City">
                  <Input
                    required
                    value={draft.city}
                    onChange={(event) => update("city", event.target.value)}
                    placeholder="Type city name"
                  />
                </Field>
              ) : null}
            </div>
          </fieldset>
        </div>
      </section>

      <aside className="recordit-card h-fit bg-surface-container-lowest p-6">
        <h2 className="text-xl font-bold text-primary">
          Contact Representative
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Final submission notifications will be sent to this email and phone
          number.
        </p>
        <div className="mt-6 grid gap-4">
          <Field label="Full Name">
            <Input
              required
              value={draft.contactName}
              onChange={(event) => update("contactName", event.target.value)}
              placeholder="Dr. Sarah Mensah"
            />
          </Field>
          <Field label="Role / Position">
            <Input
              required
              value={draft.contactRole}
              onChange={(event) => update("contactRole", event.target.value)}
              placeholder="Principal / Registrar"
            />
          </Field>
          <Field label="Direct Phone">
            <Input
              required
              type="tel"
              value={draft.contactPhone}
              onChange={(event) => update("contactPhone", event.target.value)}
              placeholder="024 000 0000"
            />
          </Field>
          <Field label="Official Email">
            <Input
              required
              type="email"
              value={draft.contactEmail}
              onChange={(event) => update("contactEmail", event.target.value)}
              placeholder="principal@school.edu.gh"
            />
          </Field>
          <Button type="submit" size="lg" className="mt-2 w-full">
            Continue to Admin Setup
          </Button>
        </div>
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

function Select(props: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className="h-12 w-full rounded-lg border border-transparent bg-input px-4 text-base text-foreground transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 md:text-sm"
    />
  )
}
