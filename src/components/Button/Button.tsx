import { buttonClass } from './button_class';
import type { ButtonProps } from './Button.types';

export function Button({ variant, size, danger, className, ...props }: ButtonProps) {
  return <button className={buttonClass({ variant, size, danger, className })} {...props} />;
}
