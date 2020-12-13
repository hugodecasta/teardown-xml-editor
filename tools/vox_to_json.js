function vox_to_json(raw_file_content) {
    const chunks = raw_file_content.main_chunk.childrens

    // ---- NODES
    let node_map = {}
    chunks.filter(c => ['nTRN', 'nGRP', 'nSHP'].includes(c.chunk_id)).forEach(chunk => {
        chunk.content.node_type = chunk.chunk_id
        node_map[chunk.content.node_id] = chunk.content
    })

    Object.values(node_map).forEach(node => {
        let { node_id, child_node_id, childs, parent_id } = node
        if (child_node_id) node_map[child_node_id].parent_id = node_id
        if (childs) childs.forEach(({ node_id: child_id }) => node_map[child_id].parent_id = node_id)
        if (!parent_id) node.parent_id = -1
    })

    // function parse_node(node_id, node_map) {
    //     let node = node_map[node_id]
    //     node.parent_id = -1
    //     if ('child_node_id' in node) {
    //         let child_node_id = node.child_node_id
    //         node.child_node = parse_node(child_node_id, node_map)
    //         node.child_node.parent_id = node.node_id
    //         delete node.child_node_id
    //     } else if ('childs' in node) {
    //         node.childs = node.childs.map(({ node_id }) => {
    //             let sub_node = parse_node(node_id, node_map)
    //             sub_node.parent_id = node.node_id
    //             return sub_node
    //         })
    //     }
    //     return node
    // }
    // let world_node = parse_node(0, node_map)

    // ---- PALETTE
    let palette = chunks.filter(c => c.chunk_id == 'RGBA')[0].content
    console.log(palette.length)
    chunks.filter(c => c.chunk_id == 'MATL')
        .map(({ content: { mat_props, material_id } }) => ({ i: material_id, props: mat_props }))
        .forEach(mat => palette[mat.i - 1].mat = mat.props)

    // ---- MODELS
    let models = chunks.filter(c => ['SIZE', 'XYZI']).reduce((models, chunk) => {
        if (chunk.chunk_id == 'SIZE') return models.concat({ size: chunk.content })
        else if (chunk.chunk_id == 'XYZI') models[models.length - 1].voxels = chunk.content
        return models
    }, [])

    // ---- RETURN
    return {
        palette,
        models,
        node_map
    }
}

module.exports = vox_to_json