<template>

    <div>
        <node-prop
            v-for="(_,prop_name) in props"
            :key="prop_name"
            :obj="props"
            :prop_name="prop_name"
        ></node-prop>
    </div>

</template>

<script>
export default {
    props: ["props"],
    components: load_vue_components(["node-prop"]),
};
</script>

<style>
</style>