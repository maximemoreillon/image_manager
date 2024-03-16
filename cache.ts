import { RedisClientType, createClient } from "redis"
import { ImageRecord } from "./models/image"

export const { REDIS_URL } = process.env

let client: RedisClientType

export const init = async () => {
  if (!REDIS_URL) return

  console.log(`[Cache] Using Redis at ${REDIS_URL}`)

  client = createClient({ url: REDIS_URL })

  client.on("error", (err) => console.log("Redis Client Error", err))

  await client.connect()
}

export const getImageRecordFromCache = async (imageId: string) => {
  if (!client) return
  const userFromCache = await client.get(`imageRecord:${imageId}`)
  if (!userFromCache) return
  return { ...JSON.parse(userFromCache), cached: true }
}

export const setImageRecordInCache = async (imageRecord: ImageRecord) => {
  if (!client) return
  await client.set(
    `imageRecord:${imageRecord._id}`,
    JSON.stringify(imageRecord),
    {
      EX: 60 * 60 * 12,
    }
  )
}

export const removeImageRecordFromCache = async (imageId: string) => {
  if (!client) return
  await client.del(`imageRecord:${imageId}`)
}
