<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Selection } from '@tiptap/pm/state';
import { NButton, NDivider, NTooltip } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
  }>(),
  {
    value: '',
    placeholder: '请输入正文内容...',
    disabled: false,
    minHeight: '200px'
  }
);

const emit = defineEmits<{
  (e: 'update:value', val: string): void;
}>();

const editor = useEditor({
  content: props.value,
  editable: !props.disabled,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: () => props.placeholder
    })
  ],
  editorProps: {
    handleClick(view) {
      if (view.state.doc.textContent.length === 0) {
        const { tr } = view.state;
        view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(1))));
        return true;
      }
      return false;
    }
  },
  onUpdate: ({ editor: instance }) => {
    const html = instance.getHTML();
    emit('update:value', html === '<p></p>' ? '' : html);
  }
});

// 外部 v-model 及禁用状态监听
watch(
  () => props.value,
  val => {
    if (editor.value && editor.value.getHTML() !== val) {
      editor.value.commands.setContent(val || '', { emitUpdate: false });
    }
  }
);

watch(
  () => props.disabled,
  val => editor.value?.setEditable(!val)
);

onBeforeUnmount(() => editor.value?.destroy());

// 工具栏配置
const toolbarButtons = computed(() => {
  if (!editor.value) return [];
  const ed = editor.value;
  const c = () => ed.chain().focus();
  return [
    {
      key: 'undo',
      label: '↩ 撤销',
      tooltip: '撤销 (Ctrl+Z)',
      disabled: !ed.can().undo(),
      action: () => c().undo().run()
    },
    {
      key: 'redo',
      label: '↪ 恢复',
      tooltip: '恢复 / 重做 (Ctrl+Y)',
      disabled: !ed.can().redo(),
      action: () => c().redo().run()
    },
    { type: 'divider' },
    {
      key: 'h1',
      label: 'H1',
      tooltip: '一级标题',
      active: ed.isActive('heading', { level: 1 }),
      action: () => c().toggleHeading({ level: 1 }).run()
    },
    {
      key: 'h2',
      label: 'H2',
      tooltip: '二级标题',
      active: ed.isActive('heading', { level: 2 }),
      action: () => c().toggleHeading({ level: 2 }).run()
    },
    {
      key: 'h3',
      label: 'H3',
      tooltip: '三级标题',
      active: ed.isActive('heading', { level: 3 }),
      action: () => c().toggleHeading({ level: 3 }).run()
    },
    { type: 'divider' },
    {
      key: 'bold',
      label: 'B',
      tooltip: '加粗',
      active: ed.isActive('bold'),
      class: 'font-bold',
      action: () => c().toggleBold().run()
    },
    {
      key: 'italic',
      label: 'I',
      tooltip: '斜体',
      active: ed.isActive('italic'),
      class: 'italic font-serif',
      action: () => c().toggleItalic().run()
    },
    {
      key: 'strike',
      label: 'S',
      tooltip: '删除线',
      active: ed.isActive('strike'),
      class: 'line-through',
      action: () => c().toggleStrike().run()
    },
    {
      key: 'code',
      label: '<>',
      tooltip: '行内代码',
      active: ed.isActive('code'),
      action: () => c().toggleCode().run()
    },
    { type: 'divider' },
    {
      key: 'bullet',
      label: '• 列表',
      tooltip: '无序列表',
      active: ed.isActive('bulletList'),
      action: () => c().toggleBulletList().run()
    },
    {
      key: 'ordered',
      label: '1. 列表',
      tooltip: '有序列表',
      active: ed.isActive('orderedList'),
      action: () => c().toggleOrderedList().run()
    },
    {
      key: 'quote',
      label: '“ 引用',
      tooltip: '引用块',
      active: ed.isActive('blockquote'),
      action: () => c().toggleBlockquote().run()
    },
    { type: 'divider' },
    {
      key: 'clear',
      label: '🧹 清除格式',
      tooltip: '清除当前所选文字的格式',
      action: () => c().unsetAllMarks().clearNodes().run()
    }
  ];
});

const handleContainerClick = (e: MouseEvent) => {
  if (editor.value && !props.disabled && !(e.target as HTMLElement).closest('.ProseMirror')) {
    editor.value.commands.focus(editor.value.isEmpty ? 'start' : 'end');
  }
};
</script>

<template>
  <div
    class="tiptap-editor-wrapper rounded-8px border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-#18181c transition-all duration-200 flex flex-col w-full overflow-hidden"
    :class="{ 'opacity-60 cursor-not-allowed': disabled }"
  >
    <!-- 工具栏 -->
    <div
      v-if="editor && !disabled"
      class="flex flex-wrap items-center gap-4px p-6px border-b border-gray-200 dark:border-gray-700/80 bg-gray-50/80 dark:bg-#23232a/60 select-none"
    >
      <template v-for="(btn, idx) in toolbarButtons" :key="idx">
        <NDivider v-if="btn.type === 'divider'" vertical class="mx-2px" />
        <NTooltip v-else trigger="hover">
          <template #trigger>
            <NButton
              size="tiny"
              :type="btn.active ? 'primary' : 'default'"
              :secondary="!btn.active"
              :quaternary="btn.disabled || (!btn.active && ['undo', 'redo', 'clear'].includes(btn.key!))"
              :disabled="btn.disabled"
              :class="btn.class"
              @click="btn.action"
            >
              {{ btn.label }}
            </NButton>
          </template>
          {{ btn.tooltip }}
        </NTooltip>
      </template>
    </div>

    <!-- 编辑器主体 -->
    <div
      class="editor-body p-12px flex-1 overflow-y-auto cursor-text"
      :style="{ minHeight }"
      @click="handleContainerClick"
    >
      <EditorContent :editor="editor" class="tiptap-content-container h-full" />
    </div>
  </div>
</template>

<style scoped>
:deep(.tiptap-content-container .ProseMirror) {
  min-height: v-bind(minHeight);
  outline: none !important;
  font-size: 14px;
  line-height: 1.6;

  & p.is-editor-empty:first-child::before {
    color: #a0aec0;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }

  & h1 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0.75rem 0 0.4rem;
  }
  & h2 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0.6rem 0 0.3rem;
  }
  & h3 {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0.5rem 0 0.2rem;
  }
  & ul {
    list-style-type: disc;
    padding-left: 1.2rem;
    margin: 0.4rem 0;
  }
  & ol {
    list-style-type: decimal;
    padding-left: 1.2rem;
    margin: 0.4rem 0;
  }
  & blockquote {
    border-left: 3px solid #3b82f6;
    padding-left: 0.75rem;
    margin: 0.5rem 0;
    color: #64748b;
    font-style: italic;
  }
  & code {
    background-color: rgba(120, 120, 120, 0.15);
    padding: 0.15rem 0.35rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875em;
  }
}
</style>
