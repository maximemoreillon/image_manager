import path from "path"
import { Response } from "express"
import { rimrafSync } from "rimraf"
import { ImageRecord } from "../models/image"
import { imageVariants, type ImageVariant } from "../controllers/imageVariants"
import { existsSync } from "fs"
import mv from "mv"

export const { UPLOADS_DIRECTORY = "/usr/share/pv" } = process.env

const move_file = (original_path: string, destination_path: string) =>
  new Promise((resolve, reject) => {
    mv(original_path, destination_path, { mkdirp: true }, (err) => {
      if (err) reject(err)
      resolve(null)
    })
  })

const generateVariant = async (record: ImageRecord, variant: ImageVariant) => {
  const { _id, filename } = record
  const destinationFolder = path.join(UPLOADS_DIRECTORY, _id.toString())
  const destinationFilePath = path.join(destinationFolder, filename)
  const variantData = await variant.generate(destinationFilePath)
  const variantPath = path.resolve(destinationFolder, variant.filename)
  await variantData.toFile(variantPath)
}

const generateVariants = async (record: ImageRecord) => {
  for await (const variant of imageVariants.filter((v) => !!v.generate)) {
    generateVariant(record, variant)
  }
}

export const saveImageLocally = async (
  tempUploadPath: string,
  record: ImageRecord
) => {
  const { _id, filename } = record

  const destinationFolder = path.join(UPLOADS_DIRECTORY, _id.toString())

  const destinationFilePath = path.join(destinationFolder, filename)
  await move_file(tempUploadPath, destinationFilePath)
  // await generateVariants(record)
}

export const sendLocalImage = async (
  res: Response,
  record: ImageRecord,
  variant?: ImageVariant
) => {
  const filename = variant?.filename || record.filename

  const filePath = path.join(UPLOADS_DIRECTORY, record._id.toString(), filename)

  if (variant && !existsSync(filePath)) {
    console.log(
      `Variant ${
        variant.name
      } missing for image ${record._id.toString()}, generating`
    )
    await generateVariant(record, variant)
  }

  res.sendFile(filePath)
}

export const deleteLocalImage = async (record: ImageRecord) => {
  const image_folder_path = path.join(UPLOADS_DIRECTORY, record._id.toString())
  rimrafSync(image_folder_path)
}
