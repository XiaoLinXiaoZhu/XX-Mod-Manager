<script setup>
import 'sober/card'
const props = defineProps({
    mod: String,
    character: String,
    description: String,
    image: String,
    hotKeys: () => []
})


</script>


<template>
    <s-card class="mod-item" clicked="false" clickable="true" :id="props.mod" inWindow="false" :character="props.character">
        <div slot="image" style="height: 200px;">
            <img :src="props.image" alt="mod image" />
        </div>
        <div slot="headline" id="mod-item-headline">{{ props.mod }}</div>
        <div slot="subhead" id="mod-item-subhead">{{ props.character }}</div>
        <div slot="text" id="mod-item-text">
            <s-scroll-view>
                <p id="mod-hotkeys">Hotkeys: {{ props.hotKeys.join(', ') }}</p>
                <p id="mod-item-description">{{ props.description }}</p>
                <div class="placeholder"></div>
            </s-scroll-view>
        </div>
    </s-card>
</template>


<style scoped>


</style>