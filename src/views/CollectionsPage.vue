<script setup>
/**
 * CollectionsPage Component
 *
 * Displays and manages the list of collections within a specific case.
 * Features include:
 * - Data table with sorting and filtering
 * - Global search
 * - Collection management (create/edit/delete)
 * - Navigation to files within a collection
 */
import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';
import FormDialog from '@/components/dialogs/FormDialog.vue';
import { useAuthStore } from '@/stores/AuthStore';
import { useCollectionStore } from '@/stores/CollectionStore';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const caseId = route.params.id;

const collectionStore = useCollectionStore();
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'admin');
const { collections, loading } = storeToRefs(collectionStore);

const rows = ref(10);
const filters = ref();

// Initializes table filters
const initFilters = () => {
  filters.value = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    created: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
    },
    updated: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
    },
  };
};

initFilters();

// Resets all filters
const clearFilters = () => {
  initFilters();
};

onMounted(() => {
  collectionStore.loadCollections(caseId);
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

// Opens the deletion confirmation dialog
const openDeleteConfirm = data => {
  itemToDelete.value = data;
  confirmHeader.value = `Delete Collection`;
  confirmMessage.value = `Are you sure you want to delete ${data.name}?`;
  isConfirmVisible.value = true;
};

// Executes the deletion of the selected collection
const confirmDelete = async () => {
  try {
    if (itemToDelete.value) {
      await collectionStore.deleteCollection(itemToDelete.value.id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    isConfirmVisible.value = false;
    itemToDelete.value = null;
  }
};

// Opens the creation or update form dialog
const openForm = (data, actionType) => {
  formLoading.value = false;
  isEditing.value = actionType === 'edit';
  formData.value = isEditing.value ? { ...data } : { name: '' };
  currentNode.value = data;

  if (actionType === 'createCollection') {
    formHeader.value = 'New Collection';
  } else {
    formHeader.value = `Edit Collection`;
  }

  isFormVisible.value = true;
};

// Saves the collection form data
const saveForm = async () => {
  formLoading.value = true;
  try {
    if (!isEditing.value) {
      if (!formData.value.name || formData.value.name.trim() === '') {
        formData.value.name = new Date().toLocaleString(
          new Intl.Locale(navigator.language || 'en-US'),
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          }
        );
      }
      await collectionStore.createCollection(caseId, formData.value);
    } else {
      await collectionStore.updateCollection(currentNode.value.id, formData.value);
    }
    isFormVisible.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    formLoading.value = false;
  }
};

// Navigates to the files page for a collection
const viewFiles = data => {
  router.push(`/collections/${data.id}/files`);
};

// Formats a date string or object
const formatDate = date => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="h-full flex flex-col p-6 w-full gap-6">
    <div class="flex items-center justify-between">
      <Button
        icon="pi pi-arrow-left"
        label="Back to Cases"
        severity="secondary"
        text
        @click="router.push('/cases')"
      />
    </div>

    <div
      class="card bg-surface-0 dark:bg-surface-900 shadow-sm border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden"
    >
      <DataTable
        v-model:filters="filters"
        :value="collections"
        :paginator="true"
        :rows="rows"
        :loading="loading"
        :globalFilterFields="['name']"
        filterDisplay="menu"
        filterMode="lenient"
        sortMode="single"
        sortField="created"
        :sortOrder="-1"
        removableSort
        class="w-full"
      >
        <template #header>
          <div
            class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 p-4 border-b border-surface-200 dark:border-surface-700"
          >
            <div>
              <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
                Collections
              </h2>
              <p class="text-surface-500 dark:text-surface-400">
                Manage collections for this case. Select a collection to view its files.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                v-if="isAdmin"
                type="button"
                icon="pi pi-fw pi-plus"
                label="New Collection"
                severity="primary"
                @click="openForm(null, 'createCollection')"
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
            <i class="pi pi-folder text-6xl mb-4 text-surface-300 dark:text-surface-600"></i>
            <p class="text-lg">No collections found.</p>
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
            <span
              class="flex items-center gap-2 font-medium cursor-pointer hover:text-primary-500 transition-colors"
              @click="viewFiles(data)"
            >
              <i class="pi pi-folder text-yellow-500 text-lg"></i>
              <span>{{ data.name }}</span>
            </span>
          </template>
        </Column>

        <Column
          field="created"
          header="Created Date"
          :sortable="true"
          filterField="created"
          dataType="date"
          style="min-width: 200px"
        >
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" dateFormat="M d, yy" placeholder="mm/dd/yyyy" />
          </template>
          <template #body="{ data }">
            <span v-if="data.created" class="text-surface-600 dark:text-surface-300">{{
              formatDate(data.created)
            }}</span>
          </template>
        </Column>

        <Column
          field="updated"
          header="Updated Date"
          :sortable="true"
          filterField="updated"
          dataType="date"
          style="min-width: 200px"
        >
          <template #filter="{ filterModel }">
            <DatePicker v-model="filterModel.value" dateFormat="M d, yy" placeholder="mm/dd/yyyy" />
          </template>
          <template #body="{ data }">
            <span v-if="data.updated" class="text-surface-600 dark:text-surface-300">{{
              formatDate(data.updated)
            }}</span>
          </template>
        </Column>

        <Column header="Actions" :sortable="false" style="min-width: 250px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-file"
                label="Files"
                severity="info"
                text
                rounded
                aria-label="View Files"
                title="View Files"
                @click="viewFiles(data)"
              />
              <Button
                v-if="isAdmin"
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Edit Collection"
                title="Edit Collection"
                @click="openForm(data, 'edit')"
              />
              <Button
                v-if="isAdmin"
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Delete Collection"
                title="Delete Collection"
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
  </div>
</template>
