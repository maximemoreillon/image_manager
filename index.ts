import dotenv from "dotenv"
dotenv.config()
import express from "express"
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
import { version, author } from "./package.json"
import { uploads_directory_path } from "./folder_config"
import { Request, Response, NextFunction } from "express"

const { APP_PORT = 80, IDENTIFICATION_URL } = process.env
const promOptions = { includeMethod: true, includePath: true }

db_connect()

export const app = express()
app.use(express.json())
app.use(cors())
app.use(promBundle(promOptions))
app.get("/", (req, res) => {
  res.send({
    application_name: "Image manager API",
    author,
    version,
    mongodb: {
      connection_string: dbConnectionString,
      connected: get_connected(),
    },
    storage: {
      uploads_directory_path,
    },
    auth: { identification_url: IDENTIFICATION_URL },
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
