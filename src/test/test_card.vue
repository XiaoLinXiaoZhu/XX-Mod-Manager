<script setup>
import modCard from '../components/modCard.vue'
import { Group } from '@tweenjs/tween.js';
import { setAnimationGroup } from '../components/modCard.vue';

const AnimationGroup = new Group();
setAnimationGroup(AnimationGroup);
</script>

<template>
  <div>
    <modCard mod="mod" character="character" description="description" image="../src/assets/default.png" :hotKeys="['a', 'b', 'c']" />
  </div>
</template>

<style scoped>
</style>
