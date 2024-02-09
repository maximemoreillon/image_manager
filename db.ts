import mongoose from "mongoose"

export const {
  MONGODB_CONNECTION_STRING,
  MONGODB_PROTOCOL = "mongodb",
  MONGODB_USERNAME,
  MONGODB_PASSWORD,
  MONGODB_HOST = "mongo",
  MONGODB_PORT,
  MONGODB_DB = "images",
  MONGODB_OPTIONS = "",
} = process.env

const mongodb_options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}

const mongodbPort = MONGODB_PORT ? `:${MONGODB_PORT}` : ""

export const connectionString =
  MONGODB_CONNECTION_STRING ||
  (MONGODB_USERNAME && MONGODB_PASSWORD
    ? `${MONGODB_PROTOCOL}://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}${mongodbPort}/${MONGODB_DB}${MONGODB_OPTIONS}`
    : `${MONGODB_PROTOCOL}://${MONGODB_HOST}${mongodbPort}/${MONGODB_DB}${MONGODB_OPTIONS}`)

export const redactedConnectionString = connectionString.replace(
  /:.*@/,
  "://***:***@"
)

export const connect = () =>
  new Promise((resolve) => {
    console.log("[MongoDB] Attempting connection...")
    mongoose
      .connect(connectionString, mongodb_options)
      .then(() => {
        resolve(null)
        console.log("[Mongoose] Initial connection successful")
      })
      .catch((error) => {
        console.log("[Mongoose] Initial connection failed")
        console.error(error)
        setTimeout(connect, 5000)
      })
  })

const db = mongoose.connection
db.on("error", () => {
  console.log("[Mongoose] Connection lost")
})
db.once("open", () => {
  console.log("[Mongoose] Connection established")
})

export const get_connected = () => mongoose.connection.readyState
