const fs = require('fs')
const vox_reader = require('../tools/vox_reader')
const vox_to_json = require('../tools/vox_to_json')

let vox_file = vox_reader(fs.readFileSync(process.env.VOX_PATH))
let vox_json = vox_to_json(vox_file)

console.log(vox_json)