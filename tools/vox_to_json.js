function vox_to_json(raw_file_content) {
    const chunks = raw_file_content.main_chunk.childrens

    // ---- NODES
    let node_map = {}
    chunks.filter(c => ['nTRN', 'nGRP', 'nSHP'].includes(c.chunk_id)).forEach(chunk => {
        chunk.content.node_type = chunk.chunk_id
        node_map[chunk.content.node_id] = chunk.content
    })
    function parse_node(node_id, node_map) {
        let node = node_map[node_id]
        if ('child_node_id' in node) {
            let child_node_id = node.child_node_id
            node.child_node = parse_node(child_node_id, node_map)
            delete node.child_node_id
        } else if ('childs' in node) {
            node.childs = node.childs.map(({ node_id }) => parse_node(node_id, node_map))
        }
        return node
    }
    let world_node = parse_node(0, node_map)

    // ---- PALETTE
    let IMAP = chunks.filter(c => c.chunk_id == 'IMAP')[0].content
    let RGBA = chunks.filter(c => c.chunk_id == 'RGBA')[0].content
    let palette = IMAP.map((index) => RGBA[index - 1])

    // ---- MODELS
    let models = chunks.filter(c => ['SIZE', 'XYZI']).reduce((models, chunk) => {
        if (chunk.chunk_id == 'SIZE') return models.concat({ size: chunk.content })
        else if (chunk.chunk_id == 'XYZI') models[models.length - 1].voxels = chunk.content
        models[models.length - 1].voxels.forEach(voxel => voxel.i = IMAP[voxel.i])
        return models
    }, [])

    // ---- RETURN
    return {
        palette,
        models,
        world_node
    }
}

module.exports = vox_to_json