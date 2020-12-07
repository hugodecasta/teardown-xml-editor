<template>
    <div id='viewport'></div>
</template>

<script>
export default {
    data: () => ({
        three: {
            renderer: null,
            camera: null,
            controls: null,
            scene: null,
        },
    }),
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

        // ----------- INIT CONTROLS

        this.three.controls = new OrbitControls(
            this.three.camera,
            this.three.renderer.domElement
        );
        this.three.controls.maxPolarAngle = Math.PI * 0.5;
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

        // sky = new THREE.Sky();
        // sky.scale.setScalar(450000);
        // this.three.scene.add(sky);

        // const uniforms = sky.material.uniforms;
        // uniforms["turbidity"].value = 10;
        // uniforms["rayleigh"].value = 3;
        // uniforms["mieCoefficient"].value = 0.005;
        // uniforms["mieDirectionalG"].value = 0.7;

        // let sun = new THREE.Vector3();
        // const theta = Math.PI * (0.3 - 0.5);
        // const phi = 2 * Math.PI * (0.25 - 0.5);
        // sun.x = Math.cos(phi);
        // sun.y = Math.sin(phi) * Math.sin(theta);
        // sun.z = Math.sin(phi) * Math.cos(theta);
        // uniforms["sunPosition"].value.copy(sun);

        // state.scene.fog = new FogExp2(0xcccccc, 0.002);
        // var geometry = new CylinderBufferGeometry(0, 10, 30, 3, 1);
        // var material = new MeshPhongMaterial({
        //     color: 0xffffff,
        //     flatShading: true,
        // });
        // for (var i = 0; i < 500; i++) {
        //     var mesh = new Mesh(geometry, material);
        //     mesh.position.x = (Math.random() - 0.5) * 1000;
        //     mesh.position.y = (Math.random() - 0.5) * 1000;
        //     mesh.position.z = (Math.random() - 0.5) * 1000;
        //     mesh.updateMatrix();
        //     mesh.matrixAutoUpdate = false;
        //     state.pyramids.push(mesh);
        // }
        // state.scene.add(...state.pyramids);
        // lights

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
        this.three.scene.add(lightC);

        // ----------- AXIS

        // // Axis Line 1
        // var materialB = new LineBasicMaterial({ color: 0x0000ff });
        // var geometryB = new Geometry();
        // geometryB.vertices.push(new Vector3(0, 0, 0));
        // geometryB.vertices.push(new Vector3(0, 1000, 0));
        // var lineA = new Line(geometryB, materialB);
        // axisLines.push(lineA);
        // // Axis Line 2
        // var materialC = new LineBasicMaterial({ color: 0x00ff00 });
        // var geometryC = new Geometry();
        // geometryC.vertices.push(new Vector3(0, 0, 0));
        // geometryC.vertices.push(new Vector3(1000, 0, 0));
        // var lineB = new Line(geometryC, materialC);
        // axisLines.push(lineB);
        // // Axis 3
        // var materialD = new LineBasicMaterial({ color: 0xff0000 });
        // var geometryD = new Geometry();
        // geometryD.vertices.push(new Vector3(0, 0, 0));
        // geometryD.vertices.push(new Vector3(0, 0, 1000));
        // var lineC = new Line(geometryD, materialD);
        // axisLines.push(lineC);
        // this.three.scene.add(...axisLines);

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