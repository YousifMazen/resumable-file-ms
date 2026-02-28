<script setup>
/**
 * FilesPage Component
 *
 * Displays and manages the list of files within a specific collection.
 * Features include:
 * - Data table with sorting and filtering
 * - Global search
 * - File upload simulation (creates record and starts transfer)
 * - File download simulation
 * - File record management (edit/delete)
 * - Real-time transfer progress tracking via TransferStore
 */
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import FormDialog from '@/components/dialogs/FormDialog.vue';
import { useAuthStore } from '@/stores/AuthStore';
import { useFileStore } from '@/stores/FileStore';
import { useTransferStore } from '@/stores/TransferStore';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import FileUpload from 'primevue/fileupload';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const collectionId = route.params.id;

const fileStore = useFileStore();
const transferStore = useTransferStore();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'admin');
const { files, loading } = storeToRefs(fileStore);

const rows = ref(10);
const filters = ref();

/**
 * Initializes table filters with default match modes for global search, name, and date.
 */
const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    uploaded: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
    },
  };
};

initFilters();

const clearFilters = () => {
  initFilters();
};

onMounted(() => {
  fileStore.loadFiles(collectionId);
});

// UI State for Dialogs
const isConfirmVisible = ref(false);
const confirmHeader = ref('');
const confirmMessage = ref('');
const itemToDelete = ref(null);

const isFormVisible = ref(false);
const formHeader = ref('');
const formData = ref({});
const isEditing = ref(false);
const formLoading = ref(false);
const currentNode = ref(null);

const isUploadVisible = ref(false);
const uploadFiles = ref([]);

// Dialog Actions
const openDeleteConfirm = data => {
  itemToDelete.value = data;
  confirmHeader.value = `Delete File`;
  confirmMessage.value = `Are you sure you want to delete ${data.name}?`;
  isConfirmVisible.value = true;
};

