# Компоненты тренировок

Этот модуль содержит компоненты для страницы тренировок, разбитые на логические части для лучшей организации кода.

## Структура компонентов

### Основные компоненты

- **`TrainingHeader`** - Заголовок тренировки с информацией и кнопками управления
- **`CatchesTab`** - Вкладка с поимками, включая фильтры и список
- **`MapTab`** - Вкладка с картой, отображением поимок и событий
- **`StatsTab`** - Вкладка со статистикой поимок
- **`BaitsTab`** - Вкладка с приманками пользователя
- **`TrainingPlanTab`** - Вкладка с планом тренировки

### Модальные окна

- **`AddCatchModal`** - Модальное окно для добавления поимки
- **`ManageTakenBaitsModal`** - Модальное окно для управления приманками

### Вспомогательные компоненты карты

- **`CatchClick`** - Обработчик кликов по карте для добавления поимки
- **`MapVisibilityFix`** - Исправление проблем с видимостью карты
- **`FlyToActiveSegment`** - Автоматический перелет к активному сегменту
- **`PinUtils`** - Утилиты для работы с пинами на карте

## Использование

```tsx
import {
  TrainingHeader,
  CatchesTab,
  MapTab,
  StatsTab,
  BaitsTab,
  AddCatchModal,
  ManageTakenBaitsModal,
  TrainingPlanTab
} from '../features/trainings/components'

// В основном компоненте
<TrainingHeader
  training={training}
  countdownText={countdownText}
  countdownKind={countdownKind}
  notifEnabled={notifEnabled}
  onToggleNotifications={handleToggleNotifications}
  onQuickPin={quickPin}
/>

<Tabs.Panel value="catches" pt="md">
  <CatchesTab
    catches={catches}
    fishKinds={fishKinds}
    user={user}
    onOpenManageBaits={takenModalHandlers.open}
    onAddCatch={handlers.open}
    onEditCatch={setEditing}
    onDeleteCatch={handleDeleteCatch}
    activeTask={activeTask}
  />
</Tabs.Panel>
```

## Преимущества новой структуры

1. **Разделение ответственности** - каждый компонент отвечает за свою функциональность
2. **Переиспользование** - компоненты можно легко переиспользовать в других частях приложения
3. **Тестируемость** - каждый компонент можно тестировать отдельно
4. **Читаемость** - основной файл стал намного проще для понимания
5. **Поддержка** - легче вносить изменения и исправлять ошибки

## Типизация

Все компоненты используют типы из `../api`:

- `TrainingCatch` - поимка на тренировке
- `TrainingTask` - задача тренировки
- `TrainingEvent` - событие на карте

## Зависимости

- `@mantine/core` - UI компоненты
- `@mantine/dates` - компоненты для работы с датами
- `react-leaflet` - карты
- `leaflet` - библиотека карт
