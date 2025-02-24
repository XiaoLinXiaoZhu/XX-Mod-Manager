<template>
    <div id="info-box">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
    </div>
</template>

<script lang="ts" setup>
import { ref, defineProps } from 'vue'
const props = defineProps({
    title: String,
    description: String
})

</script>