import DownloadService from '@/service/DownloadService';
import UploadService from '@/service/UploadService';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * @typedef {Object} UploadItem
 * @property {string} id - Unique ID of the upload
 * @property {string} fileName - Name of the file
 * @property {number} progress - Progress percentage (0-100)
 * @property {('uploading'|'paused'|'completed'|'error')} status - Current upload status
 * @property {any} uploadInstance - The TUS/Upload instance for controlling the transfer
 */

/**
 * @typedef {Object} DownloadItem
 * @property {string} id - Unique ID of the download
 * @property {string} fileName - Name of the file
 * @property {number} progress - Progress percentage (0-100)
 * @property {('downloading'|'paused'|'completed'|'error')} status - Current download status
 * @property {any} abortController - The controller for pausing/resuming/aborting the download
 */

/**
 * Store for managing background file transfers (uploads and downloads).
 * Provides state tracking and control methods for resumable transfers.
 */
export const useTransferStore = defineStore('transfer', () => {
  /** @type {import('vue').Ref<Object.<string, UploadItem>>} List of active/recent uploads indexed by ID */
  const uploads = ref({});

  /** @type {import('vue').Ref<Object.<string, DownloadItem>>} List of active/recent downloads indexed by ID */
  const downloads = ref({});

  /** @type {import('vue').Ref<boolean>} Whether the transfer management panel is visible */
  const panelVisible = ref(false);

  /**
   * Toggles the visibility of the transfer management panel.
   */
  const togglePanel = () => {
    panelVisible.value = !panelVisible.value;
  };

  // ---- UPLOADS ----

  /**
   * Starts a new resumable upload.
   * @param {File} file - The file object to upload
   * @param {string} [fileId] - Optional predefined ID for the file
   */
  const startUpload = (file, fileId) => {
    const id = fileId || Date.now().toString(); // unique ID

    // Create new upload state
    uploads.value[id] = {
      id,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
      uploadInstance: null,
    };

    // Trigger network logic
    const instance = UploadService.startUpload(file, {
      onProgress: p => {
        if (uploads.value[id]) uploads.value[id].progress = p;
      },
      onSuccess: () => {
        if (uploads.value[id]) uploads.value[id].status = 'completed';
      },
      onError: () => {
        if (uploads.value[id]) uploads.value[id].status = 'error';
      },
    });

    uploads.value[id].uploadInstance = instance;

    // Automatically show panel to user when a transfer starts
    panelVisible.value = true;

    // Trigger reactivity
    uploads.value = { ...uploads.value };
  };

  /**
   * Pauses an ongoing upload.
   * @param {string} id - The ID of the upload to pause
   */
  const pauseUpload = id => {
    const upload = uploads.value[id];
    if (upload && upload.status === 'uploading') {
      if (upload.uploadInstance && upload.uploadInstance.abort) {
        upload.uploadInstance.abort();
      }
      upload.status = 'paused';
      uploads.value = { ...uploads.value };
    }
  };

  /**
   * Resumes a paused upload.
   * @param {string} id - The ID of the upload to resume
   */
  const resumeUpload = id => {
    const upload = uploads.value[id];
    if (upload && upload.status === 'paused') {
      if (upload.uploadInstance && upload.uploadInstance.start) {
        upload.uploadInstance.start();
      }
      upload.status = 'uploading';
      uploads.value = { ...uploads.value };
    }
  };

  /**
   * Cancels and removes an upload.
   * @param {string} id - The ID of the upload to cancel
   */
  const cancelUpload = id => {
    const upload = uploads.value[id];
    if (upload) {
      if (upload.uploadInstance && upload.uploadInstance.cancel) {
        upload.uploadInstance.cancel();
      }
      delete uploads.value[id];
      uploads.value = { ...uploads.value };
    }
  };

  // ---- DOWNLOADS ----

  /**
   * Starts a new resumable download.
   * @param {Object} fileRecord - The file metadata record
   * @param {string} fileRecord.id - File ID
   * @param {string} [fileRecord.name] - File name
   */
  const startDownload = fileRecord => {
    const id = fileRecord.id || Date.now().toString();

    downloads.value[id] = {
      id,
      fileName: fileRecord.name || 'Unknown File',
      progress: 0,
      status: 'downloading',
      abortController: null,
    };

    const controller = DownloadService.startDownload(id, {
      onProgress: p => {
        if (downloads.value[id]) downloads.value[id].progress = p;
      },
      onSuccess: () => {
        if (downloads.value[id]) downloads.value[id].status = 'completed';
      },
      onError: () => {
        if (downloads.value[id]) downloads.value[id].status = 'error';
      },
    });

    downloads.value[id].abortController = controller;
    panelVisible.value = true;
    downloads.value = { ...downloads.value };
  };

  /**
   * Pauses an ongoing download.
   * @param {string} id - The ID of the download to pause
   */
  const pauseDownload = id => {
    const download = downloads.value[id];
    if (download && download.status === 'downloading') {
      if (download.abortController && download.abortController.pause) {
        download.abortController.pause();
      }
      download.status = 'paused';
      downloads.value = { ...downloads.value };
    }
  };

  /**
   * Resumes a paused download.
   * @param {string} id - The ID of the download to resume
   */
  const resumeDownload = id => {
    const download = downloads.value[id];
    if (download && download.status === 'paused') {
      if (download.abortController && download.abortController.start) {
        download.abortController.start();
      }
      download.status = 'downloading';
      downloads.value = { ...downloads.value };
    }
  };

  /**
   * Cancels and removes a download.
   * @param {string} id - The ID of the download to cancel
   */
  const cancelDownload = id => {
    const download = downloads.value[id];
    if (download) {
      if (download.abortController && download.abortController.abort) {
        download.abortController.abort();
      }
      delete downloads.value[id];
      downloads.value = { ...downloads.value };
    }
  };

  return {
    uploads,
    downloads,
    panelVisible,
    togglePanel,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
  };
});
