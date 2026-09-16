<template>
  <div class="d-flex flex-column ga-4">
    <!-- Resumo -->
    <v-card flat class="border pa-4">
      <div class="d-flex align-center justify-space-between">
        <div>
          <div class="text-overline">Odômetro</div>
          <div class="text-h6 font-weight-bold">{{ formatKm(store.odometerKm) }}</div>
        </div>
        <div class="text-right">
          <div class="text-overline">Reserva</div>
          <div class="text-body-1 font-weight-bold">{{ reserveText }}</div>
        </div>
      </div>
      <p class="text-caption text-medium-emphasis mt-2 mb-0">{{ reserveCaption }}</p>
    </v-card>

    <!-- Itens -->
    <template v-if="store.items.length">
      <v-card v-for="view in store.items" :key="view.item.id" flat class="border pa-4">
        <div class="d-flex align-start justify-space-between ga-2">
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold">{{ view.item.name }}</div>
            <div class="text-caption text-medium-emphasis">
              a cada {{ formatKm(view.item.intervalKm) }}<span v-if="view.item.intervalDays"> ou {{ view.item.intervalDays }} dias</span>
              · {{ formatMoney(view.item.estimatedCostCents) }}
            </div>
          </div>
          <v-btn icon="mdi-pencil-outline" variant="text" size="small" :aria-label="`Editar ${view.item.name}`" @click="openEditor(view.item)" />
          <v-btn icon="mdi-delete-outline" variant="text" size="small" :aria-label="`Excluir ${view.item.name}`" @click="onRemove(view.item)" />
        </div>

        <McProgressBar
          class="mt-3"
          :label="`${formatKm(view.status.kmSince)} rodados`"
          :ratio="view.status.ratio"
          :hint="hintOf(view)"
          :state="view.status.state"
        />

        <v-btn class="mt-3" block variant="tonal" color="primary" prepend-icon="mdi-check-circle-outline" @click="openDone(view)">
          Fiz a troca
        </v-btn>
      </v-card>
    </template>

    <v-card v-else flat class="border pa-6 text-center">
      <v-icon icon="mdi-wrench-outline" size="40" color="primary" class="mb-2" />
      <div class="text-subtitle-1 font-weight-bold">Nenhum item cadastrado</div>
      <p class="text-body-2 text-medium-emphasis mt-1 mb-4">
        Cadastre o que se desgasta na moto (óleo, relação, pneus). O app avisa quando chegar a hora e
        calcula quanto guardar por km rodado.
      </p>
      <v-btn color="primary" :loading="saving" @click="onAddSuggested">Adicionar itens sugeridos</v-btn>
    </v-card>

    <v-btn variant="tonal" prepend-icon="mdi-plus" @click="openEditor(null)">Adicionar item</v-btn>
    <v-btn v-if="store.items.length" variant="text" size="small" :loading="saving" @click="onAddSuggested">
      Completar com os itens sugeridos
    </v-btn>

    <!-- Histórico -->
    <v-card v-if="store.history.length" flat class="border">
      <v-card-title class="text-subtitle-1">Trocas feitas</v-card-title>
      <v-list density="compact" lines="two">
        <v-list-item
          v-for="record in store.history"
          :key="record.id"
          :title="record.itemName"
          :subtitle="`${formatDayLabel(record.day)} · ${formatKm(record.odometerKm)}`"
        >
          <template #append>
            <span class="font-weight-medium">{{ formatMoney(record.costCents) }}</span>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <!-- Cadastrar / editar item -->
    <v-dialog v-model="editorOpen" max-width="420">
      <v-card class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">{{ editing ? 'Editar item' : 'Novo item' }}</div>

        <v-text-field v-model="form.name" label="Nome" placeholder="Troca de óleo" autocapitalize="sentences" />
        <McNumberField v-model="form.intervalKm" label="Trocar a cada" suffix="km" />
        <McNumberField v-model="form.intervalDays" label="Ou a cada (opcional)" suffix="dias" />
        <McCurrencyField v-model="form.estimatedCostCents" label="Custo estimado" />
        <McNumberField v-model="form.lastKm" label="Km da última troca" suffix="km" />

        <div class="d-flex justify-end ga-2 mt-2">
          <v-btn variant="text" @click="editorOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSaveItem">Salvar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Fiz a troca -->
    <v-dialog v-model="doneOpen" max-width="420">
      <v-card class="pa-4">
        <div class="text-subtitle-1 font-weight-bold">Fiz a troca</div>
        <p class="text-body-2 text-medium-emphasis mb-3">{{ doneItem?.item.name }}</p>

        <McNumberField v-model="doneForm.odometerKm" label="Km no odômetro" suffix="km" />
        <McCurrencyField v-model="doneForm.costCents" label="Quanto pagou" hint="Vira a nova estimativa do item." persistent-hint />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="doneOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSaveDone">Registrar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import type { MaintenanceView } from '@/actions/maintenance'
