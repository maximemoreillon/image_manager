import formidable from "formidable"
import createHttpError from "http-errors"
import { Request, Response } from "express"
import { ImageRecord } from "./models/image"
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

export const enforce_restrictions = (image: ImageRecord, res: Response) => {
  if (!image.restricted) return
  const { user } = res.locals
  const { _id: user_id, isAdmin: user_is_admin } = user

  if (!user || (!user_is_admin && user_id.toString() !== image.uploader_id)) {
    throw createHttpError(403, `Access to image ${image._id} is restricted`)
  }
}
