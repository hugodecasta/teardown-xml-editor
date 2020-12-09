<template>
    <div class="ml-2">
        <v-btn
            class="ma-1"
            :color="selected ? 'primary' : ''"
            @click="selected ? track_data.selected_nodes=[] : track_data.selected_nodes=[node.id]"
        >
            <v-icon left>{{icon}}</v-icon>{{name}}<v-icon
                right
                v-if="node.content!==null"
            >{{opened ? 'mdi-menu-up': 'mdi-menu-down'}}</v-icon>
        </v-btn>
        <v-card
            class="pa-3 ma-2"
            color="info"
            elevation="3"
            v-if="node.content !== null && opened"
        >
            <node-tree
                v-for="sub_node in node.content"
                :key="sub_node.id"
                :node="sub_node"
                :track_data="track_data"
            ></node-tree>
        </v-card>
    </div>
</template>

<script>
export default {
    props: ["node", "track_data"],
    components: load_vue_components(["node-tree"]),
    computed: {
        selected() {
            return this.track_data.selected_nodes.includes(this.node.id);
        },
        opened() {
            let check_childs = (node) => {
                if (this.track_data.selected_nodes.includes(node.id))
                    return true;
                for (let child of node.content ?? []) {
                    let res = check_childs(child);
                    if (res) return true;
                }
                return false;
            };
            return check_childs(this.node);
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