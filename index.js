// NPM modules
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const {version, author} = require('./package.json')
const db = require('./db.js')
const image_controller = require('./controllers/image.js')
const images_router = require('./routes/images.js')
const folder_config = require('./folder_config.js')
const {migrate} = require('./migrations/folder_separated_images.js')


dotenv.config()




const {
  APP_PORT = 80,
  AUTHENTICATION_API_URL = 'UNDEFINED',
} = process.env

db.connect()
  .then(() => {
    // migrate
    migrate()
  })

// Express configuration
const app = express()
app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send({
    application_name: 'Image manager API',
    author,
    version,
    mongodb: {
      url: db.url,
      db: db.db,
      connected: db.get_connected(),
    },
    authentication_api_url: AUTHENTICATION_API_URL,
  })
})


app.use('/images', images_router)

// Legacy
app.get('/image', image_controller.get_image)


// Express error handler
app.use((error, req, res, next) => {
  console.error(error)
  let { statusCode = 500, message = error } = error
  if(isNaN(statusCode) || statusCode > 600) statusCode = 500
  res.status(statusCode).send(message)
})




// Start server
app.listen(APP_PORT, () => {
  console.log(`Image manager API v${version} listening on port ${APP_PORT}`);
})

exports.app = app
