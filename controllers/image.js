const mongoose = require("mongoose")
const formidable = require('formidable')
const mv = require('mv')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const rimraf = require('rimraf')
const {
  uploads_directory_path,
  trash_directory_path
} = require('../folder_config.js')
const Image = require('../models/image.js')
const createHttpError = require('http-errors')
const sharp = require('sharp')
const {move_file} = require('../utils.js')
dotenv.config()



const get_image_id = (req) => {
  return req.params.id
    || req.params.image_id
    || req.query.id
}




const get_image_from_form = (req) => new Promise((resolve, reject) => {
  const form = new formidable.IncomingForm()

  form.parse(req, (err, fields, files) => {
    if(err) return reject(err)
    const file = files['image']

    if(!file) reject(createHttpError(400,`Image not present in request`))
    if(!file.type.includes('image')) reject(createHttpError(400,`File does not seem to be an image`))

    resolve(file)
  })

})



const get_thumbnail_filename = (original_filename) => {
  return original_filename.replace(/(\.[\w\d_-]+)$/i, '_thumbnail$1')
}

const create_image_thumbnail = async (file) => {

  const thumbnail_filename = get_thumbnail_filename(req.file.originalname)
  const thumbnail_path = path.resolve(req.file.destination,thumbnail_filename)

  const options = { failOnError: true }

  await sharp(req.file.path, options)
    .resize(128, 128)
    .withMetadata()
    .toFile(thumbnail_path)
}



exports.upload_image = async (req, res, next) => {

  try {

    const uploader_id = res.locals.user?._id
      || res.locals.user?.properties._id

    const {
      path: original_path,
      name: filename,
      size,
    } = await get_image_from_form(req)

    const record = await Image.create({
      filename,
      size,
      upload_date: new Date(),
      uploader_id,
    })

    const destination_path = path.join(uploads_directory_path, record._id.toString(), filename)

    await move_file(original_path,destination_path)

    console.log(`Image successfully saved as ${destination_path}`)
    res.send(record)
  }
  catch (error) {
    next(error)
  }

}

const save_views = async (req, image) => {
  // Increase view count
  if(image.views) image.views += 1
  else image.views = 1

  // save referer
  const referer_url = req.get('Referrer')

  if(referer_url) {
    let found_referer = image.referers.find( ({url}) => url === referer_url )

    if(found_referer) found_referer.last_request = new Date()
    else {
      image.referers.push({
        url: referer_url,
        last_request: new Date()
      })
    }
  }

  await image.save()
}

exports.get_image = async (req,res, next) => {

  try {
    const image_id = get_image_id(req)

    if(!image_id) throw createHttpError(400, `Image ID not present in request`)

    const image = await Image.findById(image_id)

    if(!image) throw createHttpError(404, `Image not found in DB`)

    const image_path = path.join(
      uploads_directory_path,
      image._id.toString(),
      image.filename
    )

    await save_views(req, image)

    console.log(`Image at ${image_path} queried`);

    res.sendFile(image_path)



  }
  catch (error) {
    next(error)
  }


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

    const current_user_id = user.identity.low ?? user.identity
    if(!user.properties.isAdmin && current_user_id.toString() !== image.uploader_id) {
      console.log(`User ${current_user_id} unahtorized to delete image ${image_id}`)
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
