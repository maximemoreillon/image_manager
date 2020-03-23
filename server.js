// NPM modules
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const history = require('connect-history-api-fallback')
const mongoose = require("mongoose")
const formidable = require('formidable')
const mv = require('mv')
const { v4: uuidv4 } = require('uuid');

// personal modules
const authorization_middleware = require('@moreillon/authorization_middleware')

// local modules
const secrets = require('./secrets')

// Mongoose models
const Image = require('./models/image')

const port = 7028;
const DB_name = 'images'

//const uploads_directory_path = path.join(__dirname, 'uploads')
const uploads_directory_path = "/usr/share/pv"

mongoose.connect(secrets.mongodb_url + DB_name, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// configure the authorization middleware
authorization_middleware.secret = secrets.jwt_secret

var app = express();

// Express configuration
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist')))
app.use(cors())
app.use(authorization_middleware.middleware)
app.use(history({
  // Ignore routes for connect-history-api-fallback
  rewrites: [
    { from: '/image', to: '/image'},
    { from: '/list', to: '/list'},
    { from: '/drop', to: '/drop'},
  ]
}));


app.post('/upload', (req, res) => {

  // Parse form using formidable
  var form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    // handle formidable errors
    if (err) {
      console.log(`Error parsing form: ${err}`)
      return res.status(500).send(`Error parsing form: ${err}`);
    }

    const file_key = 'image'

    // Check content of request
    if(! (file_key in files)) {
      console.log(`Image not present in request`)
      return res.status(400).send(`Image not present in request`);
    }

    // Check if image
    if(!files[file_key].type.includes('image')) {
      console.log(`File does not seem to be an image`)
      return res.status(400).send(`File does not seem to be an image`);
    }

    const original_path = files[file_key].path
    const original_name = files[file_key].name
    const extension = path.extname(original_name)
    const path_relative_to_upload_dir = uuidv4()+extension
    const destination_path = path.join(uploads_directory_path, path_relative_to_upload_dir)

    mv(original_path, destination_path, {mkdirp: true}, (err) => {
      if (err) {
        console.log(`Error moving file: ${err}`)
        return res.status(500).send(`Error moving file: ${err}`)
      }

      // saving info into DB
      const image = new Image({
        path: path_relative_to_upload_dir,
        size: files[file_key].size,
      });

      image.save()
      .then(() => {
        console.log(`Image successfully saved as ${path_relative_to_upload_dir}`)
        res.send({
          _id: image._id,
          size: image.size,
          upload_date: new Date(),
        })
      })
      .catch( err => {
        console.log(`Error saving to DB: ${err}`)
        return res.status(400).send(`Error saving to DB: ${err}`);
      })

    });

  });
})


app.get('/image', (req,res) => {

  // Check validity of request
  if(!('id' in req.query)) {
    console.log(`ID not present in request`)
    return res.status(400).send(`ID not present in request`)
  }

  Image.findById(req.query.id, (err, image) => {

    // handle errors
    if (err) {
      console.log(`Error retriving document from DB: ${err}`)
      return res.status(500).send(`Error retriving document from DB: ${err}`)
    }

    // Check if image actually exists
    if(!image) {
      console.log(`Image not found in DB`)
      return res.status(404).send(`Image not found in DB`)
    }

    res.sendFile(path.join(uploads_directory_path, image.path))

    // save referer
    var referer_url = req.get('Referrer')
    if(referer_url) {

      let found_referer = image.referers.find( referer => {
        return referer.url === referer_url
      })

      if(found_referer){
        found_referer.last_request = new Date()

        image.save()
        .then( () => console.log('Referer updated'))
        .catch(err => console.log(`Error saving referer: ${err}`))

      }
      else {
        image.referers.push({
          url: referer_url,
          last_request: new Date()
        })

        image.save()
        .then( () => console.log('Referer saved'))
        .catch(err => console.log(`Error saving referer: ${err}`))
      }
    }

  });

})


app.get('/list', (req,res) => {

  Image.find({},(err, docs) => {
    if (err) {
      console.log(`Error retriving documents from DB: ${err}`)
      return res.status(500).send(`Error retriving documents from DB: ${err}`)
    }
    res.send(docs)
  })
})


app.get('/drop', (req,res) => {

  Image.collection.drop()
  res.send('Collection dropped')
  console.log('Collection dropped')

})


// Start server
app.listen(port, () => {
  console.log(`Image manager listening on *:${port}`);
});
