import Image, { ImageType } from "../models/image"
import createHttpError from "http-errors"
import { get_thumbnail_filename, parse_form } from "../utils"
import { Request, Response } from "express"
import {
  deleteLocalImage,
  saveImageLocally,
  sendLocalImage,
} from "../storage/local"
import { s3Client, storeImageToS3, streamFileFromS3 } from "../storage/s3"

const enforce_restrictions = (image: ImageType, res: Response) => {
  if (!image.restricted) return
  const { user } = res.locals
  const { _id: user_id, isAdmin: user_is_admin } = user

  if (!user || (!user_is_admin && user_id.toString() !== image.uploader_id)) {
    throw createHttpError(403, `Access to image ${image._id} is restricted`)
  }
}

const get_image_id = (req: Request) =>
  req.params.id || req.params.image_id || req.query.id

export const upload_image = async (req: Request, res: Response) => {
  const uploader_id = res.locals.user?._id || res.locals.user?.properties._id

  const {
    fields,
    image: { filepath: uploadTempPath, originalFilename: filename, size },
  }: any = await parse_form(req)

  console.log({ fields })

  const imageProperties = {
    filename,
    size,
    upload_date: new Date(),
    uploader_id,
    ...fields,
  }

  const record = await Image.create(imageProperties)

  if (s3Client) await storeImageToS3(uploadTempPath, record)
  else await saveImageLocally(uploadTempPath, record)

  res.send(record)
}

export const get_image_list = async (req: Request, res: Response) => {
  const {
    skip = 0,
    limit = 50,
    order = -1,
    sort = "upload_date",
    search,
  }: any = req.query

  const query: any = {}

  if (search && search !== "") {
    const regex = { $regex: search, $options: "i" }
    const searchableProperties = ["filename", "description"]
    query.$or = searchableProperties.map((p) => ({ [p]: regex }))
  }

  const items = await Image.find(query)
    .skip(Number(skip))
    .sort({ [sort]: order })
    .limit(Math.max(Number(limit), 0))

  const total = await Image.countDocuments(query)

  const response = { total, items }

  res.send(response)
}

export const get_image_details = async (req: Request, res: Response) => {
  const image_id = get_image_id(req)
  if (!image_id) throw createHttpError(400, `ID not present in request`)

  const image = await Image.findById(image_id)
  if (!image) throw createHttpError(404, `Image not found in DB`)

  res.send(image)
}

export const get_image = async (req: Request, res: Response) => {
  const image_id = get_image_id(req)

  if (!image_id) throw createHttpError(400, `Image ID not present in request`)

  const image = await Image.findById(image_id)

  if (!image) throw createHttpError(404, `Image not found in DB`)
  enforce_restrictions(image, res)

  if (s3Client) await streamFileFromS3(res, image)
  else await sendLocalImage(res, image)

  save_views(req, image)
}

export const get_thumbnail = async (req: Request, res: Response) => {
  const image_id = get_image_id(req)

  if (!image_id) throw createHttpError(400, `Image ID not present in request`)

  const image = await Image.findById(image_id)

  if (!image) throw createHttpError(404, `Image not found in DB`)
  enforce_restrictions(image, res)

  const thumbnail_filename = get_thumbnail_filename(image.filename)

  if (s3Client) await streamFileFromS3(res, image, thumbnail_filename)
  else await sendLocalImage(res, image, thumbnail_filename)
}

export const update_image = async (req: Request, res: Response) => {
  const { user } = res.locals
  const image_id = req.params.id
  if (!user) throw createHttpError(403, `Unauthorized to delete image`)

  const user_id = user._id || user.properties._id
  const user_is_admin = user.isAdmin || user.properties.isAdmin

  if (!image_id) throw createHttpError(400, `ID not present in request`)

  const new_properties = req.body

  const image = await Image.findById(image_id)

  if (!user_is_admin && user_id.toString() !== image.uploader_id) {
    throw createHttpError(403, `Unauthorized to update image`)
  }

  const updatedImage = await Image.findOneAndUpdate(
    { _id: image_id },
    { $set: { ...new_properties } },
    { new: true }
  )

  res.send(updatedImage)
}

export const delete_image = async (req: Request, res: Response) => {
  const { user } = res.locals
  if (!user) throw createHttpError(403, `Unauthorized to delete image`)

  const user_id = user._id || user.properties._id
  const user_is_admin = user.isAdmin || user.properties.isAdmin

  const image_id = get_image_id(req)
  if (!image_id) throw createHttpError(400, `ID not present in request`)

  const image = await Image.findById(image_id)

  if (!user_is_admin && user_id.toString() !== image.uploader_id) {
    throw createHttpError(403, `Unauthorized to delete image`)
  }

  deleteLocalImage(image)

  await image.remove()

  res.send({ image_id })
}

const save_views = async (req: Request, image: ImageType) => {
  // Increase view count
  if (image.views) image.views += 1
  else image.views = 1

  // Save last view data
  image.last_viewed = new Date()

  // save referer
  const referer_url = req.get("Referrer")

  if (referer_url) {
    let found_referer = image.referers.find(
      ({ url }: { url: string }) => url === referer_url
    )

    if (found_referer) found_referer.last_request = new Date()
    else {
      image.referers.push({
        url: referer_url,
        last_request: new Date(),
      })
    }
  }

  await image.save()
}
