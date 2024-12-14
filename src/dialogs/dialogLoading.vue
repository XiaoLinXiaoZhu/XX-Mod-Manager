<template>
    <s-dialog id="loading-dialog" size="full">
        <div slot="text" class="container">
            <s-circular-progress indeterminate="true" class="circular-progress"></s-circular-progress>
            <p class="text font-hongmeng" >Loading...</p>
        </div>
    </s-dialog>
</template>

<style scoped>
    .circular-progress {
        width: 20vh;
        height: 20vh;
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