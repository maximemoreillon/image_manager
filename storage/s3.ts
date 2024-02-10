import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import path from "path"
import { Response } from "express"
import { ImageType } from "../models/image"
import { readFileSync } from "fs"
import { imageVariants } from "../utils"

export const {
  S3_REGION,
  S3_ACCESS_KEY_ID = "",
  S3_SECRET_ACCESS_KEY = "",
  S3_ENDPOINT,
  S3_BUCKET,
} = process.env

export let s3Client: S3Client | undefined

if (S3_BUCKET) {
  console.log(`[Storage] S3_BUCKET is set, uploading to "${S3_BUCKET}"`)
  s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    endpoint: S3_ENDPOINT,
  })
} else {
  console.log(`[Storage] S3_BUCKET is NOT set, storing uploads locally`)
}

const generateVariants = async (record: ImageType) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const options = {
    Bucket: S3_BUCKET,
    Key: `${record._id.toString()}/${record.filename}`,
  }

  const response = await s3Client.send(new GetObjectCommand(options))
  const buf = await response.Body?.transformToByteArray()
  if (!buf) throw "Failed to get Buffer"

  for await (const variant of imageVariants) {
    const variantData = await variant.generate(buf)
    const Body = await variantData.toBuffer()

    await s3Client.send(
      new PutObjectCommand({
        Key: `${record._id.toString()}/${variant.filename}`,
        Bucket: S3_BUCKET,
        Body,
      })
    )
  }
}

export const storeImageToS3 = async (
  tempUploadPath: string,
  record: ImageType
) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const { _id, filename } = record

  const imageBuffer = readFileSync(tempUploadPath)

  await s3Client.send(
    new PutObjectCommand({
      Key: `${_id}/${filename}`,
      Bucket: S3_BUCKET,
      Body: imageBuffer,
    })
  )

  await generateVariants(record)
}

export const streamFileFromS3 = async (
  res: Response,
  record: ImageType,
  specifiedFilename?: string
) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"

  const filename = specifiedFilename || record.filename
  const Key = `${record._id.toString()}/${filename}`

  let response
  const options = {
    Bucket: S3_BUCKET,
    Key,
  }
  try {
    response = await s3Client.send(new GetObjectCommand(options))
  } catch (error) {
    console.log(
      `One or more variant missing for image ${record._id.toString()}, regenerating files...`
    )
    await generateVariants(record)
    response = await s3Client.send(new GetObjectCommand(options))
  }

  if (!response) throw `Fetching image failed`

  const { base, ext } = path.parse(Key)
  if (!response.Body) throw "No Body"
  response.Body.transformToWebStream().pipeTo(
    new WritableStream({
      start() {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${encodeURIComponent(base)}`
        )
        res.setHeader("Content-Type", `image/${ext.replace(".", "")}`)
      },
      write(chunk) {
        res.write(chunk)
      },
      close() {
        res.end()
      },
    })
  )
}

export const deleteFileFromS3 = async (image: ImageType) => {
  if (!S3_BUCKET || !s3Client) throw "S3 not configured"
  const Prefix = image._id.toString()

  const objectList = await s3Client.send(
    new ListObjectsCommand({ Bucket: S3_BUCKET, Prefix })
  )

  if (!objectList || !objectList.Contents) throw `${Prefix} has no content`

  for await (const { Key } of objectList.Contents) {
    const options = { Key, Bucket: S3_BUCKET }
    await s3Client.send(new DeleteObjectCommand(options))
  }
}
