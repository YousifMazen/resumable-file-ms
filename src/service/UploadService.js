import { Upload } from 'tus-js-client';

class UploadService {
  /**
   * Starts an upload using tus-js-client.
   *
   * @param {File} file
   * @param {Object} callbacks - { onProgress, onSuccess, onError }
   * @returns {Object} A resumable upload instance with abort, start, cancel methods
   */
  startUpload(file, callbacks) {
    console.log(`[UploadService] Starting background upload for ${file.name}`);

    let lastBytes = 0;
    let lastTime = performance.now();
    let computedSpeed = 0; // bytes per second

    const upload = new Upload(file, {
      endpoint: 'http://localhost:1080/files/',
      retryDelays: [0, 1000, 3000, 5000], // Fail fast: max 9 seconds before throwing onError
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      //   parallelUploads: 4, // 4 concurrent chunks
      // Removed parallelUploads due to tus-js-client infinite retry bug when server is down
      metadata: {
        filename: file.name,
        filetype: file.type || 'application/octet-stream', // octet-stream is internet media type (MIME type) used to indicate arbitrary binary data with an unknown or unspecified file type
      },
      onError: function (error) {
        console.error(`[UploadService] Failed upload for ${file.name} because: ${error}`);
        if (callbacks.onError) callbacks.onError(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);

        // Compute Speed (Bytes / Sec)
        const now = performance.now();
        const timeDiff = (now - lastTime) / 1000; // in seconds

        // Only update speed every 500ms to avoid erratic jumping
        if (timeDiff > 0.5 || bytesUploaded === bytesTotal) {
          const bytesDiff = bytesUploaded - lastBytes;
          if (timeDiff > 0) {
            computedSpeed = Math.floor(bytesDiff / timeDiff);
          }
          lastBytes = bytesUploaded;
          lastTime = now;
        }

        if (callbacks.onProgress) callbacks.onProgress(parseFloat(percentage), computedSpeed);
      },
      onSuccess: function () {
        console.log(
          `[UploadService] Download ${upload.file.name} successfully uploaded to ${upload.url}`
        );
        if (callbacks.onSuccess) callbacks.onSuccess();
      },
    });

    upload.start();

    return {
      file,
      abort: () => {
        if (upload) upload.abort();
        console.log(`[UploadService] Paused upload for ${file.name}`);
      },
      start: () => {
        if (upload) upload.start();
        console.log(`[UploadService] Resumed upload for ${file.name}`);
      },
      cancel: () => {
        // Passing true to abort() will terminate the upload and send a DELETE request
        if (upload) upload.abort(true);
        console.log(`[UploadService] Cancelled and terminated upload for ${file.name}`);
      },
    };
  }
}

export default new UploadService();
