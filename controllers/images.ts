import Image, { ImageRecord } from "../models/image"
import createHttpError from "http-errors"
import { parse_form } from "../utils"
import { imageVariants } from "./imageVariants"
import { Request, Response } from "express"
import {
  deleteLocalImage,
  saveImageLocally,
  sendLocalImage,
} from "../storage/local"
import {
  deleteFileFromS3,
  s3Client,
  storeImageToS3,
  streamFileFromS3,
} from "../storage/s3"
import { DEFAULT_SERVED_VARIANT } from "./imageVariants"
import {
  getImageRecordFromCache,
  removeImageRecordFromCache,
  setImageRecordInCache,
} from "../cache"

const enforce_restrictions = (image: ImageRecord, res: Response) => {
  if (!image.restricted) return
  const { user } = res.locals
  const { _id: user_id, isAdmin: user_is_admin } = user

  if (!user || (!user_is_admin && user_id.toString() !== image.uploader_id)) {
    throw createHttpError(403, `Access to image ${image._id} is restricted`)
  }
}

export const upload_image = async (req: Request, res: Response) => {
  const uploader_id = res.locals.user?._id || res.locals.user?.properties._id

  const {
    fields,
    image: { filepath: uploadTempPath, originalFilename: filename, size },
  }: any = await parse_form(req)

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
    skip = "0",
    limit = "50",
    order = "-1",
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
    .sort({ [sort]: order, filename: 1 })
    .limit(Math.max(Number(limit), 0))

  const total = await Image.countDocuments(query)

  const response = { total, items }

  res.send(response)
}

export const get_image_details = async (req: Request, res: Response) => {
  const image_id = req.params.id

  const image = await Image.findById(image_id)
  if (!image) throw createHttpError(404, `Image not found in DB`)

  res.send(image)
}

export const get_image = async (req: Request, res: Response) => {
  const image_id = req.params.id || (req.query.id as string)
  const variant =
    req.params.variant || req.query.variant || DEFAULT_SERVED_VARIANT

  let image = await getImageRecordFromCache(image_id)

  if (!image) {
    image = await Image.findById(image_id)
    if (!image) throw createHttpError(404, `Image not found in DB`)
    setImageRecordInCache(image)
  }

  enforce_restrictions(image, res)

  const foundVariant = imageVariants.find(({ name }) => name === variant)
  // If no found variant, serve the original image

  if (s3Client) await streamFileFromS3(res, image, foundVariant)
  else await sendLocalImage(res, image, foundVariant)

  save_views(req, image_id)
}

export const update_image_details = async (req: Request, res: Response) => {
  const { user } = res.locals
  const image_id = req.params.id
  if (!user) throw createHttpError(403, `Unauthorized to delete image`)

  const user_id = user._id || user.properties._id
  const user_is_admin = user.isAdmin || user.properties.isAdmin

  const new_properties = req.body

  const image = await Image.findById(image_id)
  if (!image) throw createHttpError(404, `Image ${image_id} not found`)

  if (!user_is_admin && user_id.toString() !== image.uploader_id) {
    throw createHttpError(403, `Unauthorized to update image`)
  }

  // TODO: No need for another query, just use Image.save()
  const updatedImage = await Image.findOneAndUpdate(
    { _id: image_id },
    { $set: { ...new_properties } },
    { new: true }
  )

  removeImageRecordFromCache(updatedImage._id)
  res.send(updatedImage)
}

export const delete_image = async (req: Request, res: Response) => {
  const { user } = res.locals
  if (!user) throw createHttpError(403, `Unauthorized to delete image`)

  const user_id = user._id || user.properties._id
  const user_is_admin = user.isAdmin || user.properties.isAdmin

  const image_id = req.params.id

  const image = await Image.findById(image_id)
  if (!image) throw createHttpError(404, `Image ${image_id} not found`)

  if (!user_is_admin && user_id.toString() !== image.uploader_id) {
    throw createHttpError(403, `Unauthorized to delete image`)
  }

  try {
    if (s3Client) deleteFileFromS3(image)
    else deleteLocalImage(image)
  } catch (error) {
    console.log(error)
  }

  await image.remove()
  removeImageRecordFromCache(image._id)

  res.send({ image_id })
}

const save_views = async (req: Request, imageId: string) => {
  try {
    const image: ImageRecord = await Image.findById(imageId)

    // Increase view count
    if (!image.views) image.views = 0
    image.views++

    // Save last view data
    image.last_viewed = new Date()

    // save referer
    const referer_url = req.get("Referrer")

    if (referer_url) {
      const found_referer = image.referers.find(
        ({ url }: { url: string }) => url === referer_url
      )

      if (found_referer) {
        found_referer.last_request = new Date()
        if (!found_referer.views) found_referer.views = 0
        found_referer.views++
      } else {
        image.referers.push({
          url: referer_url,
          last_request: new Date(),
          views: 1,
        })
      }
    }

    await image.save()
  } catch (error) {
    console.log(`Failed to update view count for image ${imageId}`)
    console.log(error)
  }
}
