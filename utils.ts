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

      resolve({ image, fields: fieldsFormatted })
    })
  })

export const get_thumbnail_filename = (original_filename: string) => {
  const { name } = path.parse(original_filename)
  return `${name}_thumbnail.jpg`
}

const sharpOptions = { failOnError: true }
export const imageVariants = [
  {
    name: "thumbnail",
    filename: "thumbnail.jpg",
    generate: async (input: string | Buffer | Uint8Array) =>
      sharp(input, sharpOptions).resize(256, 256).withMetadata(),
  },
  {
    name: "webp",
    filename: "image.webp",
    generate: async (input: string | Buffer | Uint8Array) =>
      sharp(input, sharpOptions).withMetadata(),
  },
]
