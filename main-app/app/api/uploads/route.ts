import { uploadImageBuffer } from "@/lib/cloudinary/cloudinary-service"

const uploadFolders: Record<string, string> = {
  organizationLogo: "amanah-welfare/organizations/logos",
  organizationBanner: "amanah-welfare/organizations/banners",
  userProfile: "amanah-welfare/users/profiles",
  welfareProgramCover: "amanah-welfare/programs/covers",
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const purpose = String(formData.get("purpose") || "organizationLogo")

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, message: "A file is required." },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("image/")) {
      return Response.json(
        { success: false, message: "Only image uploads are supported." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const upload = await uploadImageBuffer({
      buffer,
      filename: file.name,
      folder: uploadFolders[purpose] || "amanah-welfare/uploads",
    })

    return Response.json({
      success: true,
      data: {
        ...upload,
        originalName: file.name,
        previewUrl: upload.secure_url,
      },
      message: "File uploaded successfully.",
    })
  } catch (error) {
    console.error("Cloudinary upload failed:", error)

    return Response.json(
      { success: false, message: "File upload failed." },
      { status: 500 }
    )
  }
}
