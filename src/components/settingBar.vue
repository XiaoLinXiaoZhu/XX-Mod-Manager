<template>
    <div class="OO-setting-bar" v-if="display">
        <h3 v-if="data.t_displayName">{{ data.t_displayName[local] }}</h3>
        <h3 v-else>{{ data.displayName }}</h3>

        <s-switch :checked="data.data" @change="onChange($event.target.checked)"
            v-if="data.type === 'boolean'"></s-switch>
        <s-text-field v-else-if="data.type === 'string'" :value="data.data"
            @input="onChange($event.target.value)"></s-text-field>
        <s-text-field :value="data.data" @input="onChange($event.target.value)"
            v-else-if="data.type === 'number'"></s-text-field>
        <div v-else-if="data.type === 'select'" style="display: flex;flex-direction:row;">
            <div v-for="(option, index) in data.options" :key="index" style="margin-left: 3px;">
                <input type="radio" :name="data.name" :id="option.value" :value="option.value" v-model="data.data">
                <label :for="option.value">
                    <s-chip selectable="true" type="default" :id="option.value" @click="onChange(option.value)">
                        <p>{{ option.t_value ? option.t_value[local] : option.value }}</p>
                    </s-chip>
                </label>
            </div>
        </div>
        <div v-else-if="data.type === 'dir'" class="OO-s-text-field-container">
            <s-text-field :value="data.data" @input="onChange($event.target.value)">
            </s-text-field>
            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                @click="iManager.getFilePath(data.t_displayName ? data.t_displayName[local] : data.displayName, 'directory').then((res) => { data.data = res; onChange(res); })">
                <s-icon type="add"></s-icon>
            </s-icon-button>
        </div>
        <div v-else-if="data.type === 'exePath'" class="OO-s-text-field-container">
            <s-text-field :value="data.data" @input="onChange($event.target.value)">
            </s-text-field>
            <s-icon-button type="filled" slot="start" class="OO-icon-button"
                @click="iManager.getFilePath(data.t_displayName ? data.t_displayName[local] : data.displayName, 'exe').then((res) => { data.data = res; onChange(res); })">
                <s-icon type="add"></s-icon>
            </s-icon-button>
        </div>
        <s-button @click="onChange()" v-else-if="data.type === 'button'">
            {{ data.t_buttonName ? data.t_buttonName[local] : data.buttonName }}
        </s-button>
    </div>
    <div class="OO-setting-bar" v-else>
        <h3 v-if="data.t_displayName">{{ data.t_displayName[local] }}</h3>
        <h3 v-else>{{ data.displayName }}</h3>
    </div>
    <div v-if="data.t_description">
        <p> {{ data.t_description[local] }} </p>
    </div>
    <div v-else-if="data.description !== ''">
        <p> {{ data.description }} </p>
    </div>
</template>

<script setup>
import { ref, defineProps, computed, defineEmits, onMounted } from 'vue';
import IManager from '../../electron/IManager';
const iManager = new IManager();

const props = defineProps({
    data: Object,
});

const data = ref(props.data);
const local = ref(iManager.config.language);
const display = ref(true);

iManager.on('languageChange', (lang) => {
    local.value = lang;
});

// 重新代理 onChange 方法
const emit = defineEmits(['change']);
const onChange = (value) => {
    emit('change', value, data.value.type, data.value);
    const result = data.value.onChange(value);
    // 如果 result 不为 undefined 则说明， 显示的值需要更新
    if (result !== undefined) {
        data.value.data = result;
        // 强制更新
        display.value = false;
        setTimeout(() => {
            display.value = true;
        }, 0);
    }
};

onMounted(() => {
    console.log(data.value);
    // 有的设置项是从 iManager 中获取的，所以需要 刷新一下
    data.value.data = data.value.data
});
</script>