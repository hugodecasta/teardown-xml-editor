<template>
    <v-dialog
        v-model="dialog"
        width="500"
        @click:outside="invalidate"
        v-if='node'
    >
        <v-card>
            <v-card-title class="headline lighten-2">
                Adding {{node.type}}
            </v-card-title>

            <v-divider></v-divider>

            <props-view :props="node.props"></props-view>

            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="invalidate">CANCEL</v-btn>
                <v-btn
                    color="primary"
                    @click="validate"
                >OK</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script>
export default {
    components: load_vue_components(["node-tree", "props-view"]),
    props: ["node"],
    data: () => ({
        dialog: true,
    }),
    methods: {
        invalidate() {
            this.$emit("cancel", null);
        },
        validate() {
            this.$emit("ok", this.node);
        },
    },
};
</script>

<style>
</style>