import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../Navbar';

vi.mock('@clerk/clerk-react', () => {
  const UserButton = Object.assign(
    () => <button type="button" aria-label="Profil pengguna">Profil</button>,
    {
      MenuItems: ({ children }: { children?: ReactNode }) => <>{children}</>,
      Link: ({ label }: { label: string }) => <span>{label}</span>,
      Action: ({ label }: { label: string }) => <span>{label}</span>,
    },
  );

  return {
    UserButton,
    useAuth: () => ({ isLoaded: true, isSignedIn: false }),
    useClerk: () => ({
      openSignIn: vi.fn(),
      openSignUp: vi.fn(),
    }),
  };
});

const renderNavbar = () => render(
  <MemoryRouter>
    <Navbar />
  </MemoryRouter>,
);

describe('Navbar mobile menu', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.style.cssText = '';
    document.documentElement.style.removeProperty('scroll-behavior');
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens a labeled navigation dropdown with icon-based links', async () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Buka menu' });
    fireEvent.click(toggle);

    const dialog = await screen.findByRole('dialog', { name: 'Jelajahi Studio' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(dialog).getByRole('link', { name: 'Cara Kerja' })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Integrity Engine' })).toBeInTheDocument();
    expect(within(dialog).queryByText('01')).not.toBeInTheDocument();
  });

  it('closes on backdrop click and restores focus to the toggle', async () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Buka menu' });
    fireEvent.click(toggle);
    const dialog = await screen.findByRole('dialog', { name: 'Jelajahi Studio' });

    fireEvent.pointerDown(dialog.parentElement!);

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Jelajahi Studio' })).not.toBeInTheDocument());
    expect(toggle).toHaveFocus();
  });

  it('keeps keyboard focus inside the dropdown and closes on Escape', async () => {
    renderNavbar();

    const toggle = screen.getByRole('button', { name: 'Buka menu' });
    fireEvent.click(toggle);
    const dialog = await screen.findByRole('dialog', { name: 'Jelajahi Studio' });
    const firstLink = within(dialog).getByRole('link', { name: 'Cara Kerja' });
    const focusableElements = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    await waitFor(() => expect(firstLink).toHaveFocus());

    lastFocusableElement.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(firstFocusableElement).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Jelajahi Studio' })).not.toBeInTheDocument());
    expect(toggle).toHaveFocus();
  });
});
