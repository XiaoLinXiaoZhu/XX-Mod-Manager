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

// 处理行内格式：链接、强调、斜体
const processInlineFormatting = (text) => {
    // 处理链接 [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // 处理强调 **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // 处理斜体 *text*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    
    // 处理行内代码 `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')

    // 处理红色强调 !text!
    text = text.replace(/!([^!]+)!/g, '<span class="OO-red-text">$1</span>')

    return text
}

const transformMarkdown = (markdown) => {
    let html = ''
    // 忽略末尾的第一个换行符
    if (markdown.endsWith('\n')) {
        markdown = markdown.slice(0, -1)
    }
    // 按行分割markdown文本
    const lines = markdown.split('\n')
    let inList = false
    let inParagraph = false

    lines.forEach(line => {
        if (line.startsWith('# ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            const processedText = processInlineFormatting(line.slice(1).trim())
            html += `<div class="OO-setting-bar" style="font-size:19px;font-weight:1000">${processedText}</div>`
        } else if (line.startsWith('## ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            const processedText = processInlineFormatting(line.slice(2).trim())
            html += `<div class="OO-setting-bar" style="font-size:16px;font-weight:800">${processedText}</div>`
        } else if (line.startsWith('### ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            const processedText = processInlineFormatting(line.slice(3).trim())
            html += `<div class="OO-setting-bar" style="font-size:14px;font-weight:700">${processedText}</div>`
        } else if (line.startsWith('- ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            if (!inList) {
                html += '<ul>'
                inList = true
            }
            const processedText = processInlineFormatting(line.slice(1).trim())
            html += `<li>${processedText}</li>`
        } else if (line.startsWith('> ')) {
            if (inParagraph) {
                html += '</div>'
                inParagraph = false
            }
            const processedText = processInlineFormatting(line.slice(1).trim())
            html += `<div class="OO-quote OO-color-gradient-border">${processedText}</div>`
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
            const processedText = processInlineFormatting(line.trim())
            html += `${processedText}<br>`
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
    if (props.content)
    transformedContent.value = transformMarkdown(props.content)
})

</script>

<style scoped >
.markdown-container{
    /* display: flex; */
    flex-direction: column;
    flex-wrap: nowrap;
}

/* 链接样式 */
.markdown-container :deep(a) {
    color: var(--s-color-primary);
    text-decoration: none;
    transition: color 0.2s ease;
}

.markdown-container :deep(a:hover) {
    color: var(--s-color-secondary);
    text-decoration: underline;
}

/* 强调文本样式 */
.markdown-container :deep(strong) {
    font-weight: bold;
    color: inherit;
}

/* 斜体样式 */
.markdown-container :deep(em) {
    font-style: italic;
    color: inherit;
}

/* 行内代码样式 */
.markdown-container :deep(code) {
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    padding: 0.2em 0.4em;
}

/* 红色强调文本样式 */
.markdown-container :deep(.OO-red-text) {
    color: var(--s-color-error);
    font-weight: bold;
}

/* 引用样式 */
.markdown-container :deep(.OO-quote) {
    border-left: 4px solid var(--s-color-primary);
    padding-left: 12px;
    margin: 8px 12px;
    color: var(--s-color-text-secondary);
}

/* 列表样式优化 */
.markdown-container :deep(ul) {
    margin: 8px 0;
    padding-left: 20px;
}

.markdown-container :deep(li) {
    margin: 4px 0;
    list-style-type: disc;
}
</style>