import McCurrencyField from '@/components/McCurrencyField.vue'
import McNumberField from '@/components/McNumberField.vue'
import McProgressBar from '@/components/McProgressBar.vue'
import type { MaintenanceItem } from '@/domain/entities'
import { toDayKey } from '@/domain/period'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { formatDayLabel, formatKm, formatMoney, formatRate } from '@/lib/format'
import { useMaintenanceStore } from '@/stores/maintenance'

const store = useMaintenanceStore()
const { saving, snackbar, run } = useAsyncAction()

onMounted(async () => {
  await store.load()
  await store.loadHistory()
})

const reserveText = computed(() => {
  const perKm = store.overview?.reservePerKmCents ?? 0
  return perKm > 0 ? `${formatRate(perKm, 2)}/km` : '—'
})

const reserveCaption = computed(() => {
  const perKm = store.overview?.reservePerKmCents ?? 0
  if (!store.overview?.usesItems) {
    return 'Sem itens cadastrados, a reserva usa o valor por 100 km dos Ajustes.'
  }
  return `Equivale a ${formatMoney(Math.round(perKm * 100))} a cada 100 km rodados.`
})

function hintOf(view: MaintenanceView): string {
  const { status, item } = view
  if (status.state === 'overdue') {
    return status.kmLeft < 0 ? `vencido há ${formatKm(-status.kmLeft)}` : 'vencido pelo tempo'
  }
  const parts = [`faltam ${formatKm(status.kmLeft)}`]
  if (item.intervalDays !== null && status.daysLeft !== null) parts.push(`${status.daysLeft} dias`)
  return parts.join(' · ')
}

// ---------- cadastrar / editar ----------

const editorOpen = ref(false)
const editing = ref<MaintenanceItem | null>(null)
const form = reactive({
  name: '',
  intervalKm: null as number | null,
  intervalDays: null as number | null,
  estimatedCostCents: null as number | null,
  lastKm: null as number | null,
})

function openEditor(item: MaintenanceItem | null) {
  editing.value = item
  Object.assign(form, {
    name: item?.name ?? '',
    intervalKm: item?.intervalKm ?? null,
    intervalDays: item?.intervalDays ?? null,
    estimatedCostCents: item?.estimatedCostCents ?? null,
    lastKm: item?.lastKm ?? store.odometerKm,
  })
  editorOpen.value = true
}

async function onSaveItem() {
  const input = {
    name: form.name,
    intervalKm: form.intervalKm ?? 0,
    intervalDays: form.intervalDays,
    estimatedCostCents: form.estimatedCostCents ?? 0,
    lastKm: form.lastKm ?? 0,
    lastDate: editing.value?.lastDate ?? toDayKey(new Date()),
  }

  const ok = await run(async () => {
    if (editing.value) await store.updateItem({ ...editing.value, ...input })
    else await store.addItem(input)
  }, editing.value ? 'Item atualizado' : 'Item cadastrado')

  if (ok) editorOpen.value = false
}

async function onRemove(item: MaintenanceItem) {
  if (!window.confirm(`Excluir "${item.name}"? O histórico de trocas continua salvo.`)) return
  await run(() => store.removeItem(item.id), 'Item excluído')
}

async function onAddSuggested() {
  await run(async () => {
    const created = await store.addSuggested()
    snackbar.text = created > 0 ? `${created} item(ns) adicionado(s)` : 'Todos os sugeridos já estão cadastrados'
    snackbar.color = 'success'
    snackbar.show = true
  })
}

// ---------- fiz a troca ----------

const doneOpen = ref(false)
const doneItem = ref<MaintenanceView | null>(null)
const doneForm = reactive({ odometerKm: null as number | null, costCents: null as number | null })

function openDone(view: MaintenanceView) {
  doneItem.value = view
  Object.assign(doneForm, { odometerKm: store.odometerKm, costCents: view.item.estimatedCostCents })
  doneOpen.value = true
}

async function onSaveDone() {
  const view = doneItem.value
  if (!view) return

  const ok = await run(
    () => store.registerDone(view.item.id, { odometerKm: doneForm.odometerKm ?? 0, costCents: doneForm.costCents ?? 0 }),
    'Troca registrada',
  )
  if (ok) doneOpen.value = false
}
</script>
