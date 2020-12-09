<template>
    <div id='viewport'></div>
</template>

<script>
export default {
    props: ["loaded_files", "load_vox_file"],
    data: () => ({
        file_models: {},
        selected_node: null,
        select_box: null,
        select_axis: null,
        debug_meshes: [],
        three: {
            renderer: null,
            camera: null,
            controls: null,
            scene: null,
        },
    }),
    methods: {
        create_voxel_geometry(model) {
            let { sx, sy, sz } = model.size;
            // let model_geometry = model.voxels
            //     .map((voxel) => {
            //         let { x, y, z } = voxel;
            //         let coord_arr = [x, y, z];
            //         let unfree_spaces = model.voxels
            //             .map((other_voxel) => {
            //                 if (other_voxel == voxel) return [];
            //                 let { x: ox, y: oy, z: oz } = other_voxel;
            //                 let o_coord_arr = [ox, oy, oz];
            //                 return o_coord_arr.map(
            //                     (co, index) => coord_arr[index] - co
            //                 );
            //             })
            //             .filter((e) => e)
            //             .filter(
            //                 (vox_d) =>
            //                     vox_d.reduce((a, b) => a + Math.abs(b), 0) == 1
            //             )
            //             .reduce(
            //                 (space_taken, vox_d) => {
            //                     vox_d.forEach((dif, index) =>
            //                         space_taken[index].push(dif)
            //                     );
            //                     return space_taken;
            //                 },
            //                 [[], [], []]
            //             );
            //         let free_space = [
            //             [-1, 1],
            //             [-1, 1],
            //             [-1, 1],
            //         ].map((free, ax) =>
            //             free.filter((dir) => !unfree_spaces[ax].includes(dir))
            //         );
            //         let rotate_axes = Array.from("yxz");
            //         let axes = Array.from("xyz");
            //         let voxel_geo = free_space
            //             .map((ax_free_dirs, ax) => {
            //                 let rotate_axe = rotate_axes[ax];
            //                 let axe = axes[ax];
            //                 let other_axes = axes.filter((ax) => ax != axe);
            //                 let dir_meshes = ax_free_dirs
            //                     .map((ax_dir) => {
            //                         const geo = new THREE.PlaneGeometry(
            //                             1,
            //                             1,
            //                             1
            //                         );
            //                         const plane = new THREE.Mesh(geo);
            //                         plane.position[axe] =
            //                             voxel[axe] - ax_dir / 2;
            //                         other_axes.forEach(
            //                             (oax) =>
            //                                 (plane.position[oax] = voxel[oax])
            //                         );
            //                         plane.rotation[rotate_axe] = Math.PI / 2;
            //                         return plane;
            //                     })
            //                     .reduce((geo, mesh) => {
            //                         geo.mergeMesh(mesh);
            //                         return geo;
            //                     }, new THREE.Geometry());
            //                 return new THREE.Mesh(dir_meshes);
            //             })
            //             .reduce((geo, ax_mesh) => {
            //                 geo.mergeMesh(ax_mesh);
            //                 return geo;
            //             }, new THREE.Geometry());
            //         return new THREE.Mesh(voxel_geo);
            //     })
            //     .reduce((geo, ax_mesh) => {
            //         geo.mergeMesh(ax_mesh);
            //         return geo;
            //     }, new THREE.Geometry());

            // console.log(model_geometry);
            // const material = new THREE.MeshPhongMaterial({
            //     color: 0x555555,
            //     side: THREE.DoubleSide,
            // });
            // const mesh = new THREE.Mesh(model_geometry, material);
            // this.debug_meshes.push(mesh);
            // this.three.scene.add(mesh);
            // let node = { mesh, model };
            // mesh.node = node;
            // return node;
        },
        handle_load_files() {
            this.loaded_files
                .filter((file_name) => !(file_name in this.file_models))
                .forEach((file_name) => {
                    this.file_models[file_name] = [];
                    this.load_vox_file(file_name).models.forEach(
                        (model, index) => {
                            if (index > 0) return;
                            this.file_models[file_name].push(
                                this.create_voxel_geometry(model)
                            );
                        }
                    );
                });
        },
    },
    watch: {
        loaded_files(file_array) {
            this.handle_load_files();
        },
        selected_node(node) {
            if (!node) return (this.select_box.material.opacity = 0);
            let { sx, sy, sz } = node.model.size;
            const sbg = new THREE.BoxGeometry(sx, sz, sy);
            const sbwg = new THREE.WireframeGeometry(sbg);
            this.select_box.geometry = sbwg;
            this.select_box.position.x = sx / 2 - 0.5;
            this.select_box.position.y = sz / 2 - 0.5;
            this.select_box.position.z = sy / 2 - 0.5;
            this.select_box.material.opacity = 0.5;
        },
    },
    mounted() {
        let axisLines = [];

        // ----------- INIT RENDERER

        this.three.renderer = new WebGLRenderer({ antialias: true });
        this.three.renderer.setPixelRatio(window.devicePixelRatio);
        this.three.renderer.setSize(0, 0);
        document
            .getElementById("viewport")
            .appendChild(this.three.renderer.domElement);

        // ----------- INIT CAMERA

        this.three.camera = new PerspectiveCamera(60, 1, 1, 10000);
        this.three.camera.position = new THREE.Vector3(
            -195.68179576891197,
            109.62629615344349,
            147.78795155164678
        );

        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        this.three.renderer.domElement.addEventListener("mouseup", (event) => {
            if (event.button != 0) return;
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

            var intersects = raycaster.intersectObjects(this.debug_meshes);
            let node = intersects[0]?.object.node ?? null;
            this.selected_node = node;
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

        let add_line = (x, y, x1, y1, linewidth = 1, color = 0x202020) => {
            let material = new THREE.LineMaterial({
                color,
                linewidth: linewidth / 1000,
            });
            const points = [x, 0.1, y, x1, 0.1, y1];
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

        add_line(-plane_size / 2, 0, plane_size / 2, 0, 3);
        add_line(0, -plane_size / 2, 0, plane_size / 2, 3);
        for (let line_id = 0; line_id < grid_length; +line_id++) {
            let place = (line_id / (grid_length - 1)) * grid_size - grid_mid;
            add_line(-grid_mid, place, grid_mid, place, 1);
            add_line(place, -grid_mid, place, grid_mid, 1);
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
                this.three.renderer.render(this.three.scene, this.three.camera);
                this.three.controls.update();
            });
        };

        animate();

        this.handle_load_files();
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