const mv = require('mv')


exports.move_file = (original_path, destination_path) => new Promise((resolve, reject) => {
  mv(original_path, destination_path, {mkdirp: true}, (err) => {
    if (err) reject(err)
    resolve()
  })
})
