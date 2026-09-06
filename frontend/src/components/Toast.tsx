import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

export const ToastType = {
  DANGER: 'danger',
  SUCCESS: 'success',
  GENERAL: 'general',
} as const

export type ToastType = (typeof ToastType)[keyof typeof ToastType]

export interface ToastAction {
  label: string
  handler?: () => boolean | void | Promise<boolean | void>
}

export interface ToastProps {
  message: string
  type?: ToastType
  action?: ToastAction
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = ToastType.GENERAL,
  action,
  onClose,
}) => {
  const handleActionClick = async () => {
    if (action) {
      const handler = action.handler ?? (() => true)
      await handler()
    }
    onClose()
  }

  let containerStyles = ''
  let textStyles = ''
  let actionBtnStyles = ''

  switch (type) {
    case ToastType.DANGER:
      containerStyles = 'bg-[var(--color-error-container,#fce8e6)] text-[var(--color-on-error-container,#601410)] border border-[var(--color-on-error-container,#601410)]/15'
      textStyles = 'text-[var(--color-on-error-container,#601410)]'
      actionBtnStyles = 'bg-[var(--color-on-error-container,#601410)]/10 text-[var(--color-on-error-container,#601410)] hover:bg-[var(--color-on-error-container,#601410)]/20 active:scale-95'
      break
    case ToastType.SUCCESS:
      containerStyles = 'bg-[var(--color-success-container,#e6f4ea)] text-[var(--color-on-success-container,#137333)] border border-[var(--color-on-success-container,#137333)]/15'
      textStyles = 'text-[var(--color-on-success-container,#137333)]'
      actionBtnStyles = 'bg-[var(--color-on-success-container,#137333)]/10 text-[var(--color-on-success-container,#137333)] hover:bg-[var(--color-on-success-container,#137333)]/20 active:scale-95'
      break
    case ToastType.GENERAL:
    default:
      containerStyles = 'bg-[var(--color-inverse-container,#303030)] text-[var(--color-on-inverse-container,#f1f3f4)] border border-[var(--color-on-inverse-container,#f1f3f4)]/15'
      textStyles = 'text-[var(--color-on-inverse-container,#f1f3f4)]'
      actionBtnStyles = 'bg-[var(--color-on-inverse-container,#f1f3f4)]/15 text-[var(--color-on-inverse-container,#f1f3f4)] hover:bg-[var(--color-on-inverse-container,#f1f3f4)]/25 active:scale-95'
      break
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-9999 max-w-[45vw] flex items-center justify-between gap-4 px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${containerStyles}`}
    >
      <span className={`text-sm font-medium leading-snug line-clamp-2 wrap-break-word flex-1 ${textStyles}`}>
        {message}
      </span>

      {action && (
        <button
          type="button"
          onClick={handleActionClick}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border-0 ${actionBtnStyles}`}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export interface ToastOptions {
  message: string
  type?: ToastType
  action?: ToastAction
}

export interface ToastContextType {
  showToast: (
    optionsOrMessage: ToastOptions | string,
    type?: ToastType,
    action?: ToastAction
  ) => void
  hideToast: () => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

const DEFAULT_HANDLER = () => true

export interface ToastProviderProps {
  children: React.ReactNode
}

interface ActiveToastState {
  id: string
  message: string
  type: ToastType
  action?: ToastAction
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ActiveToastState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = ToastType.GENERAL,
      action?: ToastAction
    ) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      if (action) {
        action = {
          label: action.label,
          handler: action.handler ?? DEFAULT_HANDLER,
        }
      }

      const newToast: ActiveToastState = {
        id: String(Date.now()),
        message,
        type,
        action,
      }

      setToast(newToast)

      // Automatically hide after 5s ONLY if NO action is provided
      if (!action) {
        timerRef.current = setTimeout(() => {
          hideToast()
        }, 5000)
      }
    },
    [hideToast]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default Toast
