<template>

    <v-navigation-drawer
        fixed
        right
        v-model='open'
        :disabled="!open"
    >
        <template v-if='node'>

            <v-list-item>
                <v-list-item-content>
                    <v-list-item-title class="title">
                        <v-icon>{{icon}}</v-icon>
                        {{name}}
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>

            <v-divider></v-divider>

            <v-btn
                class='ma-3 secondary'
                v-for="(data, name) in display_buttons"
                :key="name"
                @click='data.action()'
            >
                <v-icon left>mdi-{{data.icon}}</v-icon>{{name}}
            </v-btn>

            <v-divider></v-divider>

            <props-view :props="node.props"></props-view>

            <template v-if='node.parent_id != null'>
                <v-divider></v-divider>

                <v-btn
                    class='ma-3'
                    color="error"
                    @click='$emit("delete",[node])'
                >
                    <v-icon left>mdi-delete</v-icon>delete
                </v-btn>
            </template>

        </template>

    </v-navigation-drawer>

</template>

<script>
export default {
    props: ["node", "action_buttons"],
    components: load_vue_components(["node-tree", "props-view"]),
    data: () => ({
        open: false,
    }),
    mounted() {
        this.open = this.node != null;
    },
    watch: {
        node(node) {
            this.open = node != null;
        },
    },
    computed: {
        template() {
            if (!this.node) return null;
            return this.templates.nodes[this.node.type];
        },
        display_buttons() {
            return this.action_buttons(this.node);
        },
        icon() {
            return `mdi-${this.node.icon}`;
        },
        name() {
            let name = this.node.props.name;
            let has_name = name !== undefined;
            let type = this.node.type;
            return has_name ? (name ? name : `untitled ${type}`) : type;
        },
    },
};
</script>

<style>
</style>