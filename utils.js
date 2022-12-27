const mv = require('mv')
const sharp = require('sharp')
const path = require('path')
const rimraf = require('rimraf')
const formidable = require('formidable')
const createHttpError = require('http-errors')

exports.parse_form = (req) => new Promise((resolve, reject) => {
  const form = new formidable.IncomingForm()

  form.parse(req, (err, fields, files) => {
    if(err) return reject(err)
    const image = files['image']

    if(!image) reject(createHttpError(400,`Image not present in request`))
    if(!image.type.includes('image')) reject(createHttpError(400,`File does not seem to be an image`))

    resolve({image, fields})
  })

})

exports.move_file = (original_path, destination_path) => new Promise((resolve, reject) => {
  mv(original_path, destination_path, {mkdirp: true}, (err) => {
    if (err) reject(err)
    resolve()
  })
})


const get_thumbnail_filename = (original_filename) => {
  return original_filename.replace(/(\.[\w\d_-]+)$/i, '_thumbnail$1')
}
exports.get_thumbnail_filename = get_thumbnail_filename

exports.create_image_thumbnail = async (image_path) => {

  const folder_path = path.dirname(image_path)
  const image_filename = path.basename(image_path)
  const thumbnail_filename = get_thumbnail_filename(image_filename)
  const thumbnail_path = path.resolve(folder_path,thumbnail_filename)

  const options = { failOnError: true }


  await sharp(image_path, options)
    .resize(256, 256)
    .withMetadata()
    .toFile(thumbnail_path)
}

exports.delete_folder = (folder_path) => new Promise((resolve, reject) => {
  rimraf(folder_path, (error) => {
    if(error) reject(error)
    resolve()
  })
})
