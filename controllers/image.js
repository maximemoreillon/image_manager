const dotenv = require('dotenv')
const path = require('path')
const { uploads_directory_path } = require('../folder_config.js')
const Image = require('../models/image.js')
const createHttpError = require('http-errors')
const {
  move_file,
  get_thumbnail_filename,
  create_image_thumbnail,
  delete_folder,
  parse_form,
} = require('../utils.js')

dotenv.config()

const enforce_restrictions = (image, res) => {
  if(!image.restricted) return
  const {user} = res.locals

  if (!user) throw createHttpError(403, `Access to this image is restricted`)

  const user_id = user._id || user.properties._id
  const user_is_admin = user.isAdmin || user.properties.isAdmin

  if (!user_is_admin && user_id.toString() !== image.uploader_id) {
    throw createHttpError(403, `Access to this image is restricted`)
  }
    
}

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
      fields,
      image: {
        path: original_path,
        name: filename,
        size,
      },
    } = await parse_form(req)

    const imageProperties = {
      filename,
      size,
      upload_date: new Date(),
      uploader_id,
      ...fields
    }


    const record = await Image.create(imageProperties)

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

exports.get_image_list = async (req, res, next) => {

  try {

    const { 
      skip = 0, 
      limit = 50, 
      order = -1, 
      sort = 'upload_date',
      search,
    } = req.query

    const query = {}

    if (search && search !== '') query.$text = { $search: search }

    const items = await Image
      .find(query)
      .skip(Number(skip))
      .sort({ [sort] : order })
      .limit(Math.max(Number(limit), 0))

    const total = await Image.countDocuments(query)

    const response = { total, items }

    res.send(response)

  }
  catch (error) {
    next(error)
  }


}


const save_views = async (req, image) => {
  // Increase view count
  if(image.views) image.views += 1
  else image.views = 1

  // Save last view data
  image.last_viewed = new Date()

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
    enforce_restrictions(image, res)

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
    enforce_restrictions(image, res)

    const thumbnail_filename = get_thumbnail_filename(image.filename)

    const thumbnail_path = path.join(
      uploads_directory_path,
      image._id.toString(),
      thumbnail_filename
    )

    console.log(`Thumbnail of image ${image_id} queried`);

    res.sendFile(thumbnail_path)

  }
  catch (error) {
    next(error)
  }


}

exports.update_image = async (req, res, next) => {

  try {

    const { user } = res.locals
    if (!user) throw createHttpError(403, `Unauthorized to delete image`)

    const user_id = user._id || user.properties._id
    const user_is_admin = user.isAdmin || user.properties.isAdmin

    const image_id = get_image_id(req)
    if (!image_id) throw createHttpError(400, `ID not present in request`)

    const new_properties = req.body

    if (!user_is_admin && user_id.toString() !== image.uploader_id) {
      throw createHttpError(403, `Unauthorized to update image`)
    }

    let image = await Image.updateOne({ _id: image_id }, { $set: { ...new_properties}})
  


    console.log(`Image ${image_id} updated`);

    res.send({ image_id
})


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

exports.get_image_details = async (req,res, next) => {

  try {

    const image_id = get_image_id(req)
    if(!image_id) throw createHttpError(400, `ID not present in request`)

    const image = await Image.findById(image_id)
    if(!image) throw createHttpError(404, `Image not found in DB`)

    console.log(`Details of image ${image_id} queried`);
    res.send(image)

  }
  catch (error) {
    next(error)
  }


}

