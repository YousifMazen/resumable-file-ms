<script setup>
/**
 * FormDialog Component
 *
 * A reusable modal dialog designed to wrap forms with save/cancel actions.
 */
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

const props = defineProps({
  /** Whether the dialog is visible */
  visible: {
    type: Boolean,
    required: true,
  },
  /** Title of the dialog */
  header: {
    type: String,
    required: true,
  },
  /** Label for the save/submit button */
  saveLabel: {
    type: String,
    default: 'Save',
  },
  /** Label for the cancel button */
  cancelLabel: {
    type: String,
    default: 'Cancel',
  },
  /** Icon for the save button */
  saveIcon: {
    type: String,
    default: 'pi pi-check',
  },
  /** Icon for the cancel button */
  cancelIcon: {
    type: String,
    default: 'pi pi-times',
  },
  /** Whether the save action is currently processing */
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  /** Emitted when the visibility state changes */
  'update:visible',
  /** Emitted when the user clicks the save button */
  'save',
  /** Emitted when the user clicks the cancel button */
  'cancel',
]);

const closeDialog = () => {
  emit('update:visible', false);
};

const onSave = () => {
  emit('save');
};

const onCancel = () => {
  emit('cancel');
  closeDialog();
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="header"
    :modal="true"
    :style="{ width: '40rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <!-- Slot for Form Content -->
    <div class="py-4">
      <slot></slot>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="cancelLabel"
          :icon="cancelIcon"
          class="p-button-text"
          @click="onCancel"
          :disabled="loading"
        />
        <Button
          :label="saveLabel"
          :icon="saveIcon"
          severity="primary"
          @click="onSave"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>
