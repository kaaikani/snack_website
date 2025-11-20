import clsx from 'clsx';
import { trackButtonClick } from '~/utils/facebook-pixel';

type ButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    trackClick?: string; // Button name for tracking
  }
>;

export function Button(props: ButtonProps) {
  const { trackClick, onClick, ...restProps } = props;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trackClick) {
      trackButtonClick(trackClick);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      {...restProps}
      onClick={handleClick}
      className={clsx(
        'hover:text-white hover:bg-primary-600 focus:outline-none focus:z-10 focus:ring-2 focus:ring-offset-0 focus:ring-gray-800',
        'bg-gray-100 border rounded-md py-2 px-4 text-base font-medium text-black',
        'flex items-center justify-around gap-2',
        'disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400',
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
