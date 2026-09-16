<template>
  <div class="d-flex flex-column ga-4">
    <!-- Manutenção vencendo (ADR-0013: aviso dentro do app, sem push) -->
    <McAlertBanner
      v-if="maintenanceAlert"
      :type="maintenanceAlert.type"
      :title="maintenanceAlert.title"
      :text="maintenanceAlert.text"
      action-label="Ver"
      :to="{ name: 'maintenance' }"
    />

    <!-- Turno -->
    <v-card flat class="border pa-4">
      <template v-if="store.openShift">
        <div class="d-flex align-start justify-space-between">
          <div>
            <div class="text-overline text-primary">Turno em andamento</div>
            <div class="text-body-2 text-medium-emphasis">
              Desde {{ formatTime(store.openShift.startedAt) }} · km inicial {{ formatKm(store.openShift.kmStart) }}
            </div>
          </div>
          <v-icon icon="mdi-motorbike" color="primary" size="32" />
        </div>

        <McNumberField
          v-model="kmEnd"
          class="mt-4"
          label="Km final (odômetro)"
          suffix="km"
          :error-messages="kmEndError"
        />
        <v-alert
          v-if="isLongShift"
          class="mb-4"
          type="warning"
          variant="tonal"
          density="compact"
          text="Mais de 500 km neste turno — confira o km final."
        />
        <v-btn
          block
          size="large"
          color="primary"
          prepend-icon="mdi-flag-checkered"
          :loading="saving"
          :disabled="!canEndShift"
          @click="onEndShift"
        >
          Encerrar turno
        </v-btn>
      </template>

      <template v-else>
        <div class="text-overline">Nenhum turno em andamento</div>
        <McNumberField v-model="kmStart" class="mt-2" label="Km inicial (odômetro)" suffix="km" />
        <v-btn
          block
          size="large"
          color="primary"
          prepend-icon="mdi-play"
          :loading="saving"
          :disabled="kmStart === null"
          @click="onStartShift"
        >
          Iniciar turno
        </v-btn>
      </template>
    </v-card>

    <!-- Números do dia -->
    <template v-if="summary">
      <McStatCard
        highlight
        title="Quanto guardar hoje"
        icon="mdi-piggy-bank-outline"
        :value="formatMoney(summary.toSaveCents)"
        caption="Reserva de manutenção pelos km rodados (o combustível você paga no posto)"
      />

      <v-row dense>
        <v-col cols="6">
          <McStatCard title="Ganhos" icon="mdi-cash-plus" :value="formatMoney(summary.grossCents)" />
        </v-col>
        <v-col cols="6">
          <McStatCard title="Lucro líquido" icon="mdi-wallet-outline" :value="formatMoney(summary.netProfitCents)" />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Combustível"
            icon="mdi-gas-station"
            color="fuel"
            :value="formatMoney(summary.fuelCostCents)"
            caption="abastecido hoje"
          />
        </v-col>
        <v-col cols="6">
          <McStatCard title="Gastos" icon="mdi-cash-minus" color="error" :value="formatMoney(summary.expensesCents)" />
        </v-col>
        <v-col cols="6">
          <McStatCard
            title="Km rodados"
            icon="mdi-map-marker-distance"
            color="secondary"
            :value="formatKm(summary.km)"
            :caption="perKmCaption"
          />
        </v-col>
      </v-row>

      <v-alert
        v-if="summary.missingConsumption"
        type="warning"
        variant="tonal"
        density="compact"
        text="Consumo da moto não informado para o combustível usado: a estimativa por km ficou incompleta."
      />
      <p v-if="summary.openShifts > 0" class="text-caption text-medium-emphasis mb-0">
        A reserva de manutenção do turno em andamento entra quando você encerrar.
      </p>
      <p v-if="fuelContextText" class="text-caption text-medium-emphasis mb-0">{{ fuelContextText }}</p>
    </template>

    <!-- Lançamentos -->
    <v-card flat class="border">
      <v-card-title class="d-flex align-center">
        Lançamentos de hoje
        <v-spacer />
        <v-btn to="/novo" color="primary" variant="tonal" size="small" prepend-icon="mdi-plus">Novo</v-btn>
      </v-card-title>

      <v-list v-if="items.length" lines="two">
        <v-list-item v-for="item in items" :key="item.key" :title="item.title" :subtitle="item.subtitle">
          <template #prepend>
            <v-avatar :color="item.color" variant="tonal">
              <v-icon :icon="item.icon" />
            </v-avatar>
          </template>
          <template #append>
            <span class="font-weight-bold mr-1" :class="item.valueClass">{{ item.value }}</span>
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
      <v-card-text v-else class="text-medium-emphasis">Nada lançado hoje ainda.</v-card-text>

      <v-card-text v-if="store.fuelings.length" class="pt-0 text-caption text-medium-emphasis">
        O abastecimento entra no lucro pelo valor pago, no dia em que foi lançado.
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import McAlertBanner from '@/components/McAlertBanner.vue'
import McNumberField from '@/components/McNumberField.vue'
import McStatCard from '@/components/McStatCard.vue'
import { LONG_SHIFT_KM } from '@/domain/calculators/shift'
import { EXPENSE_CATEGORY_LABELS, FUEL_TYPE_LABELS } from '@/domain/entities'
import type { EntryKind } from '@/actions/entries'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { formatKm, formatKmPerLiter, formatLiters, formatMoney, formatRate, formatTime } from '@/lib/format'
import { useMaintenanceStore } from '@/stores/maintenance'
import { useTodayStore } from '@/stores/today'

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

