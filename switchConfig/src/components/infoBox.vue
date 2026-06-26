<template>
    <div id="info-box">
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
    </div>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";

const _props = defineProps({
	title: String,
	description: String,
});
</script>