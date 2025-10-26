import { Avatar as MantineAvatar } from '@mantine/core'
import { IconUser } from '@tabler/icons-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: number | string
  radius?: number | string
}

/**
 * Компонент для отображения аватара пользователя
 * Показывает заглушку, если аватар не загружен
 */
export function Avatar({ src, alt = 'Avatar', size = 40, radius = '50%' }: AvatarProps) {
  // Если есть аватар, показываем его
  if (src) {
    return (
      <MantineAvatar
        src={src}
        alt={alt}
        radius={radius}
        size={size}
        style={{ border: '2px solid #dee2e6' }}
      />
    )
  }

  // Заглушка по умолчанию
  return (
    <MantineAvatar
      radius={radius}
      size={size}
      style={{
        border: '2px solid #dee2e6',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <IconUser size={typeof size === 'number' ? size * 0.6 : 24} color="white" />
    </MantineAvatar>
  )
}
