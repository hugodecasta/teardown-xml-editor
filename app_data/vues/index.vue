<template>
    <v-app>

        <v-card>
            <v-navigation-drawer
                permanent
                app
            >
            </v-navigation-drawer>
        </v-card>

        <viewport />

    </v-app>
</template>

<script>
export default {
    // --------------------------------------------------------------- COMPS
    components: load_vue_components(["viewport"]),
    // --------------------------------------------------------------- DATA
    data: () => ({
        project_data: {
            td_create_dir: "G:/steam_content/steamapps/common/Teardown/create",
            td_world_name: "custom",
        },
    }),
    // --------------------------------------------------------------- METHODS
    methods: {
        read_xml() {
            return fs.readFileSync(this.xml_path, "utf8");
        },
    },
    // --------------------------------------------------------------- COMPUTED
    computed: {
        xml_path() {
            return `${this.project_data.td_create_dir}/${this.project_data.td_world_name}.xml`;
        },
        vox_dir() {
            return `${this.project_data.td_create_dir}/${this.project_data.td_world_name}`;
        },
        vox_files() {
            return fs.readdirSync(this.vox_dir);
        },
    },
    // --------------------------------------------------------------- MOUNT
    mounted() {},
};
</script>

<style>
</style>