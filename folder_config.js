const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

const uploads_directory_path = process.env.UPLOADS_DIRECTORY ?? "/usr/share/pv"
const trash_directory_path = path.join(uploads_directory_path, 'trash')

exports.uploads_directory_path = uploads_directory_path
exports.trash_directory_path = uploads_directory_path
