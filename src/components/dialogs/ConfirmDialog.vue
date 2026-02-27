<script setup>
/**
 * ConfirmDialog Component
 *
 * A reusable modal dialog for confirmation actions (e.g., delete confirmation).
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
  /** Message to display in the dialog body */
  message: {
    type: String,
    required: true,
  },
  /** Label for the acceptance button */
  acceptLabel: {
    type: String,
    default: 'Yes',
  },
  /** Label for the rejection button */
  rejectLabel: {
    type: String,
    default: 'No',
  },
  /** Severity color/theme of the accept button (e.g., 'danger', 'primary') */
  severity: {
    type: String,
    default: 'danger',
  },
  /** Icon for the acceptance button */
  acceptIcon: {
    type: String,
    default: 'pi pi-check',
  },
  /** Icon for the rejection button */
  rejectIcon: {
    type: String,
    default: 'pi pi-times',
  },
});

const emit = defineEmits([
  /** Emitted when the visibility state changes */
  'update:visible',
  /** Emitted when the user confirms the action */
  'accept',
  /** Emitted when the user cancels or rejects the action */
  'reject',
]);

const closeDialog = () => {
  emit('update:visible', false);
};

const onAccept = () => {
  emit('accept');
  closeDialog();
};

const onReject = () => {
  emit('reject');
  closeDialog();
};
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="header"
    :modal="true"
    :style="{ width: '30rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="flex items-center justify-center gap-4 py-4">
      <i class="pi pi-exclamation-triangle text-4xl" :class="'text-' + severity + '-500'"></i>
      <span class="text-lg">{{ message }}</span>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="rejectLabel" :icon="rejectIcon" class="p-button-text" @click="onReject" />
        <Button
          :label="acceptLabel"
          :icon="acceptIcon"
          :severity="severity"
          @click="onAccept"
          autofocus
        />
      </div>
    </template>
  </Dialog>
</template>
