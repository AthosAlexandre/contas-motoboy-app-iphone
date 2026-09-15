/**
 * Executa uma ação da tela com estado de carregamento e aviso (snackbar) de sucesso ou erro.
 * Erros de regra de negócio (DomainError) mostram a própria mensagem.
 */
import { reactive, ref } from 'vue'

import { errorMessage } from '@/hooks/errorMessage'

export function useAsyncAction() {
  const saving = ref(false)
  const snackbar = reactive({ show: false, text: '', color: 'success' })

  function notify(text: string, color: 'success' | 'error' = 'success') {
    Object.assign(snackbar, { show: true, text, color })
  }

  /** Retorna `true` se deu certo. */
  async function run(task: () => Promise<unknown>, successMessage?: string): Promise<boolean> {
    saving.value = true
    try {
      await task()
      if (successMessage) notify(successMessage)
      return true
    } catch (error) {
      console.error(error)
      notify(errorMessage(error), 'error')
      return false
    } finally {
      saving.value = false
    }
  }

  return { saving, snackbar, notify, run }
}
