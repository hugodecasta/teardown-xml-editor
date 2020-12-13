<template>
    <div id='viewport'>
        <div style='position:fixed;left:400px;bottom:20px;'>
            <v-btn @click='three.axis.setMode("translate");'>
                <v-icon>mdi-axis-arrow</v-icon>
            </v-btn>
            <v-btn
                @click='three.axis.setMode("rotate");'
                :disabled='selected_node && !("rot" in selected_node.props)'
            >
                <v-icon>mdi-rotate-orbit</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
export default {
    props: ["loaded_files", "track_data", "node_map"],
    data: () => ({
        select_box: null,
        node_3d_data: {},
        joint_mesh: null,
        selected_mat: null,
        three: {
            renderer: null,
            scene: null,
            camera: null,
        },
    }),
    methods: {
        create_color: (r, g, b) => r * 256 * 256 + g * 256 + b,
        create_mat_palette(file_data) {
            this.selected_mat = new THREE.MeshBasicMaterial({
                color: 0xea7600,
                depthTest: false,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide,
            });
            file_data.mat_palette = file_data.palette.map(
                ({ r, g, b, mat }) => {
                    let color = this.create_color(r, g, b);
                    let material = new THREE.MeshLambertMaterial({
                        color,
                        depthTest: true,
                        side: THREE.DoubleSide,
                    });
                    if (mat._type == "_glass") {
                        material.transparent = true;
                        material.opacity = 0.5;
                    }
                    if (mat._type == "_emit") {
                        material = new THREE.MeshBasicMaterial({
                            color,
                            depthTest: true,
                            side: THREE.DoubleSide,
                        });
                    }
                    return material;
                }
            );
        },
        create_model_base_mesh(model, mat_palette) {
            let model_geometry = vox2mesh(model);
            let mode_base_mesh = new THREE.Mesh(model_geometry, mat_palette);
            return mode_base_mesh;
        },
        handle_load_files() {
            Object.values(this.loaded_files).forEach((file_data) => {
                let { models, palette, mat_palette } = file_data;
                if (!mat_palette) this.create_mat_palette(file_data);
                models.forEach(
                    (model) =>
                        (model.base_mesh ||= this.create_model_base_mesh(
                            model,
                            file_data.mat_palette
                        ))
                );
            });
        },
        add_to_group(group, sub) {
            let { x, y, z } = group.position;
            group.position = new THREE.Vector3(0, 0, 0);
            group.add(sub);
            sub.parent = group;
            group.position = new THREE.Vector3(x, y, z);
        },
        remove_from_parent(object) {
            if (object.parent) object.parent.remove(object);
        },
        handle_node_map() {
            let removing_3d_node = [];
            Object.values(this.node_3d_data).forEach((node_3d) => {
                if (
                    !Object.values(this.node_map)
                        .map((real_node) => real_node.id)
                        .includes(node_3d.id)
                ) {
                    removing_3d_node.push(node_3d.id);
                    let { group, mesh } = node_3d;
                    if (mesh) this.remove_from_parent(mesh);
                    this.remove_from_parent(group);
                }
            });
            removing_3d_node.forEach((id) => delete this.node_3d_data[id]);
            Object.values(this.node_map).forEach((node) => {
                let { type, props, id, parent_id } = node;
                if (!this.node_3d_data[id]) this.node_3d_data[id] = { id };
                let node_3d = this.node_3d_data[id];
                let { group } = node_3d;
                if (!group) {
                    node_3d.base_node = node;
                    group = new THREE.Group();
                    group.base_node = node;
                    node_3d.group = group;
                    if (node.content) {
                        node.content.forEach((child) => {
                            let child_3d = this.node_3d_data[child.id];
                            if (!child_3d) return;
                            if (child_3d.group)
                                this.add_to_group(
                                    node_3d.group,
                                    child_3d.group
                                );
                        });
                    }
                    if (
                        parent_id &&
                        this.node_3d_data[parent_id] &&
                        this.node_3d_data[parent_id].group
                    ) {
                        let parent_3d = this.node_3d_data[parent_id];
                        this.add_to_group(parent_3d.group, node_3d.group);
                    } else if (!parent_id) {
                        this.add_to_group(this.three.scene, group);
                    }
                }
                if (type == "vox") {
                    let { mesh } = node_3d;
                    if (!mesh) {
                        let object_name = props["object"];
                        let file_name = props["file"];
                        let file_data = this.loaded_files[file_name];
                        let model_id = file_data.objects[object_name].model_id;
                        let model = file_data.models[model_id];
                        let model_mesh = model.base_mesh;
                        mesh = model_mesh.clone();
                        node_3d.mesh = mesh;
                        let outline_mesh = mesh.clone();
                        outline_mesh.material = this.selected_mat;
                        outline_mesh.renderOrder = 1;
                        node_3d.outline_mesh = outline_mesh;
                        this.add_to_group(mesh, outline_mesh);
                        this.add_to_group(group, mesh);
                    }
                } else if (type == "joint") {
                    let { mesh } = node_3d;
                    if (!mesh) {
                        mesh = this.joint_mesh.clone();
                        node_3d.mesh = mesh;
                        let outline_mesh = mesh.clone();
                        outline_mesh.material = this.selected_mat;
                        outline_mesh.renderOrder = 1;
                        node_3d.outline_mesh = outline_mesh;
                        this.add_to_group(mesh, outline_mesh);
                        this.add_to_group(group, mesh);
                    }
                    let { size, rotstrength } = props;
                    size = parseInt(size);
                    let [r, g, b] = [1, rotstrength, rotstrength];
                    mesh.material.color = new THREE.Color(r, g, b);
                    mesh.scale = new THREE.Vector3(size, size, size);
                }
                this.node_3d_data[id] = node_3d;
                if (props.pos) {
                    let [z, x, y] = props.pos
                        .toString()
                        .split(",")
                        .map((co) => parseFloat(co));
                    group.position.x = x;
                    group.position.y = y;
                    group.position.z = z;
                }
                if (props.rot) {
                    [x, y, z] = props.rot
                        .toString()
                        .split(",")
                        .map((co) => parseFloat(co));
                    group.rotation.x = x;
                    group.rotation.y = z;
                    group.rotation.z = y;
                }
                group.updateMatrix();
            });
        },
        handle_track_data() {
            const selected_nodes = this.track_data.selected_nodes;
            this.three.axis.detach();
            Object.values(this.node_3d_data).forEach((node) => {
                let { mesh, id, group, outline_mesh } = node;
                if (selected_nodes.includes(id)) {
                    this.three.axis.attach(group);
                    if (!node.base_node.props.rot) {
                        this.three.axis.setMode("translate");
                    }
                }
                if (outline_mesh) {
                    if (selected_nodes.includes(id)) {
                        outline_mesh.visible = true;
                    } else outline_mesh.visible = false;
                }
            });
        },
    },
    computed: {
        selected_node() {
            if (this.track_data.selected_nodes.length == 0) return null;
            return this.node_map[this.track_data.selected_nodes[0]];
        },
    },
    watch: {
        loaded_files: {
            handler: function () {
                this.handle_load_files();
            },
            deep: true,
        },
        node_map: {
            handler: function () {
                this.handle_node_map();
            },
            deep: true,
        },
        track_data: {
            handler: function () {
                this.handle_track_data();
            },
            deep: true,
        },
    },
    mounted() {
        // ----------- INIT RENDERER

        this.three.renderer = new WebGLRenderer({ antialias: true });
        this.three.renderer.setPixelRatio(window.devicePixelRatio);
        this.three.renderer.setSize(0, 0);
        this.three.renderer.autoClear = false;
        document
            .getElementById("viewport")
            .appendChild(this.three.renderer.domElement);
        // ----------- INIT CAMERA

        this.three.camera = new PerspectiveCamera(60, 1, 1, 10000);
        let cam_start = {
            x: -80.99731780423285,
            y: 67.02465384631478,
            z: 75.7811036311754,
        };
        this.three.camera.position = new THREE.Vector3(
            ...Object.values(cam_start)
        );

        // ----------- POINTER EVENT

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();

        let setup_mouse_vector = (event) => {
            event.preventDefault();
            mouse.x =
                (event.clientX / this.three.renderer.domElement.clientWidth) *
                    2 -
                1;
            mouse.y =
                -(event.clientY / this.three.renderer.domElement.clientHeight) *
                    2 +
                1;
            raycaster.setFromCamera(mouse, this.three.camera);
        };

        this.three.renderer.domElement.addEventListener("mouseup", (event) => {
            if (event.button != 0) return;
            if (this.three.axis.dragging) return;

            setup_mouse_vector(event);

            var intersects = raycaster.intersectObjects(
                Object.values(this.node_3d_data)
                    .filter((node_3d) => node_3d.mesh)
                    .map((node_3d) => {
                        let { mesh } = node_3d;
                        mesh.node_id = node_3d.id;
                        return mesh;
                    })
            );

            while (this.track_data.selected_nodes.length > 0)
                this.track_data.selected_nodes.splice(0, 1);

            if (intersects.length > 0) {
                this.track_data.selected_nodes.push(
                    intersects[0].object.node_id
                );
            }
        });

        // ----------- INIT CONTROLS

        this.three.controls = new OrbitControls(
            this.three.camera,
            this.three.renderer.domElement
        );
        this.three.controls.maxPolarAngle = Math.PI * 0.49;
        this.three.controls.minDistance = 10;
        this.three.controls.maxDistance = 5000;
        this.three.controls.screenSpacePanning = true;
        this.three.controls.mouseButtons = {
            LEFT: null,
            WHEEL: MOUSE.DOLLY,
            MIDDLE: MOUSE.PAN,
            RIGHT: MOUSE.ROTATE,
        };

        // ----------- INIT SCENE

        this.three.scene = new Scene();
        let back_color = 0x303030;
        this.three.scene.background = new Color(back_color);
        this.three.scene.fog = new THREE.FogExp2(back_color, 0.003);

        // ----------- SELECT BOX

        const sbg = new THREE.BoxGeometry(10, 10, 10);
        const sbwg = new THREE.WireframeGeometry(sbg);
        let sb_mesh = new THREE.LineSegments(sbwg);
        sb_mesh.material.depthTest = false;
        sb_mesh.material.opacity = 0;
        sb_mesh.material.transparent = true;
        this.select_box = sb_mesh;
        this.three.scene.add(sb_mesh);

        // ----------- REFERENCE PLANE

        let plane_size = 100000;
        let grid_length = 11;
        let grid_size = 200;
        let grid_mid = grid_size / 2;

        const positions = [];
        const colors = [];

        let add_line = (
            x,
            y,
            z,
            x1,
            y1,
            z1,
            linewidth = 1,
            color = 0x202020
        ) => {
            let material = new THREE.LineMaterial({
                color,
                linewidth: linewidth / 1000,
            });
            const points = [x, z, y, x1, z1, y1];
            const geo = new THREE.LineGeometry().setPositions(points);
            const line = new THREE.Line2(geo, material);
            this.three.scene.add(line);
        };

        const geometry = new THREE.PlaneGeometry(plane_size, plane_size);
        const material = new THREE.MeshBasicMaterial({
            color: 0x555555,
            side: THREE.DoubleSide,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = Math.PI / 2;
        this.three.scene.add(plane);

        add_line(-plane_size / 2, 0, 0.1, plane_size / 2, 0, 0.1, 3);
        add_line(0, -plane_size / 2, 0, 0.1, plane_size / 2, 3, 0.1);
        for (let line_id = 0; line_id < grid_length; +line_id++) {
            let place = (line_id / (grid_length - 1)) * grid_size - grid_mid;
            add_line(-grid_mid, place, 0.1, grid_mid, place, 0.1, 1);
            add_line(place, -grid_mid, 0.1, place, grid_mid, 0.1, 1);
        }

        // ----------- LIGHTS

        let lightA = new DirectionalLight(0xffffff);
        lightA.position.set(1, 1, 1);
        this.three.scene.add(lightA);
        let lightB = new DirectionalLight(0x002288);
        lightB.position.set(-1, -1, -1);
        this.three.scene.add(lightB);
        let lightC = new AmbientLight(0x222222);
        lightC.position.set(-1, 1, -1);
        this.three.scene.add(lightC);

        // ----------- AXIS

        this.three.axis = new THREE.TransformControls(
            this.three.camera,
            this.three.renderer.domElement
        );
        this.three.scene.add(this.three.axis);
        this.three.axis.setTranslationSnap(1);
        this.three.axis.setRotationSnap(Math.PI / 10);
        this.three.axis.space = "local";
        window.axis = this.three.axis;
        this.three.axis.addEventListener("objectChange", (evt) => {
            let group = this.three.axis.object;
            let node = this.three.axis.object.base_node;
            let { x, y, z } = group.position;
            node.props.pos = [z, x, y];
            if (node.props.rot) {
                let { x, y, z } = group.rotation;
                if (x == z && Math.abs(x) == Math.PI) {
                    x = 0;
                    z = 0;
                    y *= 2;
                }
                // console.log(rot);
                node.props.rot = [x, z, y];
            }
        });

        window.cam = () => clone(this.three.camera.position);

        // ----------- PERSONA MESH

        add_line(0, 0, 0, 0, 0, 17, 3, 0xaaaaaa);
        add_line(0, 0, 15, -3, 0, 15, 2, 0xaaaaaa);

        // ----------- JOINT MESH

        let ball_geo = new THREE.SphereGeometry(1, 4, 1);
        let joint_center_geo = new THREE.SphereGeometry(0.1, 4, 1);
        let joint_geo = new THREE.Geometry();
        joint_geo.merge(ball_geo);
        joint_geo.merge(joint_center_geo);
        let joint_mat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            depthTest: false,
        });
        this.joint_mesh = new THREE.Mesh(joint_geo, joint_mat);

        // ----------- RENDER UPDATE

        let resize = () => {
            let { innerWidth, innerHeight } = window;
            this.three.width = innerWidth;
            this.three.height = innerHeight;
            this.three.camera.aspect = innerWidth / innerHeight;
            this.three.camera.updateProjectionMatrix();
            this.three.renderer.setSize(innerWidth, innerHeight);
        };

        window.addEventListener("resize", resize);
        resize();

        let animate = () => {
            window.requestAnimationFrame(() => {
                animate();
            });
            this.three.renderer.render(this.three.scene, this.three.camera);
            this.three.controls.update();
        };

        animate();
    },
};
</script>

<style>
#viewport {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    z-index: 0;
}
canvas {
    outline: none;
    margin-bottom: -10px;
}
</style>