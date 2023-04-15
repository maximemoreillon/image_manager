import express from "express"
import "express-async-errors"
import cors from "cors"
import dotenv from "dotenv"
import apiMetrics from "prometheus-api-metrics"
import {
  MONGODB_DB,
  MONGODB_URL,
  get_connected,
  connect as db_connect,
} from "./db"
import { get_image } from "./controllers/images"
import images_router from "./routes/images"
import { version, author } from "./package.json"
import { uploads_directory_path } from "./folder_config"
import { Request, Response, NextFunction } from "express"

dotenv.config()

const { APP_PORT = 80, IDENTIFICATION_URL = "UNDEFINED" } = process.env

db_connect()

export const app = express()
app.use(express.json())
app.use(cors())
app.use(apiMetrics())

app.get("/", (req, res) => {
  res.send({
    application_name: "Image manager API",
    author,
    version,
    mongodb: {
      url: MONGODB_DB,
      db: MONGODB_URL,
      connected: get_connected(),
    },
    uploads_directory_path,
    auth_url: IDENTIFICATION_URL,
  })
})

app.use("/images", images_router)

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
  console.log(`Image manager API v${version} listening on port ${APP_PORT}`)
})
