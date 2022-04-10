const dotenv = require('dotenv')
const path = require('path')
const {
  uploads_directory_path,
  trash_directory_path
} = require('../folder_config.js')
const Image = require('../models/image.js')
const createHttpError = require('http-errors')
const sharp = require('sharp')
const {
  move_file,
  get_thumbnail_filename,
  create_image_thumbnail,
  delete_folder,
  get_image_from_form,
} = require('../utils.js')
const { v4: uuidv4 } = require('uuid') // used in legacy upload

dotenv.config()



const get_image_id = (req) => {
  return req.params.id
    || req.params.image_id
    || req.query.id
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
    await create_image_thumbnail(destination_path)

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

exports.get_thumbnail = async (req,res, next) => {

  try {
    const image_id = get_image_id(req)

    if(!image_id) throw createHttpError(400, `Image ID not present in request`)

    const image = await Image.findById(image_id)

    if(!image) throw createHttpError(404, `Image not found in DB`)

    const thumbnail_filename = get_thumbnail_filename(image.filename)

    const thumbnail_path = path.join(
      uploads_directory_path,
      image._id.toString(),
      thumbnail_filename
    )


    console.log(`Thumbnail at ${thumbnail_path} queried`);

    res.sendFile(thumbnail_path)



  }
  catch (error) {
    next(error)
  }


}

exports.delete_image = async (req,res, next) => {

  try {

    const {user} = res.locals
    if(!user) throw createHttpError(403, `Unauthorized to delete image`)

    const user_id = user._id || user.properties._id
    const user_is_admin = user.isAdmin || user.properties.isAdmin

    const image_id = get_image_id(req)
    if(!image_id) throw createHttpError(400, `ID not present in request`)

    const image = await Image.findById(image_id)

    if(!user_is_admin && user_id.toString() !== image.uploader_id) {
      throw createHttpError(403, `Unauthorized to delete image`)
    }

    const image_folder_path = path.join(uploads_directory_path, image._id.toString())
    await delete_folder(image_folder_path)

    await image.remove()

    console.log(`Image ${image_id} deleted`);

    res.send({image_id})


  }
  catch (error) {
    next(error)
  }



}

exports.get_image_details = (req,res, next) => {

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

exports.get_image_list = async (req,res, next) => {

  try {

    const {
      start_index = 0,
      load_count = 0
    } = req.query

    const images = await Image.find({})
      .sort({upload_date: -1})
      .skip(Number(start_index))
      .limit(Math.max(Number(load_count), 0))

    // TODO: Query total and respond with both total and queried documents

    res.send(images)

  }
  catch (error) {
    next(error)
  }


}
