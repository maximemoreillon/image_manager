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
const chokidar = require('chokidar');
const fs = require('fs')
// personal modules
const authorization_middleware = require('@moreillon/authorization_middleware')

// local modules
const secrets = require('./secrets')

// Mongoose models
const Image = require('./models/image')

const port = 7028;
const DB_name = 'images'

const uploads_directory_path = path.join(__dirname, 'uploads')
//const uploads_directory_path = "/usr/share/pv"
const trash_directory_path = path.join(uploads_directory_path, 'trash')

mongoose.connect(secrets.mongodb_url + DB_name, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// configure the authorization middleware
authorization_middleware.secret = secrets.jwt_secret


// Watch system to allow images to bedropped directly into the uploads directory
const watch = chokidar.watch(uploads_directory_path, {depth: 0})

watch.on('add', absolute_file_path => {

  var file_name = path.basename(absolute_file_path)
  var relative_file_path = file_name

  // Check extension
  var extension = path.extname(absolute_file_path)
  var image_extensions = [ '.jpg', '.jpeg', '.png', '.bmp', '.svg', '.gif', '.tiff']
  if( !image_extensions.includes(extension)) return console.log(`[Chokidar] ${relative_file_path} is not an image`)

  // get file size
  var stats = fs.statSync(absolute_file_path)

  console.log(`[Chokidar] Found new file: ${file_name}`)

  setTimeout(() => {

    Image.find({path: relative_file_path}, (err, result) => {
      if(err) return console.log(`Error getting images from DB: ${err}`)
      if(result.length === 0) {
        const image = new Image({
          path: relative_file_path,
          size: stats['size']
        });

        image.save()
        .then(() => { console.log(`[Chokidar] Image ${relative_file_path} successfully registered `) })
        .catch( err => { console.log(`[Chokidar] Error saving to DB: ${err}`) })
      }
      else  console.log(`[Chokidar] Image ${relative_file_path} was already registered `)
    })
  }, 3000)
})

watch.on('unlink', absolute_file_path => {
  var file_name = path.basename(absolute_file_path)
  var relative_file_path = file_name

  console.log(`[Chokidar] File got removed: ${file_name}`)

  setTimeout(() => {
    Image.findOneAndDelete({path: relative_file_path}, (err, result) => {
      if(err) return console.log(`[Chokidar] Error removing from DB: ${err}`)
      if(result) console.log(`[Chokidar] Removed ${result.path} from DB`)
    })

  }, 3000)

});





var app = express();

// Express configuration
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'dist')))
app.use(cors())
//app.use(authorization_middleware.middleware)
app.use(history({
  // Ignore routes for connect-history-api-fallback
  rewrites: [
    { from: '/image', to: '/image'},
    { from: '/list', to: '/list'},
    { from: '/drop', to: '/drop'},
  ]
}));


app.post('/upload',authorization_middleware.middleware, (req, res) => {

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


app.get('/list',authorization_middleware.middleware, (req,res) => {

  Image.find({},(err, docs) => {
    if (err) {
      console.log(`Error retriving documents from DB: ${err}`)
      return res.status(500).send(`Error retriving documents from DB: ${err}`)
    }
    res.send(docs)
  })
})


app.post('/delete',authorization_middleware.middleware, (req,res) => {

  if(!('id' in req.body)) {
    console.log(`ID not present in request`)
    return res.status(400).send(`ID not present in request`)
  }

  Image.findById(req.body.id, (err, image) => {

    var original_path = path.join(uploads_directory_path, image.path)
    var original_name = path.basename(image.path)
    var destination_path = path.join(trash_directory_path, original_name)

    mv(original_path, destination_path , {mkdirp: true}, (err) => {

      // Even in case of error, remove from DB
      if (err)  console.log(`Error moving file to trash: ${err}`)

      image.remove( (err, result) => {
        if (err) {
          console.log(`Error removing document from DB: ${err}`)
          return res.status(500).send(`Error removing document from DB: ${err}`)
        }

        console.log(`Successfully deleted ${original_name}`)
        res.send(`Successfully deleted ${original_name}`)
      })

    });


  })

})

app.post('/drop',authorization_middleware.middleware, (req,res) => {

  Image.collection.drop()
  res.send('Collection dropped')
  console.log('Collection dropped')

})



// Start server
app.listen(port, () => {
  console.log(`Image manager listening on *:${port}`);
});
