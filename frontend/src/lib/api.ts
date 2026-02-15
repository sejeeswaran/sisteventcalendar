export async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = globalThis.window === undefined ? null : localStorage.getItem('token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    return fetch(endpoint, {
        ...options,
        headers,
    });
}

export async function apiGet(endpoint: string) {
    return apiRequest(endpoint, { method: 'GET' });
}

export async function apiPost(endpoint: string, body: unknown) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function apiPut(endpoint: string, body: unknown) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function apiDelete(endpoint: string) {
    return apiRequest(endpoint, { method: 'DELETE' });
}
