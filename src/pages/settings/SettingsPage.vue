<template>
  <div class="d-flex flex-column ga-4">
    <!-- Conta e moto -->
    <v-card flat class="border">
      <v-list class="py-0">
        <v-list-item prepend-icon="mdi-account-circle-outline" :title="session.user?.name || 'Sua conta'" :subtitle="accountSubtitle" />
        <v-divider />
        <v-list-item
          prepend-icon="mdi-motorbike"
          title="Minha moto"
          :subtitle="motorcycleText"
          append-icon="mdi-chevron-right"
          :to="{ name: 'motorcycle' }"
        />
      </v-list>
    </v-card>

    <!-- Combustível e manutenção -->
    <v-card flat class="border pa-4">
      <div class="text-overline">Combustível e manutenção</div>
      <p class="text-caption text-medium-emphasis mb-3">
        Preços usados enquanto não há abastecimento daquele combustível. A reserva vale até os itens de manutenção
        serem cadastrados.
      </p>

      <McNumberField v-model="gasolinePrice" label="Gasolina — preço padrão" prefix="R$" suffix="/l" :decimals="3" />
      <McNumberField v-model="ethanolPrice" label="Etanol — preço padrão" prefix="R$" suffix="/l" :decimals="3" />
      <McCurrencyField v-model="reservePer100KmCents" label="Reserva de manutenção a cada 100 km" />

      <v-btn block color="primary" :loading="saving" :disabled="!canSaveSettings" @click="onSaveSettings">Salvar</v-btn>
    </v-card>

    <!-- Plataformas -->
    <v-card flat class="border pa-4">
      <div class="text-overline">Plataformas</div>
      <p class="text-caption text-medium-emphasis mb-1">Desativar esconde no lançamento, mas mantém o histórico.</p>

      <v-list density="compact" class="py-0">
        <v-list-item v-for="platform in platforms" :key="platform.id" :title="platform.name" class="px-0">
          <template #append>
            <v-switch
              :model-value="platform.isActive"
              color="primary"
              inset
              hide-details
              density="compact"
              :aria-label="`${platform.isActive ? 'Desativar' : 'Ativar'} ${platform.name}`"
              @update:model-value="onTogglePlatform(platform, $event)"
            />
          </template>
        </v-list-item>
      </v-list>

      <div class="d-flex align-start ga-2 mt-2">
        <v-text-field v-model="newPlatform" label="Nova plataforma" maxlength="30" hide-details @keyup.enter="onAddPlatform" />
        <v-btn color="primary" variant="tonal" height="48" :disabled="!newPlatform.trim()" :loading="saving" @click="onAddPlatform">
          Adicionar
        </v-btn>
      </div>
    </v-card>

    <v-btn variant="tonal" color="error" prepend-icon="mdi-logout" :loading="signingOut" @click="onSignOut">Sair da conta</v-btn>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { addPlatform, getSettings, listAllPlatforms, saveSettings, setPlatformActive } from '@/actions/settings'
import McCurrencyField from '@/components/McCurrencyField.vue'
import McNumberField from '@/components/McNumberField.vue'
import type { Platform } from '@/domain/entities'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const router = useRouter()
const { saving, snackbar, run } = useAsyncAction()

/** Preços em reais com até 3 casas (6,199) na tela; em centavos com fração (619,9) no domínio. */
const gasolinePrice = ref<number | null>(null)
const ethanolPrice = ref<number | null>(null)
const reservePer100KmCents = ref<number | null>(null)
const platforms = ref<Platform[]>([])
const newPlatform = ref('')
const signingOut = ref(false)

const accountSubtitle = computed(() =>
  session.isLocalMode ? 'Modo local — dados só neste aparelho' : (session.user?.email ?? ''),
)
const motorcycleText = computed(() =>
  session.motorcycle ? `${session.motorcycle.brand} ${session.motorcycle.model}` : 'Não cadastrada',
)
const canSaveSettings = computed(
  () => gasolinePrice.value !== null && ethanolPrice.value !== null && reservePer100KmCents.value !== null,
)

const toPriceCents = (reais: number) => Math.round(reais * 1000) / 10
const toReais = (cents: number) => Math.round(cents * 10) / 1000

onMounted(async () => {
  void session.loadMotorcycle()
  const [settings, list] = await Promise.all([getSettings(), listAllPlatforms()])
  gasolinePrice.value = toReais(settings.defaultGasolinePriceCents)
  ethanolPrice.value = toReais(settings.defaultEthanolPriceCents)
  reservePer100KmCents.value = settings.maintenanceReservePer100KmCents
  platforms.value = list
})

async function reloadPlatforms() {
  platforms.value = await listAllPlatforms()
}

async function onSaveSettings() {
  if (gasolinePrice.value === null || ethanolPrice.value === null || reservePer100KmCents.value === null) return
  const settings = {
    defaultGasolinePriceCents: toPriceCents(gasolinePrice.value),
    defaultEthanolPriceCents: toPriceCents(ethanolPrice.value),
    maintenanceReservePer100KmCents: reservePer100KmCents.value,
  }
  await run(() => saveSettings(settings), 'Ajustes salvos')
}

async function onAddPlatform() {
  const name = newPlatform.value
  if (!name.trim()) return
  const ok = await run(async () => {
    await addPlatform(name)
    await reloadPlatforms()
  }, 'Plataforma adicionada')
  if (ok) newPlatform.value = ''
}

async function onTogglePlatform(platform: Platform, value: unknown) {
  await run(async () => {
    await setPlatformActive(platform, value === true)
    await reloadPlatforms()
  })
}

async function onSignOut() {
  signingOut.value = true
  const ok = await run(() => session.signOut())
  signingOut.value = false
  if (ok) await router.replace({ name: 'login' })
}
</script>
