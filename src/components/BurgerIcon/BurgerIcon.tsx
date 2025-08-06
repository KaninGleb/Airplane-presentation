import { forwardRef } from 'react'
import s from './BurgerIcon.module.css'

type BurgerButtonProps = {
  isOpen: boolean
  onClick: () => void
}

export const BurgerButton = forwardRef<HTMLButtonElement, BurgerButtonProps>(({ isOpen, onClick }, ref) => {
  const buttonClassName = `${s.burgerButton} ${isOpen ? s.isOpen : ''}`

  return (
    <button ref={ref} className={buttonClassName} onClick={onClick} aria-label='Toggle panel'>
      <span className={s.burgerIcon}></span>
    </button>
  )
})
