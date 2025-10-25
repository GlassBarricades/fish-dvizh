// Типы для работы с изображениями
export type ImageUploadResult = {
  success: boolean
  url?: string
  error?: string
  path?: string
}

export type ImageCategory = 
  | 'achievements'     // Достижения
  | 'leagues'          // Лиги
  | 'competitions'     // Соревнования
  | 'users'            // Аватары пользователей
  | 'fish'             // Изображения рыб
  | 'rewards'          // Награды
  | 'banners'          // Баннеры
