import { Client } from "minio"

import path from "path"
import { Response } from "express"
import { ImageRecord } from "../models/image"
import { imageVariants, type ImageVariant } from "../controllers/imageVariants"

export const {
  S3_REGION,
  S3_ACCESS_KEY_ID = "",
  S3_SECRET_ACCESS_KEY = "",
  S3_ENDPOINT,
  S3_BUCKET,
  S3_PORT = "443",
  S3_USE_SSL,
} = process.env

export let s3Client: Client

if (S3_BUCKET) {
  console.log(
    `[Storage] S3_BUCKET is set, uploading to bucket "${S3_BUCKET}" of endpoint ${S3_ENDPOINT}`
  )
  s3Client = new Client({
    accessKey: S3_ACCESS_KEY_ID,
    secretKey: S3_SECRET_ACCESS_KEY,
    endPoint: S3_ENDPOINT || "localhost",
    port: Number(S3_PORT),
    useSSL: !!S3_USE_SSL,
  })
} else {
  console.log(`[Storage] S3_BUCKET is NOT set, storing uploads locally`)
}

// TODO: find type
export const stream2Buffer = (dataStream: any) =>
  new Promise((resolve, reject) => {
    const chunks: any = []
    dataStream.on("data", (chunk: any) => chunks.push(chunk))
    dataStream.on("end", () => resolve(Buffer.concat(chunks)))
    dataStream.on("error", reject)
  })

const getImageBuffer = async (record: ImageRecord) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const stream = await s3Client.getObject(
    S3_BUCKET,
    `${record._id.toString()}/${record.filename}`
  )

  return stream2Buffer(stream)
}

const generateVariant = async (
  record: ImageRecord,
  variant: ImageVariant,
  buffer?: any
) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"
  if (!buffer) buffer = await getImageBuffer(record)

  const variantData = await variant.generate(buffer)
  const Body = await variantData.toBuffer()

  await s3Client.putObject(
    S3_BUCKET,
    `${record._id.toString()}/${variant.filename}`,
    Body
  )
}

const generateVariants = async (record: ImageRecord) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"
  const buffer = await getImageBuffer(record)
  for await (const variant of imageVariants) {
    await generateVariant(record, variant, buffer)
  }
}

export const storeImageToS3 = async (
  tempUploadPath: string,
  record: ImageRecord
) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const { _id, filename } = record

  await s3Client.fPutObject(S3_BUCKET, `${_id}/${filename}`, tempUploadPath)

  // await generateVariants(record)
}

export const streamFileFromS3 = async (
  res: Response,
  record: ImageRecord,
  variant?: ImageVariant
) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const filename = variant?.filename || record.filename
  const Key = `${record._id.toString()}/${filename}`

  let stream

  try {
    stream = await s3Client.getObject(S3_BUCKET, Key)
  } catch (error) {
    if (variant) {
      console.log(
        `Variant ${
          variant.name
        } missing for image ${record._id.toString()}, generating`
      )
      await generateVariant(record, variant)
      stream = await s3Client.getObject(S3_BUCKET, Key)
    }
  }

  const { base, ext } = path.parse(Key)
  if (!stream) throw "No stream available"

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${encodeURIComponent(base)}`
  )
  res.setHeader("Content-Type", `image/${ext.replace(".", "")}`)

  stream.on("data", (chunk) => {
    res.write(chunk)
  })
  stream.on("end", () => {
    res.end()
  })
  stream.on("error", (err) => {
    res.end()
  })
}

export const deleteFileFromS3 = async (image: ImageRecord) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"
  const Prefix = image._id.toString()

  const objectsStream = await s3Client.listObjects(S3_BUCKET, Prefix, true)
  const objectsList: any[] = []

  objectsStream.on("data", (obj) => {
    objectsList.push(obj.name)
  })

  objectsStream.on("error", (e) => {
    console.log(e)
  })

  objectsStream.on("end", async () => {
    await s3Client.removeObjects(S3_BUCKET, objectsList)
  })
}
