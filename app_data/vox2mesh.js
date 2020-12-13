function vox2mesh(model) {
    let { size, voxels } = model
    let { sx, sy, sz } = model.size;

    let logger_name = `vox2mesh time - ${voxels.length} voxels`
    console.time(logger_name)

    // ---- setup space
    let occupation_map = Array(sx * sy * sz).fill(-1)

    // ---- setup space methods
    let coord_to_index = (x, y, z) => y * (sz * sx) + z * (sx) + x
    let set_occupied = (x, y, z, i) => occupation_map[coord_to_index(x, y, z)] = i
    let occupied = (x, y, z, i) => {
        if (Math.min(x, y, z) < 0 || x >= sx || y >= sy || z >= sz) return false;
        return occupation_map[coord_to_index(x, y, z)] == i
    }

    // ---- set occupied spaces
    voxels.forEach(voxel => {
        let { x, y, z, i } = voxel
        set_occupied(x, y, z, i)
    });

    // ---- base geometry
    let model_geometry = new THREE.Geometry();

    // ---- base geometry
    let rotation = Array.from('yxz')
    voxels.forEach(voxel => {
        let { x, y, z, i } = voxel

        let faces = [
            [[x - 1, y, z], [x - 0.5, y, z]],
            [[x + 1, y, z], [x + 0.5, y, z]],
            [[x, y - 1, z], [x, y - 0.5, z]],
            [[x, y + 1, z], [x, y + 0.5, z]],
            [[x, y, z - 1], [x, y, z - 0.5]],
            [[x, y, z + 1], [x, y, z + 0.5]],
        ]
            .map((coords, index) => ({ coords, index }))
            .filter(dat => !occupied(...dat.coords[0], i))
            .forEach(dat => {
                let { coords: [[], [px, py, pz]], index } = dat
                const geo = new THREE.PlaneGeometry(1, 1, 1);
                const plane = new THREE.Mesh(geo);

                let rot_axes = rotation[Math.trunc(index / 2)]
                plane.rotation[rot_axes] = Math.PI / 2;
                plane.updateMatrix();
                plane.position.x = px + 0.5 - Math.trunc(sx / 2);
                plane.position.y = py + 0.5;
                plane.position.z = pz + 0.5 - Math.trunc(sz / 2);
                plane.updateMatrix();

                model_geometry.merge(
                    plane.geometry,
                    plane.matrix,
                    i - 1
                );
            })


    })

    // voxels.forEach((voxel) => {
    //     let { x, y, z, i } = voxel;
    //     let coord_arr = [x, y, z, i];
    //     let unfree_spaces = voxels
    //         .map((other_voxel) => {
    //             if (other_voxel == voxel) return [];
    //             let { x: ox, y: oy, z: oz, i: oi } = other_voxel;
    //             // using oi to display if indexes are different
    //             let o_coord_arr = [ox, oy, oz, oi];
    //             return o_coord_arr.map(
    //                 (co, index) => coord_arr[index] - co
    //             );
    //         })
    //         .filter((e) => e)
    //         .filter(
    //             (vox_d) =>
    //                 vox_d.reduce((a, b) => a + Math.abs(b), 0) == 1
    //         )
    //         .reduce(
    //             (space_taken, vox_d) => {
    //                 vox_d.forEach((dif, index) =>
    //                     space_taken[index].push(dif)
    //                 );
    //                 return space_taken;
    //             },
    //             [[], [], [], []]
    //         );
    //     let free_space = [
    //         [-1, 1],
    //         [-1, 1],
    //         [-1, 1],
    //     ].map((free, ax) =>
    //         free.filter((dir) => !unfree_spaces[ax].includes(dir))
    //     );
    //     let axes = Array.from("xyz");
    //     let rotate_axes = Array.from("yxz");
    //     free_space.forEach((ax_free_dirs, ax) => {
    //         let axe = axes[ax];
    //         let rotate_axe = rotate_axes[ax];
    //         let other_axes = axes.filter((ax) => ax != axe);

    //         ax_free_dirs.forEach((ax_dir) => {
    //             const geo = new THREE.PlaneGeometry(1, 1, 1);
    //             const plane = new THREE.Mesh(geo);
    //             plane.position[axe] = voxel[axe] - ax_dir / 2;
    //             other_axes.forEach(
    //                 (oax, index) => (plane.position[oax] = voxel[oax])
    //             );
    //             plane.rotation[rotate_axe] = Math.PI / 2;
    //             plane.updateMatrix();
    //             plane.position.x += 0.5 - Math.trunc(sx / 2);
    //             plane.position.z += 0.5 - Math.trunc(sz / 2);
    //             plane.position.y += 0.5;
    //             plane.updateMatrix();

    //             model_geometry.merge(
    //                 plane.geometry,
    //                 plane.matrix,
    //                 voxel.i - 1
    //             );
    //         });
    //     });
    // });


    console.timeEnd(logger_name)
    return model_geometry

}