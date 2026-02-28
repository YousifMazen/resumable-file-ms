/**
 * Service for managing chunked resumable downloads using the File System Access API.
 * Handles save location prompts, HEAD requests for file size, and chunked fetching with Range headers.
 */
class DownloadService {
  /**
   * Starts a chunked resumable download.
   *
   * @param {string} fileId - The ID of the file to download
   * @param {Object} fileRecord - Metadata about the file (id, name, etc.)
   * @param {Object} callbacks - Hook functions for onProgress, onSuccess, and onError
   * @returns {Promise<Object>} A controller object with abort, pause, and start methods
   */
  async startDownload(fileId, fileRecord, callbacks) {
    console.log(`[DownloadService] Requesting save location for file ${fileRecord.name}`);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

    // 1. Ask user for file handle to save directly to disk
    let fileHandle;
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: fileRecord.name,
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[DownloadService] User cancelled the save file picker dialog.');
        throw new Error('USER_CANCELLED');
      }
      console.error('[DownloadService] Error showing save file picker', err);
      if (callbacks.onError) callbacks.onError(err);
      throw err;
    }

    const encodedName = encodeURIComponent(fileRecord.name);

    // 2. Head request to get exact byte size of the mock file
    let totalSize = 0;
    try {
      const resp = await fetch(`http://localhost:4000/download/${encodedName}`, {
        method: 'HEAD',
      });
      if (!resp.ok) throw new Error('Could not fetch file info');
      totalSize = parseInt(resp.headers.get('content-length') || '0', 10);
      if (totalSize === 0) throw new Error('File is empty or size unknown');
    } catch (err) {
      console.error('[DownloadService] Failed to determine file size:', err);
      if (callbacks.onError) callbacks.onError(err);
      throw err;
    }

    const state = {
      progress: 0,
      downloadedBytes: 0,
      aborted: false,
      paused: false,
      writable: null,
      lastBytes: 0,
      lastTime: performance.now(),
      computedSpeed: 0,
    };

    // Keep file handle to reopen stream if needed
    let writableStream = null;

    const run = async () => {
      try {
        if (!writableStream) {
          // Open stream (keep existing data if resuming)
          writableStream = await fileHandle.createWritable({ keepExistingData: true });
        }

        while (state.downloadedBytes < totalSize) {
          if (state.aborted || state.paused) {
            break;
          }

          if (!navigator.onLine) {
            console.warn('[DownloadService] System is offline. Pausing chunk fetch.');
            break; // Store handles offline/online events to retrigger play()
          }

          const start = state.downloadedBytes;
          const end = Math.min(start + CHUNK_SIZE - 1, totalSize - 1);

          console.log(`[DownloadService] Fetching chunk bytes=${start}-${end}`);

          try {
            const response = await fetch(`http://localhost:4000/download/${encodedName}`, {
              headers: {
                Range: `bytes=${start}-${end}`,
              },
            });

            // If we requested a range but got 200 OK, it means the server sent the WHOLE file.
            // We must handle this so we don't write the full file into a chunk offset.
            if (response.status === 200) {
              console.warn('[DownloadService] Server ignored Range header, received full file.');
              const fullData = await response.blob();
              await writableStream.write({ type: 'write', position: 0, data: fullData });
              state.downloadedBytes = fullData.size;
              break;
            }

            if (response.status !== 206) {
              throw new Error(`Server returned unexpected status: ${response.status}`);
            }

            const chunkData = await response.blob();

            // Check flags right before writing to disk
            if (state.aborted || state.paused) {
              break;
            }

            // Write to disk
            await writableStream.write({ type: 'write', position: start, data: chunkData });

            state.downloadedBytes += chunkData.size;

            const percentage = ((state.downloadedBytes / totalSize) * 100).toFixed(2);
            state.progress = parseFloat(percentage);

            // Compute Speed
            const now = performance.now();
            const timeDiff = (now - state.lastTime) / 1000;

            if (timeDiff > 0.5 || state.downloadedBytes === totalSize) {
              const bytesDiff = state.downloadedBytes - state.lastBytes;
              if (timeDiff > 0) {
                state.computedSpeed = Math.floor(bytesDiff / timeDiff);
              }
              state.lastBytes = state.downloadedBytes;
              state.lastTime = now;
            }

            if (callbacks.onProgress) callbacks.onProgress(state.progress, state.computedSpeed);
          } catch (chunkErr) {
            console.error('[DownloadService] Chunk fetch failed:', chunkErr);
            if (callbacks.onError) callbacks.onError(chunkErr);
            // Critical errors (like network connection refused) -> break loop
            break;
          }
        }

        if (state.downloadedBytes >= totalSize && !state.aborted) {
          // Finished!
          state.progress = 100;
          if (writableStream) {
            await writableStream.close();
            writableStream = null;
          }
          if (callbacks.onProgress) callbacks.onProgress(100, 0);
          if (callbacks.onSuccess) callbacks.onSuccess();
        } else if (state.aborted || state.paused) {
          if (writableStream) {
            await writableStream.close();
            writableStream = null;
          }
        }
      } catch (e) {
        console.error('[DownloadService] Fatal run loop error:', e);
        if (callbacks.onError) callbacks.onError(e);
      }
    };

    // Kickoff
    run();

    return {
      abort: () => {
        state.aborted = true;
      },
      pause: () => {
        state.paused = true;
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
