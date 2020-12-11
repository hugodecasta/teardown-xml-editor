<template>
    <v-card
        fixed
        left
        :class="[value.xml_file ? 'ma-5' : 'mx-auto mt-5']"
        width="340px"
        :height="value.xml_file ? 'calc(100% - 40px)' : ''"
    >

        <v-list-item>
            <v-list-item-content>
                <v-list-item-title class="title">
                    Project data
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>
        <v-divider></v-divider>

        <template v-if='value.xml_file'>

            <v-list-item>
                <v-btn
                    class='ma-3'
                    :color="track_data.need_save ? 'primary' : 'none'"
                    @click='save()'
                >
                    <v-icon>mdi-content-save</v-icon>
                </v-btn>
                <v-btn class='ma-3'>
                    <v-icon>mdi-folder-open</v-icon>
                </v-btn>
                <v-btn class='ma-3'>
                    <v-icon>mdi-file</v-icon>
                </v-btn>
            </v-list-item>

            <v-divider></v-divider>

            <v-list>
                <node-tree
                    :node="value.nodes[0]"
                    :track_data="track_data"
                >
                </node-tree>
            </v-list>
        </template>
        <v-file-input
            class='pa-3'
            v-else
            v-model="value.xml_file"
        ></v-file-input>

    </v-card>

</template>

<script>
export default {
    props: ["value", "track_data", "add_node", "save"],
    components: load_vue_components(["node-tree"]),
};
</script>

<style>
</style>