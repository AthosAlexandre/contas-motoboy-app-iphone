<template>
  <div class="d-flex flex-column ga-4">
    <v-btn-toggle v-model="kind" mandatory divided variant="outlined" color="primary" rounded="lg" class="w-100">
      <v-btn value="earning" class="flex-grow-1" prepend-icon="mdi-cash-plus">Ganho</v-btn>
      <v-btn value="expense" class="flex-grow-1" prepend-icon="mdi-cash-minus">Gasto</v-btn>
      <v-btn value="fueling" class="flex-grow-1" prepend-icon="mdi-gas-station">Abastecer</v-btn>
    </v-btn-toggle>

    <!-- Ganho -->
    <v-card v-if="kind === 'earning'" flat class="border pa-4">
      <div class="text-body-2 text-medium-emphasis mb-1">Plataforma</div>
      <v-chip-group v-model="earning.platformId" mandatory column selected-class="text-primary">
        <v-chip v-for="platform in store.platforms" :key="platform.id" :value="platform.id" filter variant="outlined" size="large">
          {{ platform.name }}
        </v-chip>
      </v-chip-group>

      <McCurrencyField v-model="earning.amountCents" class="mt-3" label="Valor recebido" />
      <McCurrencyField v-model="earning.tipCents" label="Gorjeta (opcional)" />

      <v-btn block size="large" color="primary" :loading="saving" :disabled="!canSaveEarning" @click="saveEarning">
        Salvar ganho
      </v-btn>
    </v-card>

    <!-- Gasto -->
    <v-card v-else-if="kind === 'expense'" flat class="border pa-4">
      <div class="text-body-2 text-medium-emphasis mb-1">Categoria</div>
      <v-chip-group v-model="expense.category" mandatory column selected-class="text-primary">
        <v-chip v-for="[value, label] in expenseCategories" :key="value" :value="value" filter variant="outlined">
          {{ label }}
        </v-chip>
      </v-chip-group>

      <McCurrencyField v-model="expense.amountCents" class="mt-3" label="Valor" />
      <v-text-field v-model="expense.description" label="Descrição (opcional)" maxlength="80" />

      <v-btn block size="large" color="primary" :loading="saving" :disabled="expense.amountCents === null" @click="saveExpense">
        Salvar gasto
      </v-btn>
    </v-card>

    <!-- Abastecimento -->
    <v-card v-else flat class="border pa-4">
      <McFuelTypeToggle v-model="fueling.fuelType" :allow-ethanol="allowEthanol" />

      <McCurrencyField v-model="fueling.totalCents" class="mt-4" label="Valor total pago" />
      <McNumberField v-model="fueling.liters" label="Litros colocados" suffix="l" :decimals="3" :hint="pricePreview" persistent-hint />
      <McNumberField v-model="fueling.odometerKm" class="mt-2" label="Km no odômetro (opcional)" suffix="km" />

      <v-switch
        v-model="fueling.fullTank"
        color="primary"
        inset
        label="Completei o tanque"
        hint="Com o tanque cheio e o km do odômetro, o app mede o consumo real da moto."
        persistent-hint
      />

      <v-btn block size="large" color="primary" class="mt-4" :loading="saving" :disabled="!canSaveFueling" @click="saveFueling">
        Salvar abastecimento
      </v-btn>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import McCurrencyField from '@/components/McCurrencyField.vue'
import McFuelTypeToggle from '@/components/McFuelTypeToggle.vue'
import McNumberField from '@/components/McNumberField.vue'
import { pricePerLiterCents } from '@/domain/calculators/fuel'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory, type FuelType } from '@/domain/entities'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { formatRate } from '@/lib/format'
import { useTodayStore } from '@/stores/today'

type Kind = 'earning' | 'expense' | 'fueling'

const store = useTodayStore()
const { saving, snackbar, run } = useAsyncAction()

const kind = ref<Kind>('earning')

const earning = reactive({
  platformId: null as string | null,
  amountCents: null as number | null,
  tipCents: null as number | null,
})

const expense = reactive({
  category: 'food' as ExpenseCategory,
  amountCents: null as number | null,
  description: '',
})

const fueling = reactive({
  fuelType: 'gasoline' as FuelType,
  totalCents: null as number | null,
  liters: null as number | null,
  odometerKm: null as number | null,
  fullTank: true,
})

const expenseCategories = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]

onMounted(() => store.load())

// Primeira plataforma já vem selecionada.
watch(
  () => store.platforms,
  (platforms) => {
    if (!earning.platformId && platforms[0]) earning.platformId = platforms[0].id
  },
  { immediate: true },
)

// Combustível sugerido = o último usado.
watch(
  () => store.fuelContext?.fuelType,
  (fuelType) => {
    if (fuelType && fueling.totalCents === null) fueling.fuelType = fuelType
  },
  { immediate: true },
)

const allowEthanol = computed(() => store.motorcycle?.fuelSupport === 'flex')

const canSaveEarning = computed(() => earning.platformId !== null && earning.amountCents !== null)
const canSaveFueling = computed(() => fueling.totalCents !== null && fueling.liters !== null && fueling.liters > 0)

const pricePreview = computed(() => {
  if (fueling.totalCents === null || fueling.liters === null) return undefined
  const price = pricePerLiterCents(fueling.totalCents, fueling.liters)
  return price === null ? undefined : `Preço por litro: ${formatRate(price)}`
})

async function saveEarning() {
  const { platformId, amountCents } = earning
  if (platformId === null || amountCents === null) return
  const ok = await run(() => store.addEarning({ platformId, amountCents, tipCents: earning.tipCents ?? 0 }), 'Ganho salvo')
  if (ok) Object.assign(earning, { amountCents: null, tipCents: null })
}

async function saveExpense() {
  const { amountCents } = expense
  if (amountCents === null) return
  const ok = await run(
    () => store.addExpense({ category: expense.category, amountCents, description: expense.description }),
    'Gasto salvo',
  )
  if (ok) Object.assign(expense, { amountCents: null, description: '' })
}

async function saveFueling() {
  const { totalCents, liters } = fueling
  if (totalCents === null || liters === null) return
  const ok = await run(
    () =>
      store.addFueling({
        fuelType: fueling.fuelType,
        totalCents,
        liters,
        odometerKm: fueling.odometerKm,
        fullTank: fueling.fullTank,
      }),
    'Abastecimento salvo',
  )
  if (ok) Object.assign(fueling, { totalCents: null, liters: null, odometerKm: null, fullTank: true })
}
</script>
