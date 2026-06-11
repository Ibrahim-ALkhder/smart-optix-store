import { describe, it, expect, beforeEach } from 'vitest';
import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// --- Test 1: LanguageContext i18n rendering ---
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

function TestComponent() {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="rtl">{String(isRTL)}</span>
      <span data-testid="home-text">{t('home')}</span>
      <button onClick={toggleLanguage}>Toggle</button>
    </div>
  );
}

describe('LanguageContext - i18n Rendering', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('smartoptix_lang', 'en');
    document.documentElement.dir = 'ltr';
  });

  it('defaults to English and renders English text', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        </MemoryRouter>
      );
    });
    expect(screen.getByTestId('lang')).toHaveTextContent('en');
    expect(screen.getByTestId('rtl')).toHaveTextContent('false');
    expect(screen.getByTestId('home-text')).toHaveTextContent('Home');
  });

  it('toggles to Arabic and flips dir + renders Arabic text', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <LanguageProvider>
            <TestComponent />
          </LanguageProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      screen.getByText('Toggle').click();
    });

    expect(screen.getByTestId('lang')).toHaveTextContent('ar');
    expect(screen.getByTestId('rtl')).toHaveTextContent('true');
    expect(screen.getByTestId('home-text')).toHaveTextContent('الرئيسية');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('returns the key itself as fallback for missing translations', async () => {
    function MissingKey() {
      const { t } = useLanguage();
      return <span data-testid="missing">{t('totallyNonexistentKey')}</span>;
    }

    await act(async () => {
      render(
        <MemoryRouter>
          <LanguageProvider>
            <MissingKey />
          </LanguageProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByTestId('missing')).toHaveTextContent('totallyNonexistentKey');
  });
});

// --- Test 2: CartContext accumulation and totals ---
import { CartProvider, useCart } from '../context/CartContext';

function CartTest() {
  const { items, addItem, removeItem, updateQuantity, getSubtotal, getItemCount, clearCart } = useCart();
  return (
    <div>
      <span data-testid="count">{getItemCount()}</span>
      <span data-testid="subtotal">{getSubtotal()}</span>
      <span data-testid="items-length">{items.length}</span>
      <button data-testid="add1" onClick={() => addItem({ id: 1, price: 100, name_en: 'Test' }, 1)}>Add1</button>
      <button data-testid="add1-again" onClick={() => addItem({ id: 1, price: 100, name_en: 'Test' }, 2)}>Add1Again</button>
      <button data-testid="add2" onClick={() => addItem({ id: 2, price: 50, name_en: 'Test2' }, 1)}>Add2</button>
      <button data-testid="remove1" onClick={() => removeItem(1)}>Remove1</button>
      <button data-testid="update-qty" onClick={() => updateQuantity(1, 5)}>UpdateQty</button>
      <button data-testid="clear" onClick={() => clearCart()}>Clear</button>
    </div>
  );
}

describe('CartContext - State Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty cart', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CartProvider>
            <CartTest />
          </CartProvider>
        </MemoryRouter>
      );
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
    expect(screen.getByTestId('items-length')).toHaveTextContent('0');
  });

  it('adds items and accumulates quantity for same product', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CartProvider>
            <CartTest />
          </CartProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      screen.getByTestId('add1').click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('100');
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');

    await act(async () => {
      screen.getByTestId('add1-again').click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('300');
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');
  });

  it('adds different products as separate items', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CartProvider>
            <CartTest />
          </CartProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      screen.getByTestId('add1').click();
    });
    await act(async () => {
      screen.getByTestId('add2').click();
    });
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('150');
    expect(screen.getByTestId('items-length')).toHaveTextContent('2');
  });

  it('removes items correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CartProvider>
            <CartTest />
          </CartProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      screen.getByTestId('add1').click();
    });
    await act(async () => {
      screen.getByTestId('add2').click();
    });
    expect(screen.getByTestId('items-length')).toHaveTextContent('2');

    await act(async () => {
      screen.getByTestId('remove1').click();
    });
    expect(screen.getByTestId('items-length')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('50');
  });

  it('clears all items', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <CartProvider>
            <CartTest />
          </CartProvider>
        </MemoryRouter>
      );
    });

    await act(async () => {
      screen.getByTestId('add1').click();
    });
    await act(async () => {
      screen.getByTestId('add2').click();
    });
    await act(async () => {
      screen.getByTestId('clear').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('items-length')).toHaveTextContent('0');
  });
});

// --- Test 3: AuthContext role checks ---
import { AuthProvider, useAuth } from '../context/AuthContext';

function RoleTest() {
  const { isAdmin, isDriver, isClient, user } = useAuth();
  return (
    <div>
      <span data-testid="role">{user?.role || 'none'}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <span data-testid="isDriver">{String(isDriver)}</span>
      <span data-testid="isClient">{String(isClient)}</span>
    </div>
  );
}

describe('AuthContext - Role Checks', () => {
  it('provides role check helpers when not authenticated', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RoleTest />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    expect(screen.getByTestId('role')).toHaveTextContent('none');
    expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
    expect(screen.getByTestId('isDriver')).toHaveTextContent('false');
  });
});
