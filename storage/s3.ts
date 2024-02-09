import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"

export const {
  S3_REGION,
  S3_ACCESS_KEY_ID = "",
  S3_SECRET_ACCESS_KEY = "",
  S3_ENDPOINT,
  S3_BUCKET,
} = process.env

export let s3Client: S3Client | undefined

if (S3_BUCKET) {
  console.log(`[S3] S3_BUCKET is set, uploading to "${S3_BUCKET}"`)
  s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    endpoint: S3_ENDPOINT,
  })
} else {
  console.log(`[S3] S3_BUCKET is NOT set, storing uploads locally`)
}
