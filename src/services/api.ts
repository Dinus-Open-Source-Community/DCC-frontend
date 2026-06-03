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
  
  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  return response.json();
};
