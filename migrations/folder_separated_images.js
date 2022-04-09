const Image = require('../models/image.js')
const {move_file} = require('../utils.js')
const path = require('path')
const {
  uploads_directory_path,
} = require('../folder_config.js')

const migrate = async () => {
  const query = {path: {$exists: true}}
  const images = await Image.find(query)

  images.forEach( async image => {


    const original_path = path.join(uploads_directory_path, image.path)
    const destination_path = path.join(uploads_directory_path, image._id.toString(), image.path)



    await move_file(original_path,destination_path)
    image.filename = image.path
    image.path = undefined

    await image.save()

    console.log(`Image ${image._id.toString()} migrated`);

  })






}

exports.migrate = migrate
