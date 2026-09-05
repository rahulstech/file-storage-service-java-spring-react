import React from 'react'

export interface Action {
  id: string
  label: string
  icon: React.ReactNode
  color?: string
  enabled?: boolean
}

export interface ActionPanelProps {
  children?: React.ReactNode
  actions: Action[]
  onAction: (id: string) => void
  className?: string
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  children,
  actions,
  onAction,
  className,
}) => {
  return (
    <aside className={`w-full md:w-80 bg-drive-surface rounded-2xl border border-drive-border shadow-xs flex flex-col overflow-hidden shrink-0 transition-all duration-200 ${className || ''}`}>
      {/* Panel Header (passed as child) */}
      {children}

      {/* Actions List */}
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
        {actions.map((action) => {
          const isEnabled = action.enabled ?? true
          const isDanger = action.color === 'danger'

          let textColorClass = 'text-drive-text'
          let iconColorClass = 'text-drive-text'
          let hoverClass = 'hover:bg-drive-surface-variant'

          if (isDanger) {
            textColorClass = 'text-red-600'
            iconColorClass = 'text-red-600'
            hoverClass = 'hover:bg-red-50 dark:hover:bg-red-950/30'
          } else if (action.color) {
            if (action.color.startsWith('text-')) {
              textColorClass = action.color
              iconColorClass = action.color
            }
          }

          const hasCustomInlineColor = action.color && !isDanger && !action.color.startsWith('text-')

          return (
            <button
              key={action.id}
              type="button"
              disabled={!isEnabled}
              onClick={() => onAction(action.id)}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium ${textColorClass} ${hoverClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-0 text-left`}
              style={hasCustomInlineColor ? { color: action.color } : undefined}
            >
              <span
                className={`w-4 h-4 flex items-center justify-center ${iconColorClass}`}
                style={hasCustomInlineColor ? { color: action.color } : undefined}
              >
                {action.icon}
              </span>
              {action.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export default ActionPanel
