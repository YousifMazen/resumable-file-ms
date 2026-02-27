class DownloadService {
  /**
   * Mock implementation for starting a download.
   * This might involve fetching with streaming later.
   *
   * @param {string} fileId
   * @param {Object} callbacks - { onProgress, onSuccess, onError }
   * @returns {AbortController} to allow cancellation
   */
  startDownload(fileId, callbacks) {
    console.log(`[DownloadService] Starting download for file ${fileId}`);

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
      abort: () => {
        state.aborted = true;
        clearInterval(state.interval);
      },
      pause: () => {
        state.paused = true;
        clearInterval(state.interval);
      },
      start: () => {
        if (!state.aborted) {
          state.paused = false;
          run();
        }
      },
    };
  }
}

export default new DownloadService();
