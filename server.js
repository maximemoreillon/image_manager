// NPM modules
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const mongoose = require("mongoose")
const mv = require('mv')
const fs = require('fs')
const dotenv = require('dotenv')
const auth = require('@moreillon/authentication_middleware')
const pjson = require('./package.json')


dotenv.config()

const DB_name = process.env.MONGODB_DB || 'images'
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://mongo'
const app_port = process.env.APP_PORT || 80

const uploads_directory_path = process.env.UPLOADS_DIRECTORY || "/usr/share/pv"
const trash_directory_path = path.join(uploads_directory_path, 'trash')

exports.uploads_directory_path = uploads_directory_path
exports.trash_directory_path = uploads_directory_path

const Image = require('./models/image.js')
const image_controller = require('./controllers/image.js')

require('./file_watcher.js')



mongoose.connect(`${MONGODB_URL}/${DB_name}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
})


// Express configuration
const app = express()
app.use(bodyParser.json())
//app.use(express.static(uploads_directory_path))
app.use(cors())

app.get('/', (req, res) => {
  res.send({
    application_name: 'Image manager API',
    author: 'Maxime MOREILLON',
    version: pjson.version,
    mongodb_url: MONGODB_URL,
    mongodb_db: DB_name,
    authentication_api_url: process.env.AUTHENTICATION_API_URL || 'UNDEFINED'
  })
})

// REST API
app.route('/images')
  .get(image_controller.get_image)
  .post(auth.authenticate, image_controller.upload_image)

app.route('/images/:id')
  .get(image_controller.get_image)
  .delete(auth.authenticate, image_controller.delete_image)

app.route('/images/:id/details')
  .get(image_controller.get_image_details)

// LEGACY ROUTES
app.route('/image')
  .get(image_controller.get_image)
  .post(auth.authenticate, image_controller.upload_image)
  .delete(auth.authenticate, image_controller.delete_image)

app.get('/image_list',auth.authenticate, image_controller.get_image_list)
app.get('/image_details', image_controller.get_image_details)


// Start server
app.listen(app_port, () => {
  console.log(`Image manager API v${pjson.version} listening on port ${app_port}`);
})
