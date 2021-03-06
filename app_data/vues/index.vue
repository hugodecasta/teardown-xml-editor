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
            :save="save"
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
                    object: "",
                    pos: [0, 0, 0],
                    file: "",
                    prop: "true",
                },
            },
            joint: {
                content: null,
                icon: "link",
                props: {
                    pos: [0, 0, 0],
                    rot: [0, 0, 0],
                    type: "ball",
                    size: 1,
                    rotstrength: 0,
                },
            },
            environment: {
                content: null,
                icon: "white-balance-sunny",
                props: {
                    template: "sunny",
                },
            },
            voxbox: {
                icon: "cube-outline",
                content: null,
                props: {
                    pos: [-1000, 1000, -1],
                    size: [20000, 10, 20000],
                },
            },
            script: {
                icon: "language-lua",
                content: null,
                props: {
                    file: "",
                },
            },
            body: {
                content: [],
                icon: "code-tags",
                props: {},
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
            need_save: false,
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
        clone_node(node, parent_id = node.parent_id) {
            let sub_node = this.create_node(node.type);
            sub_node.props = clone(node.props);
            this.add_node_to(sub_node, this.node_map[parent_id]);
            if (node.content) {
                sub_node.content = node.content.map((cont_node) =>
                    this.clone_node(cont_node, sub_node.id)
                );
            }
            this.track_data.selected_nodes = [sub_node.id];
            return sub_node;
        },
        get_vox_file(file_name) {
            if (!this.loaded_files[file_name]) {
                Vue.set(
                    this.loaded_files,
                    file_name,
                    this.load_vox_file(file_name)
                );
            }
            return this.loaded_files[file_name];
        },
        add_file_to(file_path, parent) {
            let file_name = file_path.replace(/\\/g, "/").split("/").pop();
            let file_data = this.get_vox_file(file_name);
            let file_node = this.create_node("group");
            file_node.props.name = file_name;
            Object.values(file_data.objects).map((object) => {
                let sub_node = this.create_node("vox");
                sub_node.props.name = object.name;
                sub_node.props["object"] = object.name;
                sub_node.props["file"] = file_name;
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
            let xmldata = JSON.parse(XMLto(fs.readFileSync(path))).elements[0];
            let scene_nodes = xmldata.elements;

            console.log(scene_nodes);

            this.project_data.nodes = [];

            let body = this.create_node("body");
            this.node_map[body.id] = body;
            this.project_data.nodes.push(body);

            let parse_node = (xmlnode, true_parent) => {
                let { name: type, elements, attributes } = xmlnode;
                elements ||= [];
                if (type == "vox") {
                    let file_name = attributes.file.replace("LEVEL/", "");
                    this.get_vox_file(file_name);
                }
                let true_node = this.create_node(type);
                for (let attr_name in attributes) {
                    let value = attributes[attr_name];
                    if (["pos", "rot", "size"].includes(attr_name)) {
                        value = value.split(" ").map((c) => parseFloat(c) * 10);
                        if (attr_name == "pos") {
                            let [x, y, z] = value;
                            value = [x, -z, y];
                        } else if (attr_name == "rot") {
                            let [x, y, z] = value.map(
                                (v) => (v / 10 / 180) * Math.PI
                            );
                            value = [x, z, y];
                        }
                    } else if (attr_name == "file") {
                        value = value.replace("LEVEL/", "");
                    }
                    attributes[attr_name] = value;
                    true_node.props[attr_name] = value;
                }
                this.add_node_to(true_node, true_parent);
                elements.forEach((sub_node) => parse_node(sub_node, true_node));
            };

            scene_nodes.forEach((node) => parse_node(node, body));

            // let env = this.create_node("environment");
            // let box_body = this.create_node("body");

            // this.add_node_to(env, body);
            // this.add_node_to(box_body, body);

            // let floor_box = this.create_node("voxbox");
            // this.add_node_to(floor_box, box_body);

            // let main_body = this.create_node("body");
            // this.add_node_to(main_body, body);

            // let main_script = this.create_node("script");
            // main_script.props.file = "../../data/script/main.lua";
            // this.add_node_to(main_script, body);

            this.track_data.selected_nodes = [];
            // this.track_data.selected_nodes.push(main_body.id);
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
        save() {
            this.track_data.need_save = false;
            let node2xml = (node) => {
                let props = clone(node.props);
                for (let prop_name in props) {
                    let value = props[prop_name];
                    if (prop_name == "rot") {
                        value =
                            typeof value == "string"
                                ? value.split(",").map((v) => parseFloat(v))
                                : value;
                        let [x, y, z] = value.map(
                            (val) => (val / Math.PI) * 180 * 10
                        );
                        value = [y, z, -x];
                    }
                    if (prop_name == "pos") {
                        let [x, y, z] = value;
                        value = [x, z, -y];
                    }
                    if (typeof value == "number") {
                        value = value / 10;
                    }
                    if (Array.isArray(value)) {
                        value = value.map((nb) => nb / 10).join(" ");
                    }
                    if (prop_name == "file") value = "LEVEL/" + value;
                    props[prop_name] = value;
                }
                let node_xml = {
                    _name: node.type,
                    _attrs: props,
                };
                if (node.content) {
                    node_xml._content = node.content.map((sub_node) =>
                        node2xml(sub_node)
                    );
                }
                return node_xml;
            };
            const xml_data = base_xml(
                node2xml(this.project_data.nodes[0])._content
            );
            const final_xml = toXML(xml_data, {
                header: false,
                indent: "   ",
            });
            fs.writeFileSync(
                this.project_data.xml_file.path,
                final_xml,
                "utf8"
            );
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
        node_map: {
            handler() {
                this.track_data.need_save = true;
            },
            deep: true,
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
        setTimeout(() => {
            // this.track_data.selected_nodes = [this.project_data.nodes[0].id];
            // this.put_file(
            //     "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom\\align.vox"
            // );
            // this.put_file(
            //     "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom\\tars.vox"
            // );
            // this.put_file(
            //     "G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom\\computer.vox"
            // );
        }, 0);
        // setTimeout(() => {
        //     let joint = this.create_node("joint");
        //     this.put_node(joint);
        // }, 0);
    },
};
</script>

<style>
</style>