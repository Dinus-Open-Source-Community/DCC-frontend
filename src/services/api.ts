export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const finalOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };
  return fetch(url, finalOptions);
};

export const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await apiFetch(url, { ...options, headers });

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    throw new Error('Server returned HTML instead of JSON. Please verify if the C2 backend is running on port 8080.');
  }

  if (!response.ok) {
    let errorMsg = `${response.status} ${response.statusText}`.trim();
    try {
      const text = await response.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);
          if (errorData && typeof errorData === 'object' && 'error' in errorData) {
            errorMsg = String(errorData.error);
          } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
            errorMsg = String(errorData.message);
          } else if (typeof errorData === 'string') {
            errorMsg = errorData;
          } else {
            errorMsg = text.slice(0, 500);
          }
        } catch {
          errorMsg = text.slice(0, 500);
        }
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  return response.json();
};
