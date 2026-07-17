import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { setCommandPaletteOpen, setCommandPaletteQuery } from '../../store/slices/commandPaletteSlice'

export function CommandPalette() {
  const dispatch = useAppDispatch()
  const { isOpen, query } = useAppSelector((state) => state.commandPalette)

  return (
    <Modal isOpen={isOpen} title="Command Palette" onClose={() => dispatch(setCommandPaletteOpen(false))}>
      <Input
        autoFocus
        value={query}
        onChange={(event) => dispatch(setCommandPaletteQuery(event.target.value))}
        placeholder="Search tools and commands"
      />
    </Modal>
  )
}
