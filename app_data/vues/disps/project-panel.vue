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
        <div class='pa-4'>
            <v-file-input
                label="Project XML"
                prepend-icon=""
                v-model='value.xml_file'
            ></v-file-input>
        </div>
        <template v-if='value.xml_file'>
            <v-divider></v-divider>
            <v-list>
                <node-tree
                    :node="value.nodes[0]"
                    :track_data="track_data"
                >
                </node-tree>
            </v-list>
        </template>

    </v-card>

</template>

<script>
export default {
    props: ["value", "track_data", "add_node"],
    components: load_vue_components(["node-tree"]),
};
</script>

<style>
</style>