/**
 * Estado do dia (telas Hoje e Novo registro): turno aberto, lançamentos, resumo e referências.
 * Toda escrita passa por uma action e depois recarrega o dia.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  addEarning as addEarningAction,
  addExpense as addExpenseAction,
  addFueling as addFuelingAction,
  listEntries,
  removeEntry as removeEntryAction,
  type EarningInput,
  type EntryKind,
  type ExpenseInput,
  type FuelingInput,
} from '@/actions/entries'
import { getActiveMotorcycle, getFuelContext, listActivePlatforms, type FuelContext } from '@/actions/reference'
import { endShift as endShiftAction, getLastKm, getOpenShift, startShift as startShiftAction } from '@/actions/shifts'
import { getPeriodSummary } from '@/actions/summary'
import type { PeriodSummary } from '@/domain/calculators/profit'
import type { Earning, Expense, Fueling, Motorcycle, Platform, Shift } from '@/domain/entities'
import { dayRange, toDayKey } from '@/domain/period'

export const useTodayStore = defineStore('today', () => {
  const day = ref(toDayKey(new Date()))
  const loaded = ref(false)
  const openShift = ref<Shift | null>(null)
  const lastKm = ref<number | null>(null)
  const earnings = ref<Earning[]>([])
  const expenses = ref<Expense[]>([])
  const fuelings = ref<Fueling[]>([])
  const summary = ref<PeriodSummary | null>(null)
  const platforms = ref<Platform[]>([])
  const motorcycle = ref<Motorcycle | null>(null)
  const fuelContext = ref<FuelContext | null>(null)

  async function load() {
    day.value = toDayKey(new Date())
    const range = dayRange(day.value)

    const [shift, km, entries, daySummary, platformList, activeMotorcycle, context] = await Promise.all([
      getOpenShift(),
      getLastKm(),
      listEntries(range),
      getPeriodSummary(range),
      listActivePlatforms(),
      getActiveMotorcycle(),
      getFuelContext(),
    ])

    openShift.value = shift
    lastKm.value = km
    earnings.value = entries.earnings
    expenses.value = entries.expenses
    fuelings.value = entries.fuelings
    summary.value = daySummary
    platforms.value = platformList
    motorcycle.value = activeMotorcycle
    fuelContext.value = context
    loaded.value = true
  }

  async function startShift(kmStart: number) {
    await startShiftAction(kmStart)
    await load()
  }

  async function endShift(kmEnd: number) {
    await endShiftAction(kmEnd)
    await load()
  }

  async function addEarning(input: EarningInput) {
    await addEarningAction(input)
    await load()
  }

  async function addExpense(input: ExpenseInput) {
    await addExpenseAction(input)
    await load()
  }

  async function addFueling(input: FuelingInput) {
    await addFuelingAction(input)
    await load()
  }

  async function removeEntry(kind: EntryKind, id: string) {
    await removeEntryAction(kind, id)
    await load()
  }

  function platformName(id: string): string {
    return platforms.value.find((platform) => platform.id === id)?.name ?? 'Plataforma'
  }

  return {
    day,
    loaded,
    openShift,
    lastKm,
    earnings,
    expenses,
    fuelings,
    summary,
    platforms,
    motorcycle,
    fuelContext,
    load,
    startShift,
    endShift,
    addEarning,
    addExpense,
    addFueling,
    removeEntry,
    platformName,
  }
})
