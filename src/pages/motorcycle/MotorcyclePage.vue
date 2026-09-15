<template>
  <div class="d-flex flex-column ga-4">
    <v-alert
      v-if="!current"
      type="info"
      variant="tonal"
      title="Cadastre sua moto"
      text="O consumo entra no cálculo do combustível e do lucro. Dá para mudar tudo depois."
    />

    <v-card v-if="current && !switching" flat class="border pa-4">
      <div class="text-overline">Moto atual</div>
      <div class="text-h6 font-weight-bold">{{ current.brand }} {{ current.model }}</div>
      <div class="text-body-2 text-medium-emphasis">Consumo medido: {{ measuredText }}</div>
    </v-card>

    <v-card flat class="border pa-4">
      <div class="text-overline mb-2">{{ formTitle }}</div>

      <v-row dense>
        <v-col cols="6">
          <v-text-field v-model="form.brand" label="Marca" autocapitalize="words" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="form.model" label="Modelo" autocapitalize="words" />
        </v-col>
        <v-col cols="6">
          <McNumberField v-model="form.year" label="Ano (opcional)" />
        </v-col>
        <v-col cols="6">
          <McNumberField v-model="form.tankLiters" label="Tanque (opcional)" suffix="l" :decimals="1" />
        </v-col>
      </v-row>

      <v-switch v-model="isFlex" color="primary" inset hide-details label="Moto flex (aceita etanol)" class="mb-3" />

      <McNumberField v-model="form.kmPerLiterGasoline" label="Consumo com gasolina" suffix="km/l" :decimals="1" />
      <McNumberField
        v-if="isFlex"
        v-model="form.kmPerLiterEthanol"
        label="Consumo com etanol"
        suffix="km/l"
        :decimals="1"
        hint="Em geral uns 30% menor que na gasolina."
        persistent-hint
      />

      <v-switch
        v-model="form.useMeasuredConsumption"
        color="primary"
        inset
        label="Usar o consumo medido quando houver"
        hint="Medido pelos abastecimentos de tanque cheio — costuma ser mais real que o do fabricante."
        persistent-hint
      />

      <v-btn block size="large" color="primary" class="mt-4" :loading="saving" @click="onSave">{{ saveLabel }}</v-btn>
      <v-btn v-if="switching" block variant="text" class="mt-2" @click="cancelSwitch">Cancelar</v-btn>
    </v-card>

    <template v-if="current && !switching">
      <v-btn variant="tonal" prepend-icon="mdi-swap-horizontal" @click="startSwitch">Trocar de moto</v-btn>
      <p class="text-caption text-medium-emphasis mb-0">
        Ao trocar, os turnos já encerrados continuam com os valores da moto antiga.
      </p>
    </template>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { getMeasuredConsumption, registerMotorcycle, updateMotorcycle, type MeasuredConsumption } from '@/actions/motorcycle'
import McNumberField from '@/components/McNumberField.vue'
import type { Motorcycle } from '@/domain/entities'
import type { MotorcycleInput } from '@/domain/validation'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { formatKmPerLiter } from '@/lib/format'
import { useSessionStore } from '@/stores/session'

type MotorcycleForm = Omit<MotorcycleInput, 'fuelSupport'>

const session = useSessionStore()
const router = useRouter()
const { saving, snackbar, run } = useAsyncAction()

const current = computed(() => session.motorcycle)
const switching = ref(false)
const measured = ref<MeasuredConsumption | null>(null)
const isFlex = ref(true)

const form = reactive<MotorcycleForm>(emptyForm())

function emptyForm(): MotorcycleForm {
  return {
    brand: '',
    model: '',
    year: null,
    tankLiters: null,
    kmPerLiterGasoline: null,
    kmPerLiterEthanol: null,
    useMeasuredConsumption: true,
  }
}

function fillFrom(motorcycle: Motorcycle | null) {
  if (!motorcycle) {
    Object.assign(form, emptyForm())
    isFlex.value = true
    return
  }
  Object.assign(form, {
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year,
    tankLiters: motorcycle.tankLiters,
    kmPerLiterGasoline: motorcycle.kmPerLiterGasoline,
    kmPerLiterEthanol: motorcycle.kmPerLiterEthanol,
    useMeasuredConsumption: motorcycle.useMeasuredConsumption,
  })
  isFlex.value = motorcycle.fuelSupport === 'flex'
}

onMounted(async () => {
  await session.loadMotorcycle()
  fillFrom(current.value)
  if (current.value) measured.value = await getMeasuredConsumption(current.value.id)
})

const formTitle = computed(() => (switching.value ? 'Nova moto' : current.value ? 'Ficha da moto' : 'Sua moto'))
const saveLabel = computed(() => (switching.value ? 'Trocar para esta moto' : current.value ? 'Salvar ficha' : 'Cadastrar moto'))

const measuredText = computed(() => {
  const value = measured.value
  if (!value || (value.gasoline === null && value.ethanol === null)) return 'ainda sem medição (abasteça com tanque cheio e informe o km)'
  const parts = [
    value.gasoline !== null ? `gasolina ${formatKmPerLiter(value.gasoline)}` : null,
    value.ethanol !== null ? `etanol ${formatKmPerLiter(value.ethanol)}` : null,
  ]
  return parts.filter((part) => part).join(' · ')
})

async function onSave() {
  const input: MotorcycleInput = { ...form, fuelSupport: isFlex.value ? 'flex' : 'gasoline' }
  const editing = current.value !== null && !switching.value
  const firstMotorcycle = current.value === null
  const message = switching.value ? 'Moto trocada' : firstMotorcycle ? 'Moto cadastrada' : 'Ficha da moto salva'

  const ok = await run(async () => {
    if (editing && current.value) await updateMotorcycle(current.value.id, input)
    else await registerMotorcycle(input)
    await session.loadMotorcycle(true)
  }, message)
  if (!ok) return

  switching.value = false
  fillFrom(current.value)
  measured.value = current.value ? await getMeasuredConsumption(current.value.id) : null
  if (firstMotorcycle) await router.replace({ name: 'today' })
}

function startSwitch() {
  if (!window.confirm('Trocar de moto? A atual fica no histórico e os próximos turnos usam a nova.')) return
  switching.value = true
  fillFrom(null)
}

function cancelSwitch() {
  switching.value = false
  fillFrom(current.value)
}
</script>
