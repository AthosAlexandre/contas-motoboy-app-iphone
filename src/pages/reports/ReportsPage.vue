<template>
  <div class="d-flex flex-column ga-4">
    <McPeriodPicker
      :kind="kind"
      :label="periodLabel"
      :is-current="isCurrentPeriod"
      @update:kind="onKind"
      @previous="onShift(-1)"
      @next="onShift(1)"
      @now="onNow"
    />

    <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

    <template v-if="summary">
      <McStatCard
        highlight
        title="Lucro líquido"
        icon="mdi-wallet-outline"
        :value="formatMoney(summary.netProfitCents)"
        :caption="profitCaption"
      />

      <v-row dense>
        <v-col cols="6"><McStatCard title="Ganhos" icon="mdi-cash-plus" :value="formatMoney(summary.grossCents)" /></v-col>
        <v-col cols="6">
          <McStatCard title="Gastos" icon="mdi-cash-minus" color="error" :value="formatMoney(summary.expensesCents)" />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Combustível"
            icon="mdi-gas-station"
            color="fuel"
            :value="formatMoney(summary.fuelCostCents)"
            :caption="`pago no posto · estimado por km: ${formatMoney(summary.estimatedFuelCostCents)}`"
          />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Reserva"
            icon="mdi-wrench-outline"
            color="maintenance"
            :value="formatMoney(summary.maintenanceReserveCents)"
            caption="manutenção (guardar)"
          />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Km rodados"
            icon="mdi-map-marker-distance"
            color="secondary"
            :value="formatKm(summary.km)"
            :caption="summary.closedShifts ? `${summary.closedShifts} turno(s)` : undefined"
          />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Por km"
            icon="mdi-speedometer"
            :value="summary.grossPerKmCents === null ? '—' : `${formatRate(summary.grossPerKmCents, 2)}/km`"
            :caption="summary.netPerKmCents === null ? undefined : `lucro ${formatRate(summary.netPerKmCents, 2)}/km`"
          />
        </v-col>
      </v-row>

      <v-alert
        v-if="summary.missingConsumption"
        type="warning"
        variant="tonal"
        density="compact"
        text="Algum turno ficou sem consumo informado: a estimativa por km ficou incompleta (o valor pago no posto não muda)."
      />

      <!-- De onde veio e para onde foi -->
      <v-card flat class="border pa-4">
        <div class="text-overline mb-3">De onde veio o dinheiro</div>
        <McPieChart :slices="earningSlices" :format-value="formatMoney" caption="ganhos" empty-text="Nenhum ganho lançado neste período." />
      </v-card>

      <v-card flat class="border pa-4">
        <div class="text-overline mb-3">Para onde foi</div>
        <McPieChart :slices="costSlices" :format-value="formatMoney" caption="custos" empty-text="Nenhum custo neste período." />
      </v-card>

      <!-- Evolução no período -->
      <v-card v-if="kind !== 'day'" flat class="border pa-4">
        <div class="text-overline mb-1">Lucro por dia</div>
        <McLineChart :points="dailyPoints" :format-value="formatMoney" :highlight="dailyAverage" />
      </v-card>

      <!-- Comparação entre meses -->
      <v-card v-if="kind === 'month'" flat class="border pa-4">
        <div class="text-overline mb-1">Lucro de cada mês</div>
        <McLineChart :points="monthPoints" :format-value="formatMoney" color="rgb(var(--v-theme-secondary))" />
        <v-list density="compact" class="py-0 mt-2">
          <v-list-item v-for="month in monthly" :key="month.month" class="px-0" :title="formatMonthLabel(month.month)">
            <template #append>
              <span class="font-weight-medium">{{ formatMoney(month.netCents) }}</span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Etanol × gasolina -->
      <v-card v-if="fuelComparison && fuelComparison.options.length > 1" flat class="border pa-4">
        <div class="text-overline mb-1">Etanol ou gasolina?</div>
        <p class="text-caption text-medium-emphasis mb-2">Custo por km com o preço e o consumo da sua moto.</p>
        <v-list density="compact" class="py-0">
          <v-list-item v-for="option in fuelComparison.options" :key="option.fuelType" class="px-0">
            <template #title>
              {{ FUEL_TYPE_LABELS[option.fuelType] }}
              <v-chip v-if="fuelComparison.cheaper === option.fuelType" size="x-small" color="primary" class="ml-1">
                compensa
              </v-chip>
            </template>
            <template #subtitle>
              {{ formatRate(option.pricePerLiterCents) }}/l ·
              {{ option.kmPerLiter === null ? 'consumo não informado' : formatKmPerLiter(option.kmPerLiter) }}
              <span v-if="option.measured">(medido)</span>
            </template>
            <template #append>
              <span class="font-weight-medium">
                {{ option.costPerKmCents === null ? '—' : `${formatRate(option.costPerKmCents, 2)}/km` }}
              </span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Lançamentos -->
      <v-card flat class="border">
        <v-card-title class="text-subtitle-1">Lançamentos do período</v-card-title>
        <v-list v-if="items.length" lines="two">
          <v-list-item v-for="item in items" :key="item.key" :title="item.title" :subtitle="item.subtitle">
            <template #prepend>
              <v-avatar :color="item.color" variant="tonal"><v-icon :icon="item.icon" /></v-avatar>
            </template>
            <template #append>
              <span class="font-weight-bold mr-1" :class="item.valueClass">{{ item.value }}</span>
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                :aria-label="`Editar ${item.title}`"
                @click="openEditor(item)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                :aria-label="`Excluir ${item.title}`"
                @click="onRemove(item)"
              />
            </template>
          </v-list-item>
        </v-list>
        <v-card-text v-else class="text-medium-emphasis">Nada lançado neste período.</v-card-text>
      </v-card>
    </template>

    <!-- Editar lançamento -->
    <v-dialog v-model="editorOpen" max-width="420">
      <v-card class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">Editar lançamento</div>

        <template v-if="editing?.kind === 'earning'">
          <v-select v-model="editEarning.platformId" :items="platformItems" label="Plataforma" />
          <McCurrencyField v-model="editEarning.amountCents" label="Valor recebido" />
          <McCurrencyField v-model="editEarning.tipCents" label="Gorjeta" />
        </template>

        <template v-else-if="editing?.kind === 'expense'">
          <v-select v-model="editExpense.category" :items="categoryItems" label="Categoria" />
          <McCurrencyField v-model="editExpense.amountCents" label="Valor" />
          <v-text-field v-model="editExpense.description" label="Descrição (opcional)" maxlength="80" />
        </template>

        <template v-else-if="editing?.kind === 'fueling'">
          <McFuelTypeToggle v-model="editFueling.fuelType" :allow-ethanol="allowEthanol" />
          <McCurrencyField v-model="editFueling.totalCents" class="mt-4" label="Valor total pago" />
          <McNumberField v-model="editFueling.liters" label="Litros" suffix="l" :decimals="3" />
          <McNumberField v-model="editFueling.odometerKm" label="Km no odômetro (opcional)" suffix="km" />
          <v-switch v-model="editFueling.fullTank" color="primary" inset hide-details label="Completei o tanque" />
        </template>

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="editorOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSaveEdit">Salvar</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { removeEntry, updateEarning, updateExpense, updateFueling, type EntryKind } from '@/actions/entries'
import {
  getFuelComparison,
  getMonthlyProfits,
  getReport,
  rangeOf,
  shiftDay,
  type FuelComparison,
  type MonthProfit,
  type PeriodKind,
  type PeriodReport,
} from '@/actions/reports'
import { listAllPlatforms } from '@/actions/settings'
import McCurrencyField from '@/components/McCurrencyField.vue'
import McFuelTypeToggle from '@/components/McFuelTypeToggle.vue'
import McLineChart from '@/components/McLineChart.vue'
import McNumberField from '@/components/McNumberField.vue'
import McPeriodPicker from '@/components/McPeriodPicker.vue'
import McPieChart from '@/components/McPieChart.vue'
import McStatCard from '@/components/McStatCard.vue'
import {
  EXPENSE_CATEGORY_LABELS,
  FUEL_TYPE_LABELS,
  type Earning,
  type ExpenseCategory,
  type FuelType,
  type Fueling,
  type Platform,
} from '@/domain/entities'
import { toDayKey } from '@/domain/period'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import {
  formatDayLabel,
  formatKm,
  formatKmPerLiter,
  formatLiters,
  formatMonthLabel,
  formatMoney,
  formatRangeLabel,
  formatRate,
  formatTime,
} from '@/lib/format'
import { useSessionStore } from '@/stores/session'

