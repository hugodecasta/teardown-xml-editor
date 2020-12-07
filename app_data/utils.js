const vues_dir = `${__dirname}/vues`
const fs = require('fs')

function get_all_vues() {
    function read_dir_rec(dir) {
        let vues = {}
        let subs = fs.readdirSync(dir)
        for (let sub of subs) {
            let path = `${dir}/${sub}`
            if (fs.lstatSync(path).isDirectory()) {
                let subvues = read_dir_rec(path)
                for (let sub_vue_name in subvues) {
                    vues[sub_vue_name] = subvues[sub_vue_name]
                }
            }
            if (sub.includes('.vue')) vues[sub.replace('.vue', '')] = path
        }
        return vues
    }
    return read_dir_rec(vues_dir)
}

httpVueLoader.httpRequest = function (file) {
    let vues = get_all_vues()
    file = file.replace('.vue', '')
    let path = vues[file]
    let file_data = fs.readFileSync(path, 'UTF8').replace('export default', 'module.exports =')
    return new Promise(ok => ok(file_data))
}

function load_vue_components(comp_names) {
    let components = {}
    for (let name of comp_names) {
        components[name] = httpVueLoader(`${name}.vue`)
    }
    return components
}

const THREE = require("three-full")

const {
    Scene,
    MOUSE,
    OrbitControls,
    PerspectiveCamera,
    WebGLRenderer,
    Color,
    FogExp2,
    CylinderBufferGeometry,
    MeshPhongMaterial,
    Mesh,
    DirectionalLight,
    AmbientLight,
    LineBasicMaterial,
    Geometry,
    Vector3,
    Line,
} = THREE;