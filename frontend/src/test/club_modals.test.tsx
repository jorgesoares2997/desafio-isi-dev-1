import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClubCreateModal } from '../components/clubs/ClubCreateModal';
import { ToastProvider } from '../context/ToastContext';

describe('ClubCreateModal Component', () => {
  it('mantém o botão de cadastro desabilitado enquanto a sigla não possui 3 letras', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ToastProvider>
        <ClubCreateModal
          isOpen={true}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </ToastProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Criar Clube/i });
    expect(submitBtn).toBeDisabled();

    // Preenche o nome
    const nameInput = screen.getByPlaceholderText(/Ex: Porto Futebol Clube/i);
    fireEvent.change(nameInput, { target: { value: 'Porto Futebol Clube' } });
    expect(submitBtn).toBeDisabled();

    // Preenche sigla com 2 letras (ainda insuficiente)
    const acronymInput = screen.getByPlaceholderText(/Ex: PFC/i);
    fireEvent.change(acronymInput, { target: { value: 'PF' } });
    expect(submitBtn).toBeDisabled();

    // Completa 3 letras
    fireEvent.change(acronymInput, { target: { value: 'PFC' } });
    expect(submitBtn).toBeEnabled();
  });
});
