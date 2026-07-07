import { GRADE_COLOR, WAREHOUSE_COLS, WAREHOUSE_ROWS } from '../data/mockData'
import { useInventory } from '../context/InventoryContext'

interface WarehouseMapProps {
  highlightSlotId?: string | null
}

export default function WarehouseMap({ highlightSlotId }: WarehouseMapProps) {
  const { items, slots } = useInventory()
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[420px] items-stretch gap-2">
          <div className="flex w-9 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50">
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500 [writing-mode:vertical-rl]">
              ◀ 출입구
            </span>
          </div>
          <div
            className="grid flex-1 gap-1.5"
            style={{ gridTemplateColumns: `repeat(${WAREHOUSE_COLS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: WAREHOUSE_ROWS }).map((_, row) =>
              Array.from({ length: WAREHOUSE_COLS }).map((_, col) => {
                const slot = slots.find((s) => s.row === row && s.col === col)!
                const item = items.find((i) => i.id === slot.itemId)
                const isHighlight = slot.id === highlightSlotId
                return (
                  <div
                    key={slot.id}
                    title={item ? `${item.name} (${item.qty}개)` : '빈 슬롯'}
                    className={`relative flex aspect-square items-center justify-center rounded-md text-[10px] font-semibold text-white transition ${
                      item ? GRADE_COLOR[slot.grade].bg : 'bg-slate-100 text-slate-300'
                    } ${isHighlight ? 'ring-4 ring-offset-1 ring-blue-500' : ''}`}
                  >
                    {item ? slot.grade : ''}
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        {(Object.keys(GRADE_COLOR) as Array<keyof typeof GRADE_COLOR>).map((g) => (
          <span key={g} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${GRADE_COLOR[g].bg}`} />
            {GRADE_COLOR[g].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-slate-100" />
          빈 슬롯
        </span>
      </div>
    </div>
  )
}
