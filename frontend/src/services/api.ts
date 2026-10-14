import axios, { AxiosError } from 'axios';

export interface ApiErrorResponse {
  message: string;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor de resposta padronizado para extrair error.response.data.message
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const apiMessage = error.response?.data?.message;
    const fallbackMessage = error.message || 'Erro de comunicação com o servidor.';
    
    // Normaliza o erro criando mensagem amigável extraída diretamente da resposta da API
    const errorMessage = apiMessage || fallbackMessage;
    
    // Anexa a mensagem extraída na propriedade message do erro
    error.message = errorMessage;
    
    return Promise.reject(error);
  }
);

/**
 * Utilitário para extrair a mensagem de erro padronizada da API
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message || error.message || 'Erro desconhecido.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocorreu um erro inesperado.';
}

export default api;