const store = useTodayStore()
const maintenance = useMaintenanceStore()
const { saving, snackbar, run } = useAsyncAction()

const kmStart = ref<number | null>(null)
const kmEnd = ref<number | null>(null)

onMounted(async () => {
  await store.load()
  await maintenance.load()
})

/** Aviso de manutenção: vencido em vermelho, perto de vencer em amarelo. */
const maintenanceAlert = computed(() => {
  const urgent = maintenance.mostUrgent
  if (!urgent || urgent.status.state === 'ok') return null

  const overdue = urgent.status.state === 'overdue'
  const others = maintenance.alerts - 1
  const extra = others > 0 ? ` (e mais ${others})` : ''

  return {
    type: overdue ? ('error' as const) : ('warning' as const),
    title: overdue ? `${urgent.item.name} vencido${extra}` : `${urgent.item.name} está perto${extra}`,
    text: overdue
      ? `Passou ${formatKm(Math.max(0, -urgent.status.kmLeft))} do intervalo.`
      : `Faltam ${formatKm(Math.max(0, urgent.status.kmLeft))} para a troca.`,
  }
})

// Sugere o km final do último turno como km inicial do próximo.
watch(
  () => store.lastKm,
  (km) => {
    if (kmStart.value === null && km !== null) kmStart.value = km
  },
  { immediate: true },
)

const summary = computed(() => store.summary)

const kmEndError = computed(() => {
  const shift = store.openShift
  return shift && kmEnd.value !== null && kmEnd.value < shift.kmStart ? 'Menor que o km inicial' : undefined
})

const isLongShift = computed(() => {
  const shift = store.openShift
  return !!shift && kmEnd.value !== null && kmEnd.value - shift.kmStart > LONG_SHIFT_KM
})

const canEndShift = computed(() => kmEnd.value !== null && !kmEndError.value)

const perKmCaption = computed(() => {
  const perKm = summary.value?.grossPerKmCents
  return perKm === null || perKm === undefined ? undefined : `${formatRate(perKm, 2)}/km de ganho`
})

const fuelContextText = computed(() => {
  const context = store.fuelContext
  if (!context) return null
  const consumption = context.kmPerLiter === null ? 'consumo não informado' : formatKmPerLiter(context.kmPerLiter)
  return `Estimativa por km: ${FUEL_TYPE_LABELS[context.fuelType]} · ${consumption}${context.measured ? ' (medido)' : ''} · ${formatRate(context.pricePerLiterCents)}/l`
})

const items = computed<EntryItem[]>(() => {
  const list: EntryItem[] = [
    ...store.earnings.map((earning) => ({
      key: `earning-${earning.id}`,
      kind: 'earning' as const,
      id: earning.id,
      createdAt: earning.createdAt,
      title: store.platformName(earning.platformId),
      subtitle: joinParts(
        formatTime(earning.createdAt),
        earning.tipCents > 0 ? `inclui ${formatMoney(earning.tipCents)} de gorjeta` : null,
      ),
      value: `+ ${formatMoney(earning.amountCents + earning.tipCents)}`,
      valueClass: 'text-primary',
      icon: 'mdi-cash-plus',
      color: 'primary',
    })),
    ...store.expenses.map((expense) => ({
      key: `expense-${expense.id}`,
      kind: 'expense' as const,
      id: expense.id,
      createdAt: expense.createdAt,
      title: EXPENSE_CATEGORY_LABELS[expense.category],
      subtitle: joinParts(formatTime(expense.createdAt), expense.description || null),
      value: `− ${formatMoney(expense.amountCents)}`,
      valueClass: 'text-error',
      icon: 'mdi-cash-minus',
      color: 'error',
    })),
    ...store.fuelings.map((fueling) => ({
      key: `fueling-${fueling.id}`,
      kind: 'fueling' as const,
      id: fueling.id,
      createdAt: fueling.createdAt,
      title: `Abastecimento · ${FUEL_TYPE_LABELS[fueling.fuelType]}`,
      subtitle: joinParts(
        formatTime(fueling.createdAt),
        formatLiters(fueling.liters),
        `${formatRate(fueling.pricePerLiterCents)}/l`,
        fueling.fullTank ? 'tanque cheio' : null,
      ),
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

async function onStartShift() {
  const km = kmStart.value
  if (km === null) return
  await run(() => store.startShift(km), 'Turno iniciado. Bom trabalho!')
}

async function onEndShift() {
  const km = kmEnd.value
  if (km === null) return
  const ok = await run(() => store.endShift(km), 'Turno encerrado')
  if (ok) {
    kmStart.value = km
    kmEnd.value = null
  }
}

async function onRemove(item: EntryItem) {
  if (!window.confirm(`Excluir "${item.title}" (${item.value})?`)) return
  await run(() => store.removeEntry(item.kind, item.id), 'Lançamento excluído')
}
</script>