// Executes the deletion of the selected file record.
const confirmDelete = async () => {
  try {
    if (itemToDelete.value) {
      await fileStore.deleteFile(itemToDelete.value.id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    isConfirmVisible.value = false;
    itemToDelete.value = null;
  }
};

// Opens the creation or update form dialog.
const openForm = (data, actionType) => {
  formLoading.value = false;
  isEditing.value = actionType === 'edit';

  formData.value = isEditing.value ? { ...data } : { name: '' };
  formHeader.value = `Edit File`;

  currentNode.value = data;
  isFormVisible.value = true;
};

// Opens the file upload dialog and resets the state.
const openUploadDialog = () => {
  uploadFiles.value = [];
  isUploadVisible.value = true;
};

// Captures selected files allowing name editing before upload.
const onFileSelect = event => {
  if (!event.files || !event.files.length) return;

  uploadFiles.value = Array.from(event.files).map(f => ({
    file: f,
    originalName: f.name,
    name: f.name,
  }));
};

// Saves the upload metadata and dispatches the TUS file transfer.
const saveUpload = async () => {
  if (!uploadFiles.value.length) {
    isUploadVisible.value = false;
    return;
  }
  formLoading.value = true;
  try {
    for (const item of uploadFiles.value) {
      const fileData = {
        name: item.name,
        size: item.file.size,
        type: item.file.type || 'application/octet-stream',
      };

      const newFile = await fileStore.createFile(collectionId, fileData);
      transferStore.startUpload(item.file, newFile.id);
    }
    isUploadVisible.value = false;
  } catch (e) {
    console.error(`Failed to initiate upload:`, e);
  } finally {
    formLoading.value = false;
  }
};

// Saves the form data by updating an existing file record.
const saveForm = async () => {
  formLoading.value = true;
  try {
    if (isEditing.value) {
      await fileStore.updateFile(currentNode.value.id, formData.value);
    }
    isFormVisible.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    formLoading.value = false;
  }
};

// Starts a simulated file download.
const downloadFile = data => {
  transferStore.startDownload(data);
};

// Navigates back to the previous page.
const goBack = () => {
  router.go(-1);
};

// Formats a date string or object into a human-readable local format.
const formatDate = date => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Formats speed in Bytes/s to a human readable format
const formatSpeed = bytes => {
  if (bytes === 0 || !bytes) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<template>
  <div class="h-full flex flex-col p-6 w-full gap-6">
    <div class="flex items-center justify-between">
      <Button icon="pi pi-arrow-left" label="Back" severity="secondary" text @click="goBack" />
    </div>

    <div
      class="card bg-surface-0 dark:bg-surface-900 shadow-sm border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden"
    >
      <DataTable
        v-model:filters="filters"
        :value="files"
        :paginator="true"
        :rows="rows"
        :loading="loading"
        :globalFilterFields="['name']"
        filterDisplay="menu"
        filterMode="lenient"
        sortMode="single"
        sortField="uploaded"
        :sortOrder="-1"
        removableSort
        class="w-full"
      >
        <template #header>
          <div
            class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 p-4 border-b border-surface-200 dark:border-surface-700"
          >
            <div>
              <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Files</h2>
              <p class="text-surface-500 dark:text-surface-400">
                Manage files for this collection.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                v-if="isAdmin"
                type="button"
                icon="pi pi-fw pi-upload"
                label="Upload File"
                @click="openUploadDialog"
              />
              <Button
                type="button"
                icon="pi pi-filter-slash"
                label="Clear Filters"
                outlined
                @click="clearFilters()"
              />
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="filters['global'].value"
                  placeholder="Global Search..."
                  class="w-full sm:w-auto"
                />
              </IconField>
            </div>
          </div>
        </template>

        <template #empty>
          <div
            class="flex flex-col items-center justify-center p-12 text-surface-500 dark:text-surface-400"
          >
            <i class="pi pi-file text-6xl mb-4 text-surface-300 dark:text-surface-600"></i>
            <p class="text-lg">No files found.</p>
          </div>
        </template>

        <Column
          field="name"
          header="Name"
          :sortable="true"
          filterField="name"
          style="min-width: 300px"
        >
          <template #filter="{ filterModel }">
            <InputText v-model="filterModel.value" type="text" placeholder="Search by name" />
          </template>
          <template #body="{ data }">
            <span class="flex items-center gap-2 font-medium">
              <i class="pi pi-file text-blue-400 text-lg"></i>
              <span>{{ data.name }}</span>
            </span>
          </template>
        </Column>

        <Column
          field="uploaded"
          header="Uploaded Date"
          :sortable="true"
          filterField="uploaded"
          dataType="date"
          style="min-width: 200px"
        >
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" dateFormat="M d, yy" placeholder="mm/dd/yyyy" />
          </template>
          <template #body="{ data }">
            <span v-if="data.uploaded" class="text-surface-600 dark:text-surface-300">{{
              formatDate(data.uploaded)
            }}</span>
          </template>
        </Column>

        <Column header="Status" :sortable="false" style="min-width: 250px">
          <template #body="{ data }">
            <!-- Upload Transfer UI -->
            <div
              v-if="transferStore.uploads[data.id]"
              class="flex items-center gap-2 w-full text-xs"
            >
              <div
                v-if="transferStore.uploads[data.id].status === 'completed'"
                class="flex items-center gap-1 text-green-500 font-medium whitespace-nowrap"
              >
                <i class="pi pi-check-circle"></i> Completed
              </div>
              <div
                v-else-if="transferStore.uploads[data.id].status === 'error'"
                class="flex items-center gap-1 text-red-500 font-medium whitespace-nowrap"
              >
                <i class="pi pi-exclamation-circle"></i> Failed
              </div>
              <template v-else>
                <ProgressBar
                  :value="transferStore.uploads[data.id].progress || 0"
                  style="height: 1.5rem; flex: 1"
                  class="w-full text-xs font-semibold select-none flex items-center justify-center relative overflow-hidden"
                ></ProgressBar>
                <div class="text-surface-500 font-mono whitespace-nowrap w-17.5 text-right">
                  {{
                    transferStore.uploads[data.id].status === 'paused'
                      ? 'Paused'
                      : formatSpeed(transferStore.uploads[data.id].speed)
                  }}
                </div>
                <div class="flex gap-0 items-center justify-center shrink-0">
                  <Button
                    v-if="transferStore.uploads[data.id].status === 'uploading'"
                    icon="pi pi-pause"
                    text
                    rounded
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.pauseUpload(data.id)"
                  />
                  <Button
                    v-if="transferStore.uploads[data.id].status === 'paused'"
                    icon="pi pi-play"
                    text
                    rounded
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.resumeUpload(data.id)"
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="danger"
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.cancelUpload(data.id)"
                  />
                </div>
              </template>
            </div>

            <!-- Download Transfer UI -->
            <div
              v-else-if="transferStore.downloads[data.id]"
              class="flex items-center gap-2 w-full text-xs"
            >
              <div
                v-if="transferStore.downloads[data.id].status === 'completed'"
                class="flex items-center gap-1 text-green-500 font-medium whitespace-nowrap"
              >
                <i class="pi pi-check-circle"></i> Completed
              </div>
              <div
                v-else-if="transferStore.downloads[data.id].status === 'error'"
                class="flex items-center gap-1 text-red-500 font-medium whitespace-nowrap"
              >
                <i class="pi pi-exclamation-circle"></i> Failed
              </div>
              <template v-else>
                <ProgressBar
                  :value="transferStore.downloads[data.id].progress || 0"
                  style="height: 1.5rem; flex: 1"
                  class="w-full text-xs font-semibold select-none flex items-center justify-center relative overflow-hidden"
                ></ProgressBar>
                <div class="text-surface-500 font-mono whitespace-nowrap w-17.5 text-right">
                  {{
                    transferStore.downloads[data.id].status === 'paused'
                      ? 'Paused'
                      : formatSpeed(transferStore.downloads[data.id].speed)
                  }}
                </div>
                <div class="flex gap-0 items-center justify-center shrink-0">
                  <Button
                    v-if="transferStore.downloads[data.id].status === 'downloading'"
                    icon="pi pi-pause"
                    text
                    rounded
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.pauseDownload(data.id)"
                  />
                  <Button
                    v-if="transferStore.downloads[data.id].status === 'paused'"
                    icon="pi pi-play"
                    text
                    rounded
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.resumeDownload(data.id)"
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    rounded
                    severity="danger"
                    style="width: 1.5rem; height: 1.5rem; padding: 0"
                    @click="transferStore.cancelDownload(data.id)"
                  />
                </div>
              </template>
            </div>

            <!-- Idle UI -->
            <div v-else class="text-surface-400 dark:text-surface-500 italic text-sm">Ready</div>
          </template>
        </Column>

        <Column header="Actions" :sortable="false" style="min-width: 150px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                v-if="!transferStore.downloads[data.id] && !transferStore.uploads[data.id]"
                icon="pi pi-download"
                severity="info"
                text
                rounded
                aria-label="Download"
                title="Download"
                @click="downloadFile(data)"
              />
              <Button
                v-if="
                  isAdmin &&
                  (!transferStore.uploads[data.id] ||
                    transferStore.uploads[data.id].status === 'completed')
                "
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Edit File"
                title="Edit File"
                @click="openForm(data, 'edit')"
              />
              <Button
                v-if="
                  isAdmin &&
                  (!transferStore.uploads[data.id] ||
                    transferStore.uploads[data.id].status === 'completed')
                "
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Delete File"
                title="Delete File"
                @click="openDeleteConfirm(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialogs -->
    <ConfirmDialog
      v-model:visible="isConfirmVisible"
      :header="confirmHeader"
      :message="confirmMessage"
      @accept="confirmDelete"
    />

    <FormDialog
      v-model:visible="isFormVisible"
      :header="formHeader"
      :loading="formLoading"
      @save="saveForm"
    >
      <form class="flex flex-col gap-4" @submit.prevent="saveForm">
        <div class="flex flex-col gap-2">
          <label for="name" class="font-semibold">Name</label>
          <InputText id="name" v-model="formData.name" placeholder="Enter name..." autofocus />
        </div>
      </form>
    </FormDialog>

    <FormDialog
      v-model:visible="isUploadVisible"
      header="Upload Files"
      :loading="formLoading"
      @save="saveUpload"
    >
      <form class="flex flex-col gap-4" @submit.prevent="saveUpload">
        <FileUpload
          mode="basic"
          multiple
          chooseLabel="Select Files"
          chooseIcon="pi pi-fw pi-file"
          @select="onFileSelect"
        />

        <div
          v-if="uploadFiles.length > 0"
          class="flex flex-col gap-4 mt-2 border-t border-surface-200 dark:border-surface-700 pt-4"
        >
          <div v-for="(item, index) in uploadFiles" :key="index" class="flex flex-col gap-2">
            <label
              :for="'filename-' + index"
              class="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis"
              :title="item.originalName"
            >
              {{ item.originalName }}
            </label>
            <InputText
              :id="'filename-' + index"
              v-model="item.name"
              placeholder="Enter file name..."
            />
          </div>
        </div>
      </form>
    </FormDialog>
  </div>
</template>
