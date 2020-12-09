<template>
    <v-app>
        <viewport
            v-if='project_data.xml_file'
            :loaded_files="loaded_files"
            :load_vox_file="load_vox_file"
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
        loaded_files: ["align_test.vox"],
        // ----------------------------------------------- TEMPLATES
        templates: {
            vox: {
                content: null,
                icon: "cube",
                props: {
                    name: "",
                    "object name": "",
                    pos: [0, 0, 0],
                    rot: [0, 0, 0],
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
            if (!this.selected_node || this.selected_node.content == null)
                return;
            sub_node.parent_id = this.selected_node.id;
            this.node_map[sub_node.id] = sub_node;
            this.selected_node.content.push(sub_node);
            this.track_data.selected_nodes = [sub_node.id];
        },
        delete_nodes(nodes) {
            for (let node of nodes) {
                if (node.parent_id == null) continue;
                if (node.content) this.delete_nodes(node.content);
                delete this.node_map[node.id];
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
        import(path) {
            let data = fs.readFileSync(path);
            let file = { path, data };
            this.project_data.xml_file = file;
            this.project_data.nodes = [];
            let base_group = this.create_node("group");
            base_group.props.name = this.project_name;
            this.node_map[base_group.id] = base_group;
            this.project_data.nodes.push(base_group);
            this.track_data.selected_nodes = [];
            this.track_data.selected_nodes.push(base_group.id);
        },
    },
    // --------------------------------------------------------------- WATCH
    watch: {
        "project_data.xml_file": function (file) {
            if (!file) {
                this.track_data.selected_nodes = [];
            }
        },
    },
    // --------------------------------------------------------------- COMPUTED
    computed: {
        action_buttons() {
            let actions = {};
            let index = this;
            for (let type in this.templates) {
                let node_template = this.templates[type];
                actions[type] = {
                    icon: "plus",
                    action: () => {
                        index.track_data.adding_node = index.create_node(type);
                    },
                };
            }
            actions["import"] = {
                icon: "file-download",
                action: () => {
                    alert("COUCOU");
                },
            };
            return actions;
        },
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
    },
};
</script>

<style>
</style>