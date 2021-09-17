// NPM modules
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const pjson = require('./package.json')
const db = require('./db.js')
const image_controller = require('./controllers/image.js')
const images_router = require('./routes/images.js')
const folder_config = require('./folder_config.js')
//const file_watcher = require('./file_watcher.js')

dotenv.config()


const app_port = process.env.APP_PORT ?? 80



// Express configuration
const app = express()
app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send({
    application_name: 'Image manager API',
    author: 'Maxime MOREILLON',
    version: pjson.version,
    mongodb: {
      url: db.url,
      db: db.db,
      connected: db.get_connected(),
    },
    authentication_api_url: process.env.AUTHENTICATION_API_URL ?? 'UNDEFINED',
  })
})


app.use('/images', images_router)
app.get('/image', image_controller.get_image)





// Start server
app.listen(app_port, () => {
  console.log(`Image manager API v${pjson.version} listening on port ${app_port}`);
})
