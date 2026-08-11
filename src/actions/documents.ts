'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Folder, Document } from '@/types'

export async function getFolders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getFolders error:', error)
    return []
  }
  return data as Folder[]
}

export async function getDocuments(folderId?: string) {
  const supabase = await createClient()
  let query = supabase.from('documents').select('*')
  
  if (folderId) {
    query = query.eq('folder_id', folderId)
  } else {
    query = query.is('folder_id', null)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('getDocuments error:', error)
    return []
  }
  return data as Document[]
}

export async function createFolderRecord(name: string, parentId?: string, type = 'general') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('folders').insert({
    name,
    parent_id: parentId || null,
    type,
    created_by: user.id,
  })

  if (error) throw error
  revalidatePath('/documents')
}

export async function registerDocumentRecord(docData: {
  name: string
  file_url: string
  file_type: string
  file_size: number
  folder_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('documents').insert({
    ...docData,
    folder_id: docData.folder_id || null,
    uploaded_by: user.id,
  })

  if (error) throw error
  revalidatePath('/documents')
}

export async function deleteDocumentRecord(id: string, fileUrl: string) {
  const supabase = await createClient()
  
  // 1. Remove from database
  const { error: dbErr } = await supabase.from('documents').delete().eq('id', id)
  if (dbErr) throw dbErr

  // 2. Extract path from storage URL and delete from bucket
  // fileUrl example: https://pdjecphrflnarbhkkpwu.supabase.co/storage/v1/object/public/documents/folder/file.pdf
  try {
    const parts = fileUrl.split('/storage/v1/object/public/documents/')
    if (parts.length > 1) {
      const storagePath = decodeURIComponent(parts[1])
      await supabase.storage.from('documents').remove([storagePath])
    }
  } catch (err) {
    console.error('Failed to remove storage object:', err)
  }

  revalidatePath('/documents')
}
