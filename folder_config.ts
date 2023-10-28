import path from "path"

export const { UPLOADS_DIRECTORY = "/usr/share/pv" } = process.env

export const uploads_directory_path = UPLOADS_DIRECTORY

export const trash_directory_path = path.join(uploads_directory_path, "trash")
