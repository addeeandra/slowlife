import { ref } from 'vue'
import type { Asset } from '../core/types'

export interface AssetContext {
  space_id: string
  category_id: string
  project_id: string | null
}

const formOpen = ref(false)
const editingAsset = ref<Asset | null>(null)
const draftContext = ref<AssetContext | null>(null)

export function useAssetDialog() {
  function openNewWithContext(context: AssetContext) {
    editingAsset.value = null
    draftContext.value = context
    formOpen.value = true
  }

  function openEdit(asset: Asset, context?: AssetContext) {
    editingAsset.value = asset
    draftContext.value = context || {
      space_id: asset.space_id,
      category_id: asset.category_id,
      project_id: asset.project_id,
    }
    formOpen.value = true
  }

  function closeForm() {
    formOpen.value = false
    editingAsset.value = null
    draftContext.value = null
  }

  return {
    formOpen,
    editingAsset,
    draftContext,
    openNewWithContext,
    openEdit,
    closeForm,
  }
}
