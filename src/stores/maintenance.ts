/**
 * Estado da manutenção: itens com a situação de cada um, contagem de vencidos/atenção (badge da aba
 * e aviso na tela Hoje) e o histórico de trocas.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  addMaintenanceItem as addItemAction,
  addSuggestedItems,
  getMaintenanceOverview,
  listMaintenanceHistory,
  registerMaintenance as registerAction,
  removeMaintenanceItem as removeItemAction,
  updateMaintenanceItem as updateItemAction,
  type MaintenanceDoneInput,
  type MaintenanceItemInput,
  type MaintenanceOverview,
} from '@/actions/maintenance'
import type { MaintenanceItem, MaintenanceRecord } from '@/domain/entities'

export const useMaintenanceStore = defineStore('maintenance', () => {
  const overview = ref<MaintenanceOverview | null>(null)
  const history = ref<MaintenanceRecord[]>([])
  const loaded = ref(false)

  const items = computed(() => overview.value?.items ?? [])
  const odometerKm = computed(() => overview.value?.odometerKm ?? 0)
  /** Quantos itens pedem atenção — usado no badge da aba Manutenção. */
  const alerts = computed(() => (overview.value?.overdue ?? 0) + (overview.value?.warning ?? 0))
  const overdue = computed(() => overview.value?.overdue ?? 0)
  const mostUrgent = computed(() => items.value[0] ?? null)

  async function load() {
    overview.value = await getMaintenanceOverview()
    loaded.value = true
  }

  async function loadHistory() {
    history.value = await listMaintenanceHistory()
  }

  async function addItem(input: MaintenanceItemInput) {
    await addItemAction(input)
    await load()
  }

  async function updateItem(item: MaintenanceItem) {
    await updateItemAction(item)
    await load()
  }

  async function removeItem(id: string) {
    await removeItemAction(id)
    await load()
  }

  async function addSuggested(): Promise<number> {
    const created = await addSuggestedItems()
    await load()
    return created
  }

  async function registerDone(itemId: string, input: MaintenanceDoneInput) {
    await registerAction(itemId, input)
    await Promise.all([load(), loadHistory()])
  }

  return {
    overview,
    history,
    loaded,
    items,
    odometerKm,
    alerts,
    overdue,
    mostUrgent,
    load,
    loadHistory,
    addItem,
    updateItem,
    removeItem,
    addSuggested,
    registerDone,
  }
})
