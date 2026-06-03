/* eslint-disable react/jsx-closing-bracket-location */
import React from 'react';

export interface ModalProps {
  readonly children?: React.ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly size?: 'full-screen' | 'large' | 'medium' | 'small';
  readonly title?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = 'medium',
  title,
  children,
}) => {
  if (!isOpen) {
    return null;
  }

  let sizeClass = 'modal-md';
  if (size === 'small') {
    sizeClass = 'modal-sm';
  } else if (size === 'large') {
    sizeClass = 'modal-lg';
  } else if (size === 'full-screen') {
    sizeClass = 'modal-fullscreen';
  }

  return (
    <div className='modal-overlay active'>
      <div className={`modal-card ${sizeClass}`.trim()}>
        <div className='modal-header'>
          {title ? (
            <div className='wizard-header-text'>
              <h3>{title}</h3>
            </div>
          ) : null}
          <button aria-label='Close modal' className='modal-close' onClick={onClose} type='button'>
            &times;
          </button>
        </div>
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  );
};
