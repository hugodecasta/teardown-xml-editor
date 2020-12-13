const fs = require('fs')
const { toXML } = require('jstoxml');
const vox_reader = require('../tools/vox_reader')

const creat_dir = '/mnt/g/steam_content/steamapps/common/Teardown/create'
const world = 'custom'
const xml_file_path = `${creat_dir}/${world}.xml`
const world_file_dir = `${creat_dir}/${world}`
const vox_file = process.env.VOX_FILE
const vox_file_path = `${world_file_dir}/${vox_file}`
const vox_file_name = vox_file_path.split('/').pop()

let vox_json = vox_reader(fs.readFileSync(vox_file_path))
let node_map = vox_json.node_map
let models = vox_json.models

let objects = Object.values(node_map).filter(node => node.node_type == 'nSHP').map(node => {
    let parent = node_map[node.parent_id]
    let name = parent.node_attrs._name
    let mode_size = models[node.models[0].model_id].size
    let [x, y, z] = parent.frames[0]._t.split(' ').map(cor => parseInt(cor))
    z -= Math.trunc(mode_size.sz / 2)
    let position = { x, y, z }
    return { name, mode_size, position }
})

let objects_xml = objects.map(({ name, mode_size, position }) => {
    let { x, y, z } = position
    let xml_pos = [x / 10, z / 10, -y / 10].join(' ')
    let is_joint = name.includes('joint')
    let joint_type = is_joint ? (name.split('_')[1] ?? 'ball') : null
    let xml_obj = {
        _name: is_joint ? 'joint' : 'vox',
        _attrs: {
            pos: xml_pos,
            rot: '0 0 0',
        }
    }
    if (is_joint) {
        xml_obj._attrs.size = mode_size.sx / 10
        xml_obj._attrs.type = joint_type
        xml_obj._attrs.rotstrength = 0
    } else {
        xml_obj._attrs.file = `LEVEL/${vox_file_name}`
        xml_obj._attrs.object = name
        if (!name.includes('_noprop'))
            xml_obj._attrs.prop = "true"
    }
    return xml_obj
})


let full_xml = [
    {
        _name: 'scene',
        _attrs: {
            version: 3,
            shadowVolume: "200 100 200"
        },
        _content: [
            {
                _name: 'environment',
                _attrs: {
                    template: "sunset"
                }
            },
            {
                _name: 'body',
                _content: [
                    {
                        _name: "voxbox",
                        _attrs: {
                            pos: "-100.0 -0.1 -100.0",
                            size: "20000 10 20000"
                        }
                    }
                ]
            },
            {
                _name: 'body',
                _content: objects_xml
            },
            {
                _name: 'boundary',
                _content: [
                    { _name: 'vertex', _attrs: { pos: '-100.0 -100.0' } },
                    { _name: 'vertex', _attrs: { pos: '100.0 -100.0' } },
                    { _name: 'vertex', _attrs: { pos: '100.0 100.0' } },
                    { _name: 'vertex', _attrs: { pos: '-100.0 100.0' } }
                ]
            },
            {
                _name: 'script',
                _attrs: {
                    file: "../../data/script/main.lua"
                }
            }
        ],
    }
]

const xmlOptions = {
    header: false,
    indent: '   '
};
const final_xml = toXML(full_xml, xmlOptions)
fs.writeFileSync(xml_file_path, final_xml, 'utf8')