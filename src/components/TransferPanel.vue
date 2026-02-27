<script setup>
/**
 * TransferPanel Component
 *
 * A non-modal, draggable dialog that displays the progress of background transfers (uploads and downloads).
 * It connects to the TransferStore to provide users with controls to pause, resume, or cancel transfers.
 */
import { useTransferStore } from '@/stores/TransferStore';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressBar from 'primevue/progressbar';

const transferStore = useTransferStore();
const { uploads, downloads } = storeToRefs(transferStore);

const { pauseUpload, resumeUpload, cancelUpload, pauseDownload, resumeDownload, cancelDownload } =
  transferStore;
</script>

<template>
  <Dialog
    v-model:visible="transferStore.panelVisible"
    header="Transfers"
    :modal="false"
    :draggable="true"
    :dismissableMask="false"
    position="bottomright"
    :style="{ width: '400px', margin: '2rem', zIndex: 9999 }"
    :showHeader="true"
    class="border border-surface-200 dark:border-surface-700 shadow-xl"
    :pt="{
      mask: { style: { pointerEvents: 'none', backgroundColor: 'transparent' } },
      root: { style: { pointerEvents: 'auto' } },
    }"
  >
    <div class="flex flex-col gap-4 max-h-100 overflow-y-auto pr-2 mt-2">
      <!-- Uploads -->
      <div v-if="Object.keys(uploads).length > 0">
        <div class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
          Uploads
        </div>
        <div
          v-for="upload in uploads"
          :key="upload.id"
          class="flex flex-col gap-1 p-3 rounded-md bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 mb-2 shadow-sm"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-sm truncate max-w-50" :title="upload.fileName">
              <i class="pi pi-upload text-warn-500 mr-2"></i>{{ upload.fileName }}
            </span>
            <div class="flex gap-1">
              <Button
                v-if="upload.status === 'uploading'"
                icon="pi pi-pause"
                text
                rounded
                size="small"
                @click="pauseUpload(upload.id)"
              />
              <Button
                v-if="upload.status === 'paused'"
                icon="pi pi-play"
                text
                rounded
                size="small"
                @click="resumeUpload(upload.id)"
              />
              <Button
                icon="pi pi-times"
                text
                rounded
                size="small"
                severity="danger"
                @click="cancelUpload(upload.id)"
              />
            </div>
          </div>
          <div class="flex justify-between items-center text-xs text-surface-500 font-medium">
            <span class="capitalize">{{ upload.status }}</span>
            <span>{{ upload.progress || 0 }}%</span>
          </div>
          <ProgressBar
            :value="upload.progress || 0"
            :showValue="false"
            style="height: 6px"
          ></ProgressBar>
        </div>
      </div>

      <!-- Downloads -->
      <div v-if="Object.keys(downloads).length > 0">
        <div class="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 mt-2">
          Downloads
        </div>
        <div
          v-for="download in downloads"
          :key="download.id"
          class="flex flex-col gap-1 p-3 rounded-md bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 mb-2 shadow-sm"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-sm truncate max-w-50" :title="download.fileName">
              <i class="pi pi-download text-info-500 mr-2"></i>{{ download.fileName }}
            </span>
            <div class="flex gap-1">
              <Button
                v-if="download.status === 'downloading'"
                icon="pi pi-pause"
                text
                rounded
                size="small"
                @click="pauseDownload(download.id)"
              />
              <Button
                v-if="download.status === 'paused'"
                icon="pi pi-play"
                text
                rounded
                size="small"
                @click="resumeDownload(download.id)"
              />
              <Button
                icon="pi pi-times"
                text
                rounded
                size="small"
                severity="danger"
                @click="cancelDownload(download.id)"
              />
            </div>
          </div>
          <div class="flex justify-between items-center text-xs text-surface-500 font-medium">
            <span class="capitalize">{{ download.status }}</span>
            <span>{{ download.progress || 0 }}%</span>
          </div>
          <ProgressBar
            :value="download.progress || 0"
            :showValue="false"
            style="height: 6px"
          ></ProgressBar>
        </div>
      </div>

      <div
        v-if="Object.keys(uploads).length === 0 && Object.keys(downloads).length === 0"
        class="flex flex-col items-center justify-center p-6 text-surface-400"
      >
        <i class="pi pi-check-circle text-4xl mb-3"></i>
        <span>No active transfers</span>
      </div>
    </div>
  </Dialog>
</template>
