"use client"
import React, { useCallback, useState } from "react"
import { useDropzone, Accept } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { cn } from "@/lib/utils"
import {
  useUploadFile,
  type UploadPurpose,
} from "@/services/uploads/uploads"
import type { ExtendedUploadFile } from "@/types"

type ExtendedFile = ExtendedUploadFile

interface FileValidator {
  parse: (value: { file: ExtendedFile }) => unknown
}

interface FileUploadProps {
  layout?: "vertical" | "horizontal"
  uploadMode?: "single" | "multi"
  defaultText?: string
  otherText?: string
  maxSize?: number
  acceptedFileTypes?: Accept
  cloudinaryPurpose?: UploadPurpose
  uploadToCloudinary?: boolean
  onFilesUploaded: (files: ExtendedFile | ExtendedFile[] | null) => void
  zodSchema?: FileValidator
  errors?: string | string[]
}

const FileUpload: React.FC<FileUploadProps> = ({
  layout = "vertical",
  uploadMode = "single",
  defaultText = "Select or drag and drop your files here",
  otherText = "(PDF, DOC, DOCX up to 20MB)",
  maxSize = 20 * 1024 * 1024,
  acceptedFileTypes = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  },
  cloudinaryPurpose = "organizationLogo",
  onFilesUploaded,
  uploadToCloudinary = false,
  zodSchema,
  errors: externalErrors,
}) => {
  const { mutateAsync: uploadFileToCloudinary } = useUploadFile()
  const [files, setFiles] = useState<ExtendedFile[]>([])
  const [internalErrors, setInternalErrors] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  /**
   * Validate file with optional Zod schema
   */
  const validateFile = useCallback(
    (file: ExtendedFile): string | null => {
      if (!file) {
        return "No file selected"
      }

      if (zodSchema) {
        try {
          zodSchema.parse({ file })
          return null
        } catch (error) {
          console.log("Validation error:", error)
          if (
            typeof error === "object" &&
            error !== null &&
            "errors" in error &&
            Array.isArray(error.errors)
          ) {
            return error.errors[0]?.message || "Invalid file"
          }

          return "Invalid file"
        }
      }

      return null
    },
    [zodSchema]
  )

  /**
   * Handle dropped files
   */
  const uploadFile = useCallback(
    async (file: ExtendedFile): Promise<ExtendedFile> => {
      const upload = await uploadFileToCloudinary({
        file,
        purpose: cloudinaryPurpose,
      })

      return Object.assign(file, {
        preview: upload.previewUrl,
        upload,
      })
    },
    [cloudinaryPurpose, uploadFileToCloudinary]
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        setInternalErrors("No valid files were dropped")
        return
      }

      const newFiles: ExtendedFile[] = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      let validationError: string | null = null

      try {
        setUploading(true)

        if (uploadMode === "single") {
          validationError = validateFile(newFiles[0])

          if (!validationError) {
            const uploadedFile = uploadToCloudinary
              ? await uploadFile(newFiles[0])
              : newFiles[0]

            setFiles([uploadedFile])
            onFilesUploaded(uploadedFile)
            setInternalErrors(null)
          } else {
            setInternalErrors(validationError)
          }
        } else {
          const errors = newFiles.map(validateFile).filter(Boolean)

          if (errors.length === 0) {
            const uploadedFiles = uploadToCloudinary
              ? await Promise.all(newFiles.map(uploadFile))
              : newFiles

            setFiles((prev) => [...prev, ...uploadedFiles])
            onFilesUploaded(uploadedFiles)
            setInternalErrors(null)
          } else {
            setInternalErrors(errors[0] as string)
          }
        }
      } catch (error) {
        setInternalErrors(
          error instanceof Error ? error.message : "File upload failed"
        )
      } finally {
        setUploading(false)
      }
    },
    [uploadMode, onFilesUploaded, uploadToCloudinary, uploadFile, validateFile]
  )

  /**
   * Configure Dropzone
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize,
    multiple: uploadMode === "multi",
  })

  /**
   * Remove file
   */
  const removeFile = (file: ExtendedFile) => {
    const newFiles = files.filter((f) => f !== file)

    setFiles(newFiles)
    onFilesUploaded(uploadMode === "single" ? null : newFiles)
    setInternalErrors(null)
  }

  /**
   * Dynamic styling
   */
  const dropzoneClasses = cn(
    "cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors",
    isDragActive
      ? "border-biometric bg-biometric/10"
      : internalErrors || externalErrors
        ? "border-destructive"
        : "border-outline-variant bg-card hover:border-primary",
    layout === "horizontal"
      ? "flex items-center justify-center space-x-4"
      : "flex flex-col items-center justify-center space-y-2"
  )

  /**
   * Render Dropzone
   */
  const renderDropzone = () => (
    <>
      <div {...getRootProps({ className: dropzoneClasses })}>
        <input {...getInputProps()} />

        {uploading ? (
          <MaterialSymbol
            icon="progress_activity"
            className="text-primary size-8 animate-spin text-[32px]"
          />
        ) : (
          <MaterialSymbol
            icon="cloud_upload"
            className="text-muted-foreground size-8 text-[32px]"
          />
        )}

        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : defaultText}
        </p>

        <p className="text-xs text-muted-foreground">{otherText}</p>
      </div>

      {(internalErrors || externalErrors) && (
        <p className="mt-2 text-xs font-medium text-destructive">
          {internalErrors ||
            (Array.isArray(externalErrors)
              ? externalErrors.join(", ")
              : externalErrors)}
        </p>
      )}
    </>
  )

  /**
   * Render selected files
   */
  const renderFileList = () => (
    <div className="mt-4 space-y-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card"
        >
          <div className="flex items-center space-x-2">
            {file.preview && file.type.startsWith("image/") ? (
              <img
                src={file.preview}
                alt={file.name}
                className="size-12 rounded object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-lg p-5">
                <span className="text-xs font-medium">
                  {file.name.split(".").pop()?.toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <p className="max-w-xs truncate text-sm font-medium">
                {file.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
                {file.upload ? " - Uploaded" : ""}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => removeFile(file)}>
            <MaterialSymbol icon="delete" className="text-[18px]" />
          </Button>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {(uploadMode === "multi" || files.length === 0) && renderDropzone()}
      {renderFileList()}
    </div>
  )
}

export default FileUpload
