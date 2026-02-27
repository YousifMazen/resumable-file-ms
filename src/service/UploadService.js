class UploadService {
  /**
   * Mock implementation for starting an upload.
   * This will later integrate with tus-js-client.
   *
   * @param {File} file
   * @param {Object} callbacks - { onProgress, onSuccess, onError }
   * @returns {Object} A mock upload instance
   */
  startUpload(file, callbacks) {
    console.log(`[UploadService] Starting upload for ${file.name}`);

    const state = {
      progress: 0,
      interval: null,
      aborted: false,
      paused: false,
    };

    const run = () => {
      state.interval = setInterval(() => {
        if (state.aborted || state.paused) {
          clearInterval(state.interval);
          return;
        }
        state.progress += Math.floor(Math.random() * 10) + 5;
        if (state.progress >= 100) {
          state.progress = 100;
          clearInterval(state.interval);
          if (callbacks.onProgress) callbacks.onProgress(100);
          if (callbacks.onSuccess) callbacks.onSuccess();
        } else {
          if (callbacks.onProgress) callbacks.onProgress(state.progress);
        }
      }, 500);
    };

    run();

    return {
      file,
      abort: () => {
        state.paused = true; // Use pause for abort temporarily for UI sake
        clearInterval(state.interval);
        console.log(`[UploadService] Paused upload for ${file.name}`);
      },
      start: () => {
        if (!state.aborted) {
          state.paused = false;
          run();
          console.log(`[UploadService] Resumed upload for ${file.name}`);
        }
      },
      cancel: () => {
        state.aborted = true;
        clearInterval(state.interval);
        console.log(`[UploadService] Cancelled upload for ${file.name}`);
      },
    };
  }
}

export default new UploadService();
