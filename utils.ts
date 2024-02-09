import sharp from "sharp"
import path from "path"
import formidable from "formidable"
import createHttpError from "http-errors"
import { Request } from "express"

export const parse_form = async (req: Request) =>
  new Promise((resolve, reject) => {
    const form = formidable({})

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)

      const [image]: any = files.image

      // Weird formatting needed to accomodate for formidable v3
      const fieldsFormatted = Object.keys(fields).reduce(
        (acc, key) => ({ ...acc, [key]: fields[key][0] }),
        {}
      )

      if (!image) reject(createHttpError(400, `Image not present in request`))

      resolve({ image, fieldsFormatted })
    })
  })

export const get_thumbnail_filename = (original_filename: string) =>
  original_filename.replace(/(\.[\w\d_-]+)$/i, "_thumbnail$1")

export const createThumbnailBuffer = async (image_path: string) => {
  const options = { failOnError: true }

  return sharp(image_path, options).resize(256, 256).withMetadata()
}

export const create_image_thumbnail = async (image_path: string) => {
  const folder_path = path.dirname(image_path)
  const image_filename = path.basename(image_path)
  const thumbnail_filename = get_thumbnail_filename(image_filename)
  const thumbnail_path = path.resolve(folder_path, thumbnail_filename)

  const thumbnailBuffer = await createThumbnailBuffer(image_path)

  await thumbnailBuffer.toFile(thumbnail_path)
}
