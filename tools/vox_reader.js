const vox_to_json = require('./vox_to_json')

function iter(nb, func) {
    return Array.from(new Array(nb)).map((_, index) => func(index))
}

let type_transfer = {
    'string': (data, size = 4) => data.splice(0, size).map(char => String.fromCharCode(char)).join(''),
    'int': (data, size = 4) => {
        let unsigned = data.splice(0, size).reverse().reduce((val, byt) => val * 256 + byt, 0)
        let signed = unsigned > 2147483647 ? unsigned - 4294967296 : unsigned
        return signed
    },
    'bit': (data) => {
        return data.splice(0, 1)
    },
    'STRING': (data) => {
        let string_size = parse_value('int', data)
        return parse_value('string', data, string_size)
    },
    'dict': (data, values_type = []) => {
        let nb_pairs = parse_value('int', data)
        let dict = {}
        for (let i = 0; i < nb_pairs; ++i) {
            let string = parse_value('STRING', data)
            let v_type = values_type[i] ?? 'STRING'
            let value = parse_value(v_type, data)
            dict[string] = value
        }
        return dict
    },
    'node_attrs': (data) => {
        return parse_value('dict', data, ['STRING', 'bit'])
    },
    'frame': (data) => {
        return parse_value('dict', data, ['STRING', 'STRING'])
    },
    'chunk_id_SIZE': (data) => {
        return { sx: parse_value('int', data), sy: parse_value('int', data), sz: parse_value('int', data) }
    },
    'chunk_id_nTRN': (data) => {
        let node_id = parse_value('int', data)
        let node_attrs = parse_value('node_attrs', data)
        let child_node_id = parse_value('int', data)
        let reserved_id = parse_value('int', data)
        let layer_id = parse_value('int', data)
        let nb_frames = parse_value('int', data)
        let frames = iter(nb_frames, () => parse_value('frame', data))
        return { node_id, node_attrs, child_node_id, reserved_id, layer_id, nb_frames, frames }
    },
    'chunk_id_nGRP': (data) => {
        let node_id = parse_value('int', data)
        let node_attrs = parse_value('node_attrs', data)
        let childs_count = parse_value('int', data)
        let childs = iter(childs_count, () => { return { node_id: parse_value('int', data) } })
        return { node_id, node_attrs, childs }
    },
    'chunk_id_nSHP': (data) => {
        let node_id = parse_value('int', data)
        let node_attrs = parse_value('node_attrs', data)
        let model_count = parse_value('int', data)
        let models = iter(model_count, () => {
            return {
                model_id: parse_value('int', data),
                data: parse_value('dict', data)
            }
        })
        return { node_id, node_attrs, model_count, models }
    },
    'chunk_id_IMAP': (data) => {
        return iter(256, () => parse_value('int', data, 1))
    },
    'chunk_id_LAYR': (data) => {
        let layer_id = parse_value('int', data)
        let layer_attribute = parse_value('node_attrs', data)
        let flag = parse_value('int', data)
        return { layer_id, layer_attribute, flag }
    },
    'chunk_id_RGBA': (data) => {
        return iter(256, () => {
            return {
                r: parse_value('int', data, 1),
                g: parse_value('int', data, 1),
                b: parse_value('int', data, 1),
                a: parse_value('int', data, 1),
            }
        })
    },
    'chunk_id_MATL': (data) => {
        let material_id = parse_value('int', data)
        let mat_props = parse_value('dict', data,)
        return { material_id, mat_props }
    },
    'voxel': (data) => {
        return {
            x: parse_value('int', data, 1),
            z: parse_value('int', data, 1),
            y: parse_value('int', data, 1),
            i: parse_value('int', data, 1)
        }
    },
    'chunk_id_XYZI': (data) => {
        let nb_vox = parse_value('int', data)
        return iter(nb_vox, () => parse_value('voxel', data))
    },
    'chunk_id_rOBJ': (data) => {
        return parse_value('dict', data)
    },
    'chunk_id_rCAM': (data) => {
        let cam_id = parse_value('int', data)
        let cam_attrs = parse_value('dict', data)
        return { cam_id, cam_attrs }
    },
    'chunk_id_NOTE': (data) => {
        let color_type_count = parse_value('int', data)
        return iter(color_type_count, () => {
            return parse_value('STRING', data)
        })
    },
    'chunk_content': (data, chunk_id) => {
        if (data.length == 0) return null
        let chunk = parse_value('chunk_id_' + chunk_id, data)
        return chunk
    },
    'chunk_childrens': (data) => {
        let chunks = []
        while (data.length > 0) {
            chunks.push(parse_value('chunk', data))
        }
        return chunks
    },
    'chunk': (data) => {
        let chunk_id = parse_value('string', data)

        let content_size = parse_value('int', data)
        let children_size = parse_value('int', data)

        let content_data = data.splice(0, content_size)
        let children_data = data.splice(0, children_size)

        let content = parse_value('chunk_content', content_data, chunk_id)
        let childrens = parse_value('chunk_childrens', children_data)

        return { chunk_id, content, childrens }
    },
    'vox_file': (data) => {
        let vox_indicator = parse_value('string', data)
        let version_number = parse_value('int', data)
        let main_chunk = parse_value('chunk', data)
        return { vox_indicator, version_number, main_chunk }
    },
}

function parse_value(type, data, ...params) {
    return type_transfer[type](data, ...params)
}

module.exports = (file_data) => {
    let vox_json = vox_to_json(parse_value('vox_file', Array.from(file_data)))
    let { node_map, models } = vox_json
    vox_json.objects = Object.values(node_map).filter(node => node.node_type == 'nSHP').map(node => {
        let parent = node_map[node.parent_id]
        let name = parent.node_attrs._name
        let mode_size = models[node.models[0].model_id].size
        let [x, y, z] = parent.frames[0]._t.split(' ').map(cor => parseInt(cor))
        z -= Math.trunc(mode_size.sz / 2)
        let position = { x, y, z }
        return { name, mode_size, position }
    })
    return vox_json
}