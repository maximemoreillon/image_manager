import { Schema, model } from "mongoose"

export type ImageRecord = {
  _id: Schema.Types.ObjectId | string
  filename: string
  path: string // Legacy, renamed into filename above

  description: string // Optional description
  size: number
  upload_date: Date
  uploader_id: string

  restricted: Boolean // Whether an image can be viewed by someone else than the uploader

  // Keeping track of views and origin of those views
  last_viewed: Date
  views: number
  referers: any[]

  save: Function
}

const ImageSchema = new Schema<ImageRecord>({
  filename: String,
  path: String, // Legacy, renamed into filename above

  description: String, // Optional description
  size: Number,
  upload_date: Date,
  uploader_id: String,

  restricted: Boolean, // Whether an image can be viewed by someone else than the uploader

  // Keeping track of views and origin of those views
  last_viewed: Date,
  views: { type: Number, default: 0 },
  referers: { type: Array, default: [] },
})

const Image = model("Image", ImageSchema)

export default Image
