interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-80 rounded-xl bg-white p-6 text-center shadow-xl">
        <p className="mb-6 text-base font-medium text-slate-800">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            예
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-300"
          >
            아니오
          </button>
        </div>
      </div>
    </div>
  )
}
