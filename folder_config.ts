import path from "path"
import dotenv from "dotenv"

dotenv.config()

export const uploads_directory_path =
  process.env.UPLOADS_DIRECTORY ?? "/usr/share/pv"

export const trash_directory_path = path.join(uploads_directory_path, "trash")
