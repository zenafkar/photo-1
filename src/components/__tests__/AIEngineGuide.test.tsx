import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AIEngineGuide } from '../AIEngineGuide';

const defaultProps = {
  isOpen: true,
  onOpen: vi.fn(),
  onClose: vi.fn(),
};

describe('AIEngineGuide', () => {
  it('shows the tested ranking and processing times', () => {
    render(<AIEngineGuide {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: 'Panduan Penggunaan AI Engine' })).toBeInTheDocument();
    expect(screen.getByText(/berdasarkan test yang telah dilakukan puluhan kali/i)).toBeInTheDocument();
    expect(screen.getByText('Nano Banana Pro')).toBeInTheDocument();
    expect(screen.getByText('Nano Banana 2')).toBeInTheDocument();
    expect(screen.getByText('GPT-Image')).toBeInTheDocument();
    expect(screen.getByText('< 30 detik')).toBeInTheDocument();
    expect(screen.getByText('30–45 detik')).toBeInTheDocument();
    expect(screen.getByText('Lebih dari 45 detik')).toBeInTheDocument();
  });

  it('closes from the close button, backdrop, and Escape key', () => {
    const onClose = vi.fn();
    render(<AIEngineGuide {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tutup panduan penggunaan AI Engine' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('dialog').parentElement!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when content is clicked', () => {
    const onClose = vi.fn();
    render(<AIEngineGuide {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('opens from the compact guide trigger', () => {
    const onOpen = vi.fn();
    render(<AIEngineGuide {...defaultProps} isOpen={false} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buka panduan penggunaan AI Engine' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });
});
