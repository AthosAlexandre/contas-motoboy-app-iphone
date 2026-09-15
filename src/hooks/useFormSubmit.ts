/**
 * Envio de formulário com carregamento e erro exibido no próprio formulário (telas de conta).
 */
import { ref } from 'vue'

import { errorMessage } from '@/hooks/errorMessage'

export function useFormSubmit() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Retorna `true` se deu certo. */
  async function submit(task: () => Promise<unknown>): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await task()
      return true
    } catch (caught) {
      console.error(caught)
      error.value = errorMessage(caught)
      return false
    } finally {
      loading.value = false
    }
  }

  return { loading, error, submit }
}
