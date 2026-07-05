import type {
  ApiErrorCode,
  ApiFieldErrors,
  ApiResponse,
} from "@/types"

export type ApiClientErrorInput = {
  cause?: unknown
  code?: ApiErrorCode
  errors?: ApiFieldErrors
  message: string
  status?: number
}

type ResponseLike = {
  status?: number
  data?: unknown
}

type AxiosLikeError = Error & {
  isAxiosError?: boolean
  code?: string
  response?: ResponseLike
}

export class ApiClientError extends Error {
  code?: ApiErrorCode
  status?: number
  fieldErrors?: ApiFieldErrors

  constructor(message: string, options?: Omit<ApiClientErrorInput, "message">) {
    super(message, { cause: options?.cause })
    this.name = "ApiClientError"
    this.code = options?.code
    this.status = options?.status
    this.fieldErrors = options?.errors
  }

  get isUnauthorized() {
    return this.status === 401 || this.code === "UNAUTHORIZED"
  }

  get isForbidden() {
    return this.status === 403 || this.code === "FORBIDDEN"
  }

  get isValidationError() {
    return this.status === 422 || this.code === "VALIDATION_ERROR"
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      errors: this.fieldErrors,
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isApiResponse(value: unknown): value is ApiResponse {
  return isObject(value) && "success" in value
}

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
  return isObject(error) && ("isAxiosError" in error || "response" in error)
}

function normalizeFieldErrors(value: unknown): ApiFieldErrors | undefined {
  if (!isObject(value)) {
    return undefined
  }

  return Object.entries(value).reduce<ApiFieldErrors>((acc, [key, entry]) => {
    if (Array.isArray(entry)) {
      acc[key] = entry.map(String)
      return acc
    }

    if (typeof entry === "string") {
      acc[key] = [entry]
    }

    return acc
  }, {})
}

function getErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!isObject(payload)) {
    return fallbackMessage
  }

  const message = payload.message

  return typeof message === "string" && message.trim()
    ? message
    : fallbackMessage
}

function getErrorCode(payload: unknown): ApiErrorCode | undefined {
  if (!isObject(payload)) {
    return undefined
  }

  return typeof payload.code === "string" ? payload.code : undefined
}

function fromPayload(
  payload: unknown,
  fallbackMessage: string,
  options?: { cause?: unknown; status?: number }
) {
  if (isApiResponse(payload)) {
    return new ApiClientError(getErrorMessage(payload, fallbackMessage), {
      cause: options?.cause,
      code: getErrorCode(payload),
      errors: normalizeFieldErrors(payload.errors),
      status: options?.status,
    })
  }

  if (isObject(payload)) {
    return new ApiClientError(getErrorMessage(payload, fallbackMessage), {
      cause: options?.cause,
      code: getErrorCode(payload),
      errors: normalizeFieldErrors(payload.errors),
      status: options?.status,
    })
  }

  return new ApiClientError(fallbackMessage, {
    cause: options?.cause,
    status: options?.status,
  })
}

export function toApiClientError(
  error: unknown,
  fallbackMessage: string = "Request failed"
): ApiClientError {
  if (error instanceof ApiClientError) {
    return error
  }

  if (isAxiosLikeError(error)) {
    const payload = error.response?.data
    const status = error.response?.status

    if (payload) {
      return fromPayload(payload, fallbackMessage, { cause: error, status })
    }

    return new ApiClientError(error.message || fallbackMessage, {
      cause: error,
      code: error.code,
      status,
    })
  }

  if (typeof Response !== "undefined" && error instanceof Response) {
    return new ApiClientError(error.statusText || fallbackMessage, {
      cause: error,
      status: error.status,
    })
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message || fallbackMessage, {
      cause: error,
    })
  }

  return fromPayload(error, fallbackMessage, { cause: error })
}

export async function responseToApiClientError(
  response: Response,
  fallbackMessage: string = "Request failed"
): Promise<ApiClientError> {
  let payload: unknown

  try {
    payload = await response.clone().json()
  } catch {
    payload = undefined
  }

  if (payload) {
    return fromPayload(payload, fallbackMessage, {
      cause: response,
      status: response.status,
    })
  }

  return new ApiClientError(response.statusText || fallbackMessage, {
    cause: response,
    status: response.status,
  })
}

export function getApiErrorLabel(error: unknown): {
  code?: ApiErrorCode
  message: string
  status?: number
} {
  const parsed = toApiClientError(error, "Request failed")

  return {
    code: parsed.code,
    message: parsed.message,
    status: parsed.status,
  }
}