interface EntryItem {
  key: string
  kind: EntryKind
  id: string
  createdAt: string
  title: string
  subtitle: string
  value: string
  valueClass: string
  icon: string
  color: string
}

/** Cores das fatias, na ordem (tokens do tema). */
const SLICE_COLORS = [
  'rgb(var(--v-theme-primary))',
  'rgb(var(--v-theme-secondary))',
  'rgb(var(--v-theme-aqua))',
  'rgb(var(--v-theme-info))',
  'rgb(var(--v-theme-success))',
  'rgb(var(--v-theme-warning))',
]

const COST_COLORS: Record<string, string> = {
  fuel: 'rgb(var(--v-theme-fuel))',
  maintenance: 'rgb(var(--v-theme-maintenance))',
}

const session = useSessionStore()
const { saving, snackbar, run } = useAsyncAction()

const kind = ref<PeriodKind>('day')
const day = ref(toDayKey(new Date()))
const loading = ref(false)
const report = ref<PeriodReport | null>(null)
const monthly = ref<MonthProfit[]>([])
const fuelComparison = ref<FuelComparison | null>(null)
const platforms = ref<Platform[]>([])

const summary = computed(() => report.value?.summary ?? null)

onMounted(async () => {
  platforms.value = await listAllPlatforms()
  fuelComparison.value = await getFuelComparison()
  void session.loadMotorcycle()
  await load()
})

