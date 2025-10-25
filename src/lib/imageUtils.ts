// Утилиты для работы с изображениями
import { supabase } from '@/lib/supabaseClient'
import type { ImageCategory, ImageUploadResult } from '@/lib/imageTypes'

// Конфигурация хранилища
const STORAGE_BUCKET = 'images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Реэкспорт типов для обратной совместимости
export type { ImageCategory, ImageUploadResult }

// === ЗАГРУЗКА ИЗОБРАЖЕНИЙ ===

/**
 * Загружает изображение в Supabase Storage
 */
export async function uploadImage(
  file: File, 
  category: ImageCategory,
  userId?: string
): Promise<ImageUploadResult> {
  try {
    // Валидация файла
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomId}.${fileExtension}`
    
    // Путь к файлу в хранилище
    const filePath = `${category}/${userId ? `${userId}/` : ''}${fileName}`

    // Загружаем файл
  const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      })

    if (error) {
      console.error('Ошибка загрузки изображения:', error)
      return { success: false, error: error.message || 'Ошибка загрузки файла' }
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    }
  } catch (error: any) {
    console.error('Ошибка загрузки изображения:', error)
    return { success: false, error: 'Неожиданная ошибка при загрузке' }
  }
}

/**
 * Загружает несколько изображений
 */
export async function uploadMultipleImages(
  files: File[],
  category: ImageCategory,
  userId?: string
): Promise<ImageUploadResult[]> {
  const uploadPromises = files.map(file => uploadImage(file, category, userId))
  return Promise.all(uploadPromises)
}

// === УДАЛЕНИЕ ИЗОБРАЖЕНИЙ ===

/**
 * Удаляет изображение из хранилища
 */
export async function deleteImage(imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([imagePath])

    if (error) {
      console.error('Ошибка удаления изображения:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка удаления изображения:', error)
    return false
  }
}

/**
 * Удаляет несколько изображений
 */
export async function deleteMultipleImages(imagePaths: string[]): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(imagePaths)

    if (error) {
      console.error('Ошибка удаления изображений:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка удаления изображений:', error)
    return false
  }
}

// === ПОЛУЧЕНИЕ ИЗОБРАЖЕНИЙ ===

/**
 * Получает список изображений в категории
 */
export async function getImagesByCategory(
  category: ImageCategory,
  userId?: string
): Promise<string[]> {
  try {
    const folderPath = userId ? `${category}/${userId}` : category
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folderPath)

    if (error) {
      console.error('Ошибка получения списка изображений:', error)
      return []
    }

    return data?.map(file => {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`${folderPath}/${file.name}`)
      return urlData.publicUrl
    }) || []
  } catch (error) {
    console.error('Ошибка получения изображений:', error)
    return []
  }
}

// === ВАЛИДАЦИЯ ФАЙЛОВ ===

/**
 * Валидирует файл изображения
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Проверка размера файла
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Размер файла не должен превышать ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    }
  }

  // Проверка типа файла
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Неподдерживаемый тип файла. Разрешены: ${ALLOWED_TYPES.join(', ')}` 
    }
  }

  return { valid: true }
}

// === ОПТИМИЗАЦИЯ ИЗОБРАЖЕНИЙ ===

/**
 * Сжимает изображение перед загрузкой
 */
export function compressImage(
  file: File, 
  maxWidth: number = 1920, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Рассчитываем новые размеры
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      // Устанавливаем размеры canvas
      canvas.width = width
      canvas.height = height

      // Рисуем изображение
      ctx?.drawImage(img, 0, 0, width, height)

      // Конвертируем в blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Ошибка сжатия изображения'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Ошибка загрузки изображения'))
    img.src = URL.createObjectURL(file)
  })
}

// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

/**
 * Получает публичный URL изображения
 */
export function getImageUrl(imagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(imagePath)
  
  return data.publicUrl
}

/**
 * Проверяет, является ли URL изображением Supabase Storage
 */
export function isSupabaseImageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('storage')
}

/**
 * Извлекает путь к изображению из URL
 */
export function extractImagePath(url: string): string | null {
  if (!isSupabaseImageUrl(url)) return null
  
  const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)/)
  return match ? match[1] : null
}

// === ХУКИ ДЛЯ REACT ===

import { useState, useCallback } from 'react'

/**
 * Хук для загрузки изображений
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadImageWithState = useCallback(async (
    file: File,
    category: ImageCategory,
    userId?: string,
    compress: boolean = true
  ): Promise<ImageUploadResult> => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let fileToUpload = file

      // Сжимаем изображение если нужно
      if (compress && file.size > 1024 * 1024) { // Больше 1MB
        fileToUpload = await compressImage(file)
      }

      setUploadProgress(50)

      const result = await uploadImage(fileToUpload, category, userId)
      
      setUploadProgress(100)
      return result
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  return {
    uploadImage: uploadImageWithState,
    isUploading,
    uploadProgress
  }
}

/**
 * Хук для работы с изображениями пользователя
 */
export function useUserImages(userId: string) {
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadImages = useCallback(async (category: ImageCategory) => {
    setIsLoading(true)
    try {
      const userImages = await getImagesByCategory(category, userId)
      setImages(userImages)
    } catch (error) {
      console.error('Ошибка загрузки изображений пользователя:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const deleteImageCallback = useCallback(async (imagePath: string): Promise<boolean> => {
    try {
      const success = await deleteImage(imagePath)
      if (success) {
        setImages(prev => prev.filter(img => !img.includes(imagePath)))
      }
      return success
    } catch (error) {
      console.error('Ошибка удаления изображения:', error)
      return false
    }
  }, [])

  return {
    images,
    isLoading,
    loadImages,
    deleteImage: deleteImageCallback
  }
}
