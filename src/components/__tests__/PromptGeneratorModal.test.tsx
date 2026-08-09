import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PromptGeneratorModal } from '../PromptGeneratorModal';

describe('PromptGeneratorModal mannequin builder', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('applies the selected surface and lighting to the mannequin prompt', () => {
    const onApplyPrompt = vi.fn();

    render(
      <PromptGeneratorModal
        isOpen
        onClose={vi.fn()}
        onApplyPrompt={onApplyPrompt}
        currentResolution="4k"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mannequin' }));
    expect(screen.getByText('Latar Belakang')).toBeInTheDocument();
    expect(screen.getByText('Pencahayaan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Meja Kayu Oak Rustic/ }));
    fireEvent.click(screen.getByRole('button', { name: /Neon Cyberpunk \(Cyan\/Purple\)/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Terapkan ke Studio' }));

    expect(onApplyPrompt).toHaveBeenCalledWith(
      expect.stringContaining('placed on a rustic dark oak wood tabletop'),
    );
    expect(onApplyPrompt).toHaveBeenCalledWith(
      expect.stringContaining('lit with futuristic dual neon cyan and violet ambient lighting'),
    );
    expect(onApplyPrompt).toHaveBeenCalledWith(expect.stringContaining('4k resolution'));
  });

  it('applies a preset prompt to the studio', () => {
    const onApplyPrompt = vi.fn();

    render(
      <PromptGeneratorModal
        isOpen
        onClose={vi.fn()}
        onApplyPrompt={onApplyPrompt}
        currentResolution="2k"
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Gunakan Prompt' })[0]);

    expect(onApplyPrompt).toHaveBeenCalledWith(expect.stringContaining('2k resolution'));
    expect(onApplyPrompt.mock.calls[0][0].trim().length).toBeGreaterThanOrEqual(3);
  });

  it('applies a non-empty custom prompt with fallback product name', () => {
    const onApplyPrompt = vi.fn();

    render(
      <PromptGeneratorModal
        isOpen
        onClose={vi.fn()}
        onApplyPrompt={onApplyPrompt}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Kustom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Terapkan ke Studio' }));

    expect(onApplyPrompt).toHaveBeenCalledWith(expect.stringContaining('of Botol Serum Skincare'));
    expect(onApplyPrompt.mock.calls[0][0].trim().length).toBeGreaterThanOrEqual(3);
  });
});