async function load() {
  loading.value = true
  try {
    report.value = await getReport(kind.value, day.value)
    // A comparação entre meses é pesada (um período por mês): só no modo Mês.
    monthly.value = kind.value === 'month' ? await getMonthlyProfits(day.value, 6) : []
  } finally {
    loading.value = false
  }
}

function onKind(next: PeriodKind) {
  kind.value = next
  void load()
}

function onShift(amount: number) {
  day.value = shiftDay(kind.value, day.value, amount)
  void load()
}

function onNow() {
  day.value = toDayKey(new Date())
  void load()
}

const isCurrentPeriod = computed(() => {
  const today = toDayKey(new Date())
  const range = rangeOf(kind.value, day.value)
  return today >= range.from && today <= range.to
})

const periodLabel = computed(() => {
  const range = rangeOf(kind.value, day.value)
  if (kind.value === 'day') return formatDayLabel(range.from)
  return kind.value === 'week' ? formatRangeLabel(range.from, range.to) : formatMonthLabel(range.from)
})

const profitCaption = computed(() => {
  const value = summary.value
  if (!value) return undefined
  const costs = value.fuelCostCents + value.expensesCents + value.maintenanceReserveCents
  return `${formatMoney(value.grossCents)} de ganho − ${formatMoney(costs)} de custos`
})

function platformName(id: string): string {
  return platforms.value.find((platform) => platform.id === id)?.name ?? 'Plataforma'
}

function costLabel(key: string): string {
  if (key === 'fuel') return 'Combustível'
  if (key === 'maintenance') return 'Reserva de manutenção'
  return EXPENSE_CATEGORY_LABELS[key as ExpenseCategory] ?? key
}

const earningSlices = computed(() =>
  (report.value?.earnings ?? []).map((slice, index) => ({
    key: slice.key,
    label: platformName(slice.key),
    value: slice.cents,
    color: SLICE_COLORS[index % SLICE_COLORS.length] ?? SLICE_COLORS[0]!,
  })),
)

const costSlices = computed(() =>
  (report.value?.costs ?? []).map((slice, index) => ({
    key: slice.key,
    label: costLabel(slice.key),
    value: slice.cents,
    color: COST_COLORS[slice.key] ?? SLICE_COLORS[(index + 3) % SLICE_COLORS.length] ?? SLICE_COLORS[0]!,
  })),
)

const dailyPoints = computed(() =>
  (report.value?.daily ?? []).map((point) => ({ label: formatDayLabel(point.day), value: point.netCents })),
)

const dailyAverage = computed(() => {
  const points = report.value?.daily.filter((point) => point.km > 0 || point.grossCents > 0) ?? []
  if (points.length === 0) return undefined
  const total = points.reduce((sum, point) => sum + point.netCents, 0)
  return `média por dia trabalhado: ${formatMoney(Math.round(total / points.length))}`
})

const monthPoints = computed(() =>
  monthly.value.map((month) => ({ label: formatMonthLabel(month.month, true), value: month.netCents })),
)

