import { useState, useRef, useCallback } from 'react'
import {
  Group,
  Button,
  Text,
  Image,
  Stack,
  Progress,
  ActionIcon,
  Modal,
  Grid,
  Card,
  Badge,
  Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconUpload, 
  IconPhoto, 
  IconTrash, 
  IconEye
} from '@tabler/icons-react'
import { useImageUpload, validateImageFile } from '@/lib/imageUtils'
import type { ImageCategory } from '@/lib/imageTypes'

interface ImageUploaderProps {
  category: ImageCategory
  userId?: string
  onUploadComplete?: (url: string) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  preview?: boolean
  compress?: boolean
  className?: string
}

export function ImageUploader({
  category,
  userId,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  preview = true,
  compress = true,
  className
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [previewModal, setPreviewModal] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { uploadImage, isUploading, uploadProgress } = useImageUpload()

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = async (files: File[]) => {
    // Проверяем количество файлов
    if (files.length > maxFiles) {
      onUploadError?.(`Максимальное количество файлов: ${maxFiles}`)
      return
    }

    // Проверяем каждый файл
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        onUploadError?.(validation.error!)
        return
      }
    }

    // Загружаем файлы
    for (const file of files) {
      const result = await uploadImage(file, category, userId, compress)
      
      if (result.success && result.url) {
        setUploadedImages(prev => [...prev, result.url!])
        onUploadComplete?.(result.url)
      } else {
        const message = result.error || 'Ошибка загрузки'
        notifications.show({ color: 'red', message })
        onUploadError?.(message)
      }
    }
  }

  const handleFileInput = (files: FileList | null) => {
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      {/* Область загрузки */}
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{
          border: dragActive ? '2px dashed #228be6' : '2px dashed #dee2e6',
          backgroundColor: dragActive ? '#f8f9fa' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Stack align="center" gap="md">
          <Group>
            <IconPhoto size={32} color={dragActive ? '#228be6' : '#868e96'} />
            <Stack gap="xs" align="center">
              <Text size="lg" fw={500}>
                {dragActive ? 'Отпустите файлы здесь' : 'Перетащите изображения сюда'}
              </Text>
              <Text size="sm" c="dimmed">
                или нажмите для выбора файлов
              </Text>
            </Stack>
          </Group>

          <Button
            leftSection={<IconUpload size={16} />}
            variant="light"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation()
              openFileDialog()
            }}
          >
            Выбрать файлы
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            Поддерживаются: JPEG, PNG, WebP, GIF (максимум 5MB)
          </Text>
        </Stack>

        {/* Прогресс загрузки */}
        {isUploading && (
          <Stack gap="sm" mt="md">
            <Progress value={uploadProgress} size="sm" />
            <Text size="sm" ta="center" c="dimmed">
              Загрузка... {uploadProgress}%
            </Text>
          </Stack>
        )}
      </Card>

      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        multiple={maxFiles > 1}
        accept="image/*"
        onChange={(e) => handleFileInput(e.target.files)}
      />

      {/* Предварительный просмотр загруженных изображений */}
      {preview && uploadedImages.length > 0 && (
        <Stack gap="md" mt="md">
          <Text size="sm" fw={500}>Загруженные изображения:</Text>
          <Grid>
            {uploadedImages.map((url, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
                <Card withBorder radius="md" p="sm">
                  <Stack gap="sm">
                    <Image
                      src={url}
                      alt={`Uploaded image ${index + 1}`}
                      height={120}
                      radius="sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPreviewModal(url)}
                    />
                    
                    <Group justify="space-between">
                      <Badge size="sm" variant="light" color="green">
                        Загружено
                      </Badge>
                      
                      <Group gap="xs">
                        <Tooltip label="Просмотр">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => setPreviewModal(url)}
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Удалить">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Модальное окно предварительного просмотра */}
      <Modal
        opened={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title="Предварительный просмотр"
        size="lg"
        centered
      >
        {previewModal && (
          <Image
            src={previewModal}
            alt="Preview"
            style={{ width: '100%', height: 'auto' }}
          />
        )}
      </Modal>
    </div>
  )
}

// Компонент для загрузки аватара пользователя
interface AvatarUploaderProps {
  userId: string
  currentAvatar?: string
  onAvatarChange?: (url: string) => void
  size?: number
}

export function AvatarUploader({
  userId,
  currentAvatar,
  onAvatarChange,
  size = 120
}: AvatarUploaderProps) {
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null)
  const { isUploading } = useImageUpload()

  const handleAvatarUpload = async (url: string) => {
    setAvatar(url)
    onAvatarChange?.(url)
  }

  return (
    <Stack align="center" gap="md">
      {/* Текущий аватар */}
      <div style={{ position: 'relative' }}>
        <Image
          src={avatar || '/default-avatar.png'}
          alt="Avatar"
          width={size}
          height={size}
          radius="50%"
          style={{ border: '3px solid #dee2e6' }}
        />
        
        {isUploading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconUpload size={24} color="white" />
          </div>
        )}
      </div>

      {/* Кнопка загрузки */}
      <ImageUploader
        category="users"
        userId={userId}
        maxFiles={1}
        preview={false}
        compress={true}
        onUploadComplete={handleAvatarUpload}
        className="w-full"
      />
    </Stack>
  )
}

// Компонент для загрузки изображений достижений
interface AchievementImageUploaderProps {
  achievementId: string
  currentImage?: string
  onImageChange?: (url: string) => void
}

export function AchievementImageUploader({
  onImageChange
}: AchievementImageUploaderProps) {
  return (
    <ImageUploader
      category="achievements"
      maxFiles={1}
      preview={true}
      compress={true}
      onUploadComplete={(url) => {
        onImageChange?.(url)
      }}
    />
  )
}

// Компонент для загрузки изображений лиг
interface LeagueImageUploaderProps {
  leagueId: string
  currentImage?: string
  onImageChange?: (url: string) => void
}

export function LeagueImageUploader({
  leagueId,
  onImageChange
}: LeagueImageUploaderProps) {
  return (
    <ImageUploader
      category="leagues"
      userId={leagueId}
      maxFiles={1}
      preview={true}
      compress={true}
      onUploadComplete={(url) => {
        onImageChange?.(url)
      }}
    />
  )
}
