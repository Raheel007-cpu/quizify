import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Modal from '../components/Modal/Modal';

function ModalWithControlledInput() {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState('');

  return (
    <Modal isOpen={open} title="Test Modal" onClose={() => setOpen(false)}>
      <input
        aria-label="Subject Name"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </Modal>
  );
}

describe('Modal', () => {
  it('keeps input focus across keystrokes when parent re-renders with inline onClose', () => {
    render(<ModalWithControlledInput />);

    const input = screen.getByLabelText('Subject Name');
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'P' } });
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'Programming' } });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Programming');
  });
});
