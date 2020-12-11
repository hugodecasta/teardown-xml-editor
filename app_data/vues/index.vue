<template>
    <v-app>
        <viewport
            v-if='project_data.xml_file'
            :loaded_files="loaded_files"
            :node_map="node_map"
            :track_data="track_data"
        ></viewport>
        <project-panel
            app
            v-model="project_data"
            :track_data="track_data"
        ></project-panel>
        <props-panel
            app
            :node="selected_node"
            :action_buttons="action_buttons"
            @delete="delete_nodes"
        ></props-panel>

        <add-node-panel
            :node="track_data.adding_node"
            @ok='put_node(track_data.adding_node);track_data.adding_node=null'
            @cancel="track_data.adding_node = null"
        ></add-node-panel>

    </v-app>
</template>

<script>
export default {
    // --------------------------------------------------------------- COMPS
    components: load_vue_components([
        "viewport",
        "project-panel",
        "props-panel",
        "add-node-panel",
    ]),
    // --------------------------------------------------------------- DATA
    data: () => ({
        loaded_files: {},
        // ----------------------------------------------- TEMPLATES
        templates: {
            vox: {
                content: null,
                icon: "cube",
                props: {
                    name: "",
                    "object name": "",
                    pos: [0, 0, 0],
                    // rot: [0, 0, 0],
                    "file name": "",
                    prop: true,
                },
            },
            joint: {
                content: null,
                icon: "link",
                props: {
                    pos: [0, 0, 0],
                    rotstrength: 0,
                    size: 1,
                    type: "",
                },
            },
            group: {
                content: [],
                icon: "checkbox-multiple-blank",
                props: {
                    name: "",
                    pos: [0, 0, 0],
                    rot: [0, 0, 0],
                },
            },
        },
        // ----------------------------------------------- PROJECT
        track_data: {
            selected_nodes: [],
            adding_node: null,
        },
        node_map: {},
        // ----------------------------------------------- TRACK
        project_data: {
            xml_file: null,
            nodes: [],
        },
    }),
    // --------------------------------------------------------------- METHODS
    methods: {
        put_node(sub_node) {
            if (!this.selected_node) return;
            this.add_node_to(sub_node, this.selected_node);
            this.track_data.selected_nodes = [sub_node.id];
        },
        add_node_to(node, parent) {
            if (parent.content == null) return;
            node.parent_id = parent.id;
            Vue.set(this.node_map, node.id, node);
            parent.content.push(node);
        },
        put_file(file_path) {
            if (!this.selected_node) return;
            let file_node = this.add_file_to(file_path, this.selected_node);
            this.track_data.selected_nodes = [file_node.id];
        },
        clone_node(node) {
            let sub_node = this.create_node(node.type);
            sub_node.props = clone(node.props);
            console.log(this.node_map[node.parent_id]);
            this.add_node_to(sub_node, this.node_map[node.parent_id]);
            this.track_data.selected_nodes = [sub_node.id];
        },
        add_file_to(file_path, parent) {
            let file_name = file_path.replace(/\\/g, "/").split("/").pop();
            let file_data =
                this.loaded_files[file_name] ??
                vox_reader(fs.readFileSync(file_path));
            let file_node = this.create_node("group");
            Vue.set(this.loaded_files, file_name, file_data);
            file_node.props.name = file_name;
            Object.values(file_data.objects).map((object) => {
                let sub_node = this.create_node("vox");
                sub_node.props.name = object.name;
                sub_node.props["object name"] = object.name;
                sub_node.props["file name"] = file_name;
                sub_node.props.pos = Object.values(object.position);
                this.add_node_to(sub_node, file_node);
            });
            this.add_node_to(file_node, parent);
            return file_node;
        },
        delete_nodes(nodes) {
            for (let node of nodes) {
                if (node.parent_id == null) continue;
                if (node.content) this.delete_nodes(node.content);
                Vue.delete(this.node_map, node.id);
                let parent = this.node_map[node.parent_id];
                let container_index = parent.content.indexOf(node);
                parent.content.splice(container_index, 1);
                let selecteds = this.track_data.selected_nodes;
                let select_index = selecteds.indexOf(node.id);
                if (select_index > -1) {
                    selecteds.splice(select_index, 1);
                    if (!selecteds.includes(node.parent_id))
                        selecteds.push(node.parent_id);
                }
            }
        },
        create_node(type) {
            let node = clone(this.templates[type]);
            node.type = type;
            node.id = uuid();
            return node;
        },
        read_xml() {
            return fs.readFileSync(this.project_data.xml_file.path, "utf8");
        },
        vox_path(file_name) {
            return `${this.vox_dir}/${file_name}`;
        },
        load_vox_file(file_name) {
            let path = this.vox_path(file_name);
            let raw_data = fs.readFileSync(path);
            let vox_data = vox_reader(raw_data);
            return vox_data;
        },
        load_file(path) {
            let data = fs.readFileSync(path);
            this.project_data.nodes = [];
            let base_group = this.create_node("group");
            base_group.props.name = this.project_name;
            this.node_map[base_group.id] = base_group;
            this.project_data.nodes.push(base_group);
            this.track_data.selected_nodes = [];
            this.track_data.selected_nodes.push(base_group.id);
        },
        import(path) {
            let file = { path, data: null };
            this.project_data.xml_file = file;
        },
        action_buttons(node) {
            let actions = {};
            if (node.content) {
                let index = this;
                for (let type in this.templates) {
                    let node_template = this.templates[type];
                    actions[type] = {
                        icon: "plus",
                        action: () => {
                            let cn = index.create_node(type);
                            console.log(
                                type == "vox",
                                node.props.name.includes(".vox")
                            );
                            if (
                                type == "vox" &&
                                node.props.name.includes(".vox")
                            ) {
                                cn.props["file name"] = node.props.name;
                            }
                            index.track_data.adding_node = cn;
                        },
                    };
                }
                actions["import"] = {
                    icon: "file-download",
                    action: async () => {
                        let fileasker = document.createElement("input");
                        fileasker.setAttribute("type", "file");
                        fileasker.click();
                        fileasker.onchange = () => {
                            let file = fileasker.files[0];
                            if (!file) return;
                            let path = file.path;
                            if (!path.includes(this.vox_dir)) {
                                alert(
                                    "you must select a vox file inside the vox directory"
                                );
                                return setTimeout(() => fileasker.click(), 0);
                            }
                            this.put_file(path);
                        };
                    },
                };
            }
            actions["clone"] = {
                icon: "content-copy",
                action: async () => {
                    this.clone_node(node);
                },
            };
            return actions;
        },
    },
    // --------------------------------------------------------------- WATCH
    watch: {
        "project_data.xml_file": function (file) {
            if (!file) {
                this.track_data.selected_nodes = [];
            } else {
                this.load_file(file.path);
            }
        },
    },
    // --------------------------------------------------------------- COMPUTED
    computed: {
        selected_node() {
            if (this.track_data.selected_nodes.length != 1) return null;
            return this.node_map[this.track_data.selected_nodes[0]];
        },
        project_name() {
            return this.vox_dir.replace(/\\/g, "/").split("/").pop();
        },
        vox_dir() {
            return this.project_data.xml_file.path.replace(".xml", "");
        },
        vox_files() {
            return fs.readdirSync(this.vox_dir);
        },
    },
    // --------------------------------------------------------------- MOUNT
    mounted() {
        window.project_data = this.project_data;
        this.import(
            "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom.xml"
        );
        // setTimeout(() => {
        //     this.track_data.selected_nodes = [this.project_data.nodes[0].id];
        //     // this.put_file(
        //     //     "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom\\align.vox"
        //     // );
        //     this.put_file(
        //         "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom\\test_door.vox"
        //     );
        // }, 0);
        // setTimeout(() => {
        //     let joint = this.create_node("joint");
        //     this.put_node(joint);
        // }, 0);
    },
};
</script>

<style>
</style>