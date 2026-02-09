const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
}

export async function apiGet(endpoint: string) {
    return apiRequest(endpoint, { method: 'GET' });
}

export async function apiPost(endpoint: string, body: any) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function apiPut(endpoint: string, body: any) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function apiDelete(endpoint: string) {
    return apiRequest(endpoint, { method: 'DELETE' });
}
