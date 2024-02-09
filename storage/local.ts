import path from "path"
import { uploads_directory_path } from "../folder_config"
import { Response } from "express"
import { rimrafSync } from "rimraf"
import { ImageType } from "../models/image"
import { get_thumbnail_filename, createThumbnailData } from "../utils"
import mv from "mv"

const create_image_thumbnail = async (image_path: string) => {
  const folder_path = path.dirname(image_path)
  const image_filename = path.basename(image_path)
  const thumbnail_filename = get_thumbnail_filename(image_filename)
  const thumbnail_path = path.resolve(folder_path, thumbnail_filename)

  const thumbnailData = await createThumbnailData(image_path)

  await thumbnailData.toFile(thumbnail_path)
}

const move_file = (original_path: string, destination_path: string) =>
  new Promise((resolve, reject) => {
    mv(original_path, destination_path, { mkdirp: true }, (err) => {
      if (err) reject(err)
      resolve(null)
    })
  })

export const saveImageLocally = async (original_path: string, record: any) => {
  const { _id, filename } = record

  const destination_path = path.join(
    uploads_directory_path,
    _id.toString(),
    filename
  )

  await move_file(original_path, destination_path)
  await create_image_thumbnail(destination_path)
}

export const sendLocalImage = async (
  res: Response,
  image: any,
  filename?: string
) => {
  const thumbnail_path = path.join(
    uploads_directory_path,
    image._id.toString(),
    filename || image.filename
  )

  res.sendFile(thumbnail_path)
}

export const deleteLocalImage = async (record: ImageType) => {
  const image_folder_path = path.join(
    uploads_directory_path,
    record._id.toString()
  )

  rimrafSync(image_folder_path)
}
