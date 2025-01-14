<template>
    
    <!-- <s-dialog id="loading-dialog" size="full">
        <div slot="text" class="container">
            <s-circular-progress indeterminate="true" class="circular-progress"></s-circular-progress>
            <p class="text font-hongmeng" >Loading...</p>
        </div>
    </s-dialog> -->
    <dialogTemplate id="loading-dialog" type="block">
        <template v-slot:content>
            <div class="container">
                <s-circular-progress indeterminate="true" class="circular-progress"></s-circular-progress>
                <p class="text font-hongmeng" >Loading...</p>
            </div>
        </template> 
        <template v-slot:action>
            <div></div>
        </template>
    </dialogTemplate>

</template>

<script setup>
import dialogTemplate from './dialogTemplate.vue';
</script>
<style scoped>
    .circular-progress {
        width: 10vh;
        height: 10vh;
        margin-top: 5vh;
    }

    .container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

    .text {
        margin-top: 20px;
        font-size: 4vh;
        padding: 20px;
    }
</style>