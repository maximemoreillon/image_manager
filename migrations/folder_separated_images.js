const Image = require('../models/image.js')
const path = require('path')
const { uploads_directory_path } = require('../folder_config.js')
const {
  move_file,
  create_image_thumbnail,
} = require('../utils.js')

const migrate = async () => {


  const query = {path: {$exists: true}}
  const images = await Image.find(query)

  if (images.length) console.log(`Migrating ${images.length} records with old schema`);

  images.forEach( async image => {


    const original_path = path.join(uploads_directory_path, image.path)
    const destination_path = path.join(uploads_directory_path, image._id.toString(), image.path)

    await move_file(original_path,destination_path)

    await create_image_thumbnail(destination_path)

    image.filename = image.path
    image.path = undefined

    await image.save()

    console.log(`Image ${image._id.toString()} migrated`);

  })






}

exports.migrate = migrate