const items = computed<EntryItem[]>(() => {
  const entries = report.value?.entries
  if (!entries) return []

  const list: EntryItem[] = [
    ...entries.earnings.map((earning) => ({
      key: `earning-${earning.id}`,
      kind: 'earning' as const,
      id: earning.id,
      createdAt: earning.createdAt,
      title: platformName(earning.platformId),
      subtitle: joinParts(formatDayLabel(earning.day), formatTime(earning.createdAt)),
      value: `+ ${formatMoney(earning.amountCents + earning.tipCents)}`,
      valueClass: 'text-primary',
      icon: 'mdi-cash-plus',
      color: 'primary',
    })),
    ...entries.expenses.map((expense) => ({
      key: `expense-${expense.id}`,
      kind: 'expense' as const,
      id: expense.id,
      createdAt: expense.createdAt,
      title: EXPENSE_CATEGORY_LABELS[expense.category],
      subtitle: joinParts(formatDayLabel(expense.day), expense.description || null),
      value: `− ${formatMoney(expense.amountCents)}`,
      valueClass: 'text-error',
      icon: 'mdi-cash-minus',
      color: 'error',
    })),
    ...entries.fuelings.map((fueling) => ({
      key: `fueling-${fueling.id}`,
      kind: 'fueling' as const,
      id: fueling.id,
      createdAt: fueling.createdAt,
      title: `Abastecimento · ${FUEL_TYPE_LABELS[fueling.fuelType]}`,
      subtitle: joinParts(formatDayLabel(fueling.day), formatLiters(fueling.liters), `${formatRate(fueling.pricePerLiterCents)}/l`),
      value: formatMoney(fueling.totalCents),
      valueClass: '',
      icon: 'mdi-gas-station',
      color: 'fuel',
    })),
  ]

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

function joinParts(...parts: (string | null)[]): string {
  return parts.filter((part) => part).join(' · ')
}

// ---------- editar ----------

const editorOpen = ref(false)
const editing = ref<EntryItem | null>(null)
const editEarning = reactive({ platformId: '', amountCents: null as number | null, tipCents: null as number | null })
const editExpense = reactive({ category: 'food' as ExpenseCategory, amountCents: null as number | null, description: '' })
const editFueling = reactive({
  fuelType: 'gasoline' as FuelType,
  totalCents: null as number | null,
  liters: null as number | null,
  odometerKm: null as number | null,
  fullTank: true,
})

const platformItems = computed(() => platforms.value.map((platform) => ({ title: platform.name, value: platform.id })))
const categoryItems = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, title]) => ({ title, value }))
const allowEthanol = computed(() => session.motorcycle?.fuelSupport === 'flex')

function findEarning(id: string): Earning | undefined {
  return report.value?.entries.earnings.find((earning) => earning.id === id)
}

function openEditor(item: EntryItem) {
  editing.value = item

  if (item.kind === 'earning') {
    const earning = findEarning(item.id)
    if (!earning) return
    Object.assign(editEarning, { platformId: earning.platformId, amountCents: earning.amountCents, tipCents: earning.tipCents })
  } else if (item.kind === 'expense') {
    const expense = report.value?.entries.expenses.find((current) => current.id === item.id)
    if (!expense) return
    Object.assign(editExpense, { category: expense.category, amountCents: expense.amountCents, description: expense.description })
  } else {
    const fueling = report.value?.entries.fuelings.find((current) => current.id === item.id)
    if (!fueling) return
    Object.assign(editFueling, {
      fuelType: fueling.fuelType,
      totalCents: fueling.totalCents,
      liters: fueling.liters,
      odometerKm: fueling.odometerKm,
      fullTank: fueling.fullTank,
    })
  }

  editorOpen.value = true
}

async function onSaveEdit() {
  const item = editing.value
  if (!item) return

  const ok = await run(async () => {
    if (item.kind === 'earning') {
      const earning = findEarning(item.id)
      if (!earning) return
      await updateEarning({
        ...earning,
        platformId: editEarning.platformId,
        amountCents: editEarning.amountCents ?? 0,
        tipCents: editEarning.tipCents ?? 0,
      })
    } else if (item.kind === 'expense') {
      const expense = report.value?.entries.expenses.find((current) => current.id === item.id)
      if (!expense) return
      await updateExpense({
        ...expense,
        category: editExpense.category,
        amountCents: editExpense.amountCents ?? 0,
        description: editExpense.description,
      })
    } else {
      const fueling: Fueling | undefined = report.value?.entries.fuelings.find((current) => current.id === item.id)
      if (!fueling) return
      await updateFueling({
        ...fueling,
        fuelType: editFueling.fuelType,
        totalCents: editFueling.totalCents ?? 0,
        liters: editFueling.liters ?? 0,
        odometerKm: editFueling.odometerKm,
        fullTank: editFueling.fullTank,
      })
    }
    await load()
  }, 'Lançamento atualizado')

  if (ok) editorOpen.value = false
}

async function onRemove(item: EntryItem) {
  if (!window.confirm(`Excluir "${item.title}" (${item.value})?`)) return
  await run(async () => {
    await removeEntry(item.kind, item.id)
    await load()
  }, 'Lançamento excluído')
}
</script>
