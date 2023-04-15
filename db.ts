import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

export const { MONGODB_DB = "images", MONGODB_URL = "mongodb://mongo" } =
  process.env

const mongodb_options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}

let mongodb_connected = false

export const connect = () =>
  new Promise((resolve, reject) => {
    console.log("[MongoDB] Attempting connection...")
    const connection_url = `${MONGODB_URL}/${MONGODB_DB}`
    mongoose
      .connect(connection_url, mongodb_options)
      .then(() => {
        resolve(null)
        console.log("[Mongoose] Initial connection successful")
      })
      .catch((error) => {
        console.log("[Mongoose] Initial connection failed")
        setTimeout(connect, 5000)
      })
  })

const db = mongoose.connection
db.on("error", () => {
  console.log("[Mongoose] Connection lost")
  mongodb_connected = false
})
db.once("open", () => {
  console.log("[Mongoose] Connection established")
  mongodb_connected = true
})

export const get_connected = () => mongodb_connected
