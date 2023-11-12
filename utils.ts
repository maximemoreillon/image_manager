import mv from "mv"
import sharp from "sharp"
import path from "path"
import formidable from "formidable"
import createHttpError from "http-errors"
import { Request } from "express"
import { rimraf } from "rimraf"

export const parse_form = (req: Request) =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm()

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      const image: any = files["image"]

      if (!image) reject(createHttpError(400, `Image not present in request`))
      if (!image.type.includes("image"))
        reject(createHttpError(400, `File does not seem to be an image`))

      resolve({ image, fields })
    })
  })

export const move_file = (original_path: string, destination_path: string) =>
  new Promise((resolve, reject) => {
    mv(original_path, destination_path, { mkdirp: true }, (err) => {
      if (err) reject(err)
      resolve(null)
    })
  })

export const get_thumbnail_filename = (original_filename: string) =>
  original_filename.replace(/(\.[\w\d_-]+)$/i, "_thumbnail$1")

export const create_image_thumbnail = async (image_path: string) => {
  const folder_path = path.dirname(image_path)
  const image_filename = path.basename(image_path)
  const thumbnail_filename = get_thumbnail_filename(image_filename)
  const thumbnail_path = path.resolve(folder_path, thumbnail_filename)

  const options = { failOnError: true }

  await sharp(image_path, options)
    .resize(256, 256)
    .withMetadata()
    .toFile(thumbnail_path)
}

export const delete_folder = (folder_path: string) => rimraf(folder_path)
