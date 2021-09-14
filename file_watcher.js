const chokidar = require('chokidar')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const {uploads_directory_path, trash_directory_path} = require('./folder_config.js')



const Image = require('./models/image.js')


const watch = chokidar.watch(uploads_directory_path, {depth: 0})

watch.on('add', absolute_file_path => {

  var file_name = path.basename(absolute_file_path)
  var relative_file_path = file_name

  // Check extension
  var extension = path.extname(absolute_file_path)
  var image_extensions = [ '.jpg', '.jpeg', '.png', '.bmp', '.svg', '.gif', '.tiff']
  if( !image_extensions.includes(extension)) return console.log(`[Chokidar] ${relative_file_path} is not an image`)



  console.log(`[Chokidar] Found new file: ${file_name}`)


  setTimeout(() => {

    try {
      var file_size = fs.statSync(absolute_file_path)['size']
    } catch (e) {
      return console.log(`[Chokidar] File seems not to exist anymore`)
    }


    Image.find({path: relative_file_path}, (err, result) => {
      if(err) return console.log(`Error getting images from DB: ${err}`)

      if(result.length === 0) {
        // If no result, means th eimage is not in the DB yet so register interval

        const image = new Image({
          path: relative_file_path,
          size: file_size,
          upload_date: new Date(),
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
      else console.log(`[Chokidar] ${file_name} was already removed from DB`)
    })

  }, 3000)

})

module.exports = watch
