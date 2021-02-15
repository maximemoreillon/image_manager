const mongoose = require("mongoose")
const formidable = require('formidable')
const mv = require('mv')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')

const { v4: uuidv4 } = require('uuid')

dotenv.config()

let uploads_directory_path = require('../server.js').uploads_directory_path
let trash_directory_path = require('../server.js').trash_directory_path

const Image = require('../models/image.js')

const get_image_id = (req) => {
  return req.params.id
    || req.params.image_id
    || req.query.id
}



exports.upload_image = (req, res) => {

  // Parse form using formidable
  var form = new formidable.IncomingForm()

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
      // Error handling
      if (err) {
        console.log(`Error moving file: ${err}`)
        return res.status(500).send(`Error moving file: ${err}`)
      }



      // saving info into DB
      let image_properties = {
        path: path_relative_to_upload_dir,
        size: files[file_key].size,
        upload_date: new Date(),
      }

      const uploader = res.locals.user
      if(uploader) image_properties.uploader_id = uploader.identity.low

      const image = new Image(image_properties)

      image.save()
      .then(() => {
        console.log(`Image successfully saved as ${path_relative_to_upload_dir}`)
        res.send(image)
      })
      .catch( err => {
        console.log(`Error saving to DB: ${err}`)
        return res.status(400).send(`Error saving to DB: ${err}`);
      })

    })

  })
}

exports.get_image = (req,res) => {

  const image_id = get_image_id(req)

  // Check validity of request
  if(!image_id) {
    console.log(`ID not present in request`)
    return res.status(400).send(`ID not present in request`)
  }

  Image.findById(image_id, (err, image) => {

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

    // Send the image to the user
    const image_absolute_path = path.join(uploads_directory_path, image.path)
    res.sendFile(image_absolute_path)

    // Increase view count
    if(image.views) image.views += 1
    else image.views = 1

    // save referer
    const referer_url = req.get('Referrer')
    if(referer_url) {
      let found_referer = image.referers.find( referer => {
        return referer.url === referer_url
      })

      if(found_referer){
        found_referer.last_request = new Date()
      }
      else {
        image.referers.push({
          url: referer_url,
          last_request: new Date()
        })
      }
    }



    image.save()
    .then( () => console.log('Referer updated'))
    .catch(err => console.log(`Error saving referer: ${err}`))

  })

}

exports.delete_image = (req,res) => {

  const image_id = get_image_id(req)


  // Check validity of request
  if(!image_id) {
    console.log(`ID not present in request`)
    return res.status(400).send(`ID not present in request`)
  }

  // Find the image in the database
  Image.findById(image_id, (err, image) => {

    // Move image to trash directory
    const original_path = path.join(uploads_directory_path, image.path)
    const original_name = path.basename(image.path)

    const user = res.locals.user
    if(!user) {
      console.log(`Unauthorized to delete image`)
      return res.status(403).send(`Unauthorized to delete image ${image_id}`)
    }

    if(!user.properties.isAdmin && user.identity.low.toString() !== image.uploader_id) {
      console.log(`User ${user.identity.low} unahtorized to delete image ${image_id}`)
      return res.status(403).send(`Unauthorized to delete image ${image_id}`)
    }

    rimraf(original_path, (error) => {

      if(error) {
        console.log(error)
        res.status(500).send(`Failed to delete image ${image_id}`)
        return
      }

      image.remove( (err, result) => {
        if (err) {
          console.log(`Error removing document from DB: ${err}`)
          return res.status(500).send(`Error removing document from DB: ${err}`)
        }

        console.log(`Successfully deleted ${original_name}`)
        res.send(`Successfully deleted ${original_name}`)
      })

    })


  })

}

exports.get_image_details = (req,res) => {

  const image_id = get_image_id(req)

  // Check validity of request
  if(!image_id) {
    console.log(`ID not present in request`)
    return res.status(400).send(`ID not present in request`)
  }

  Image.findById(image_id, (err, image) => {

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

    res.send(image)

  })

}

exports.get_image_list = (req,res) => {
  // List all uploads
  Image.find({})
  .sort({upload_date: -1})
  .exec((err, docs) => {

    // Error handling
    if (err) {
      console.log(`Error retriving documents from DB: ${err}`)
      return res.status(500).send(`Error retriving documents from DB: ${err}`)
    }

    // Send the documents batch by batch ifspecified
    // This should be done at the DB query level
    if('start_index' in req.query && 'load_count' in req.query) {
      res.send(docs.slice(req.query.start_index, req.query.start_index+req.query.load_count))
    }
    else res.send(docs)
  })
}
