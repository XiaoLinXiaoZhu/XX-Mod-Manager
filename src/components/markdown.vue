<!-- 
* @Author: XLXZ
* @Description: 这是一个用于将markdown文本转换为我的自定义格式的组件

* @input: content: markdown文本
* @output: 无
* @function: 无
* -->

<template>
    <div class="markdown-container" v-html="transformedContent">
    </div>
    <slot></slot>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
    content: {
        type: String,
        required: true
    }
})

const transformedContent = ref('')

const transformMarkdown = (markdown) => {
    let html = ''
    const lines = markdown.split('\n')
    let inList = false
    let inParagraph = false

    lines.forEach(line => {
        if (line.startsWith('# ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            html += `<div class="OO-setting-bar" style="font-size:19px;font-weight:1000">${line.slice(1).trim()}</div>`
        } else if (line.startsWith('- ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            if (!inList) {
                html += '<ul>'
                inList = true
            }
            html += `<li>${line.slice(1).trim()}</li>`
        } else if (line.startsWith('> ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            html += `<div class="OO-quote">${line.slice(1).trim()}</div>`
        } else if (line.trim() === '---') {
            if (inList) {
                html += '</ul>'
                inList = false
            }
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            html += '<s-divider style="margin:16px 0"></s-divider>'
        } else if (line.trim() === '') {
            if (inList) {
                html += '</ul>'
                inList = false
            }
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            html += '<br>'
        } else {
            if (inList) {
                html += '</ul>'
                inList = false
            }
            if (!inParagraph) {
                html += '<div class="OO-box OO-shade-box" style="line-height: 1.5;">'
                inParagraph = true
            }
            html += `${line.trim()}<br>`
        }
    })

    if (inList) {
        html += '</ul>'
    }
    if (inParagraph) {
        html = html.slice(0, -4) + '</div>' // Remove the last <br> and close the div
    }

    return html
}

onMounted(() => {
    transformedContent.value = transformMarkdown(props.content)
})

</script>

<style scoped>
.markdown-container{
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
}
</style>