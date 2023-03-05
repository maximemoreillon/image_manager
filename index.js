// NPM modules
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const apiMetrics = require("prometheus-api-metrics")
const db = require("./db.js")
const image_controller = require("./controllers/image.js")
const images_router = require("./routes/images.js")
const { version, author } = require("./package.json")
const { uploads_directory_path } = require("./folder_config.js")
const { migrate } = require("./migrations/folder_separated_images.js")
require("express-async-errors")

dotenv.config()

const { APP_PORT = 80, IDENTIFICATION_URL = "UNDEFINED" } = process.env

db.connect().then(() => {
  migrate()
})

// Express configuration
const app = express()
app.use(express.json())
app.use(cors())
app.use(apiMetrics())

app.get("/", (req, res) => {
  res.send({
    application_name: "Image manager API",
    author,
    version,
    mongodb: {
      url: db.url,
      db: db.db,
      connected: db.get_connected(),
    },
    uploads_directory_path,
    auth_url: IDENTIFICATION_URL,
  })
})

app.use("/images", images_router)

// Legacy
app.get("/image", image_controller.get_image)

// Express error handler
app.use((error, req, res, next) => {
  console.error(error)
  let { statusCode = 500, message = error } = error
  if (isNaN(statusCode) || statusCode > 600) statusCode = 500
  res.status(statusCode).send(message)
})

// Start server
app.listen(APP_PORT, () => {
  console.log(`Image manager API v${version} listening on port ${APP_PORT}`)
})

exports.app = app
