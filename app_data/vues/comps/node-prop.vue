<template>

    <div>
        <v-text-field
            class='ma-4'
            :label="prop_name"
            v-model='obj[prop_name]'
        >
        </v-text-field>
    </div>

</template>

<script>
export default {
    props: ["obj", "prop_name"],
};
</script>

<style>
</style>