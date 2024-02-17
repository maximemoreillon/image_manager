import { version, author } from "./package.json"
console.log(`Image manager v${version}`)

import express, { Request, Response, NextFunction } from "express"
import "express-async-errors"
import cors from "cors"
import promBundle from "express-prom-bundle"
import {
  get_connected,
  redactedConnectionString as dbConnectionString,
  connect as db_connect,
} from "./db"
import { get_image } from "./controllers/images"
import images_router from "./routes/images"
import variants_router from "./routes/imageVariants"
import swaggerUi from "swagger-ui-express"
import swaggerDocument from "./swagger-output.json"
import { s3Client, S3_BUCKET, S3_ENDPOINT, S3_USE_SSL } from "./storage/s3"
import { UPLOADS_DIRECTORY } from "./storage/local"
import { ImageVariantNames } from "./controllers/imageVariants"

const {
  APP_PORT = 80,
  IDENTIFICATION_URL,
  DEFAULT_SERVED_VARIANT,
} = process.env
const promOptions = { includeMethod: true, includePath: true }

db_connect()

export const app = express()
app.use(express.json())
app.use(cors())
app.use(promBundle(promOptions))
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get("/", (req, res) => {
  res.send({
    application_name: "Image manager API",
    author,
    version,
    mongodb: {
      connection_string: dbConnectionString,
      connected: get_connected(),
    },
    storage: s3Client
      ? {
          bucket: S3_BUCKET,
          endpoint: S3_ENDPOINT,
          useSSL: S3_USE_SSL,
        }
      : {
          directory: UPLOADS_DIRECTORY,
        },
    auth: { identification_url: IDENTIFICATION_URL },
    default_served_variant: DEFAULT_SERVED_VARIANT,
    imageVariants: ImageVariantNames,
  })
})

app.use("/images", images_router)
app.use("/variants", variants_router)

// Legacy
app.get("/image", get_image)

// Express error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  let { statusCode = 500, message = error } = error
  if (isNaN(statusCode) || statusCode > 600) statusCode = 500
  res.status(statusCode).send(message)
})

// Start server
app.listen(APP_PORT, () => {
  console.log(`[Express] listening on port ${APP_PORT}`)
})
