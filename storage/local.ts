import path from "path"
import { uploads_directory_path } from "../folder_config"
import { Response } from "express"
import { rimrafSync } from "rimraf"
import { ImageType } from "../models/image"
import { imageVariants } from "../utils"
import { existsSync } from "fs"
import mv from "mv"

// const create_image_thumbnail = async (image_path: string) => {
//   const folder_path = path.dirname(image_path)
//   const image_filename = path.basename(image_path)
//   const thumbnail_filename = get_thumbnail_filename(image_filename)
//   const thumbnail_path = path.resolve(folder_path, thumbnail_filename)

//   const thumbnailData = await createThumbnailData(image_path)

//   await thumbnailData.toFile(thumbnail_path)
// }

const move_file = (original_path: string, destination_path: string) =>
  new Promise((resolve, reject) => {
    mv(original_path, destination_path, { mkdirp: true }, (err) => {
      if (err) reject(err)
      resolve(null)
    })
  })

const generateVariants = async (record: ImageType) => {
  const { _id, filename } = record
  const destinationFolder = path.join(uploads_directory_path, _id.toString())
  const destinationFilePath = path.join(destinationFolder, filename)
  for await (const variant of imageVariants.filter((v) => !!v.generate)) {
    const variantData = await variant.generate(destinationFilePath)
    const variantPath = path.resolve(destinationFolder, variant.filename)
    await variantData.toFile(variantPath)
  }
}

export const saveImageLocally = async (
  tempUploadPath: string,
  record: ImageType
) => {
  const { _id, filename } = record

  const destinationFolder = path.join(uploads_directory_path, _id.toString())

  const destinationFilePath = path.join(destinationFolder, filename)
  await move_file(tempUploadPath, destinationFilePath)
  await generateVariants(record)
}

// TODO: consider using variant instead of filename
export const sendLocalImage = async (
  res: Response,
  image: any,
  filename?: string
) => {
  const filePath = path.join(
    uploads_directory_path,
    image._id.toString(),
    filename || image.filename
  )

  if (!existsSync(filePath)) {
    console.log(
      `One or more variant missing for image ${image._id.toString()}, regenerating files...`
    )
    await generateVariants(image)
  }

  res.sendFile(filePath)
}

export const deleteLocalImage = async (record: ImageType) => {
  const image_folder_path = path.join(
    uploads_directory_path,
    record._id.toString()
  )
  rimrafSync(image_folder_path)
}
