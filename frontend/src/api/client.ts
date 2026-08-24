const API_URL = "http://127.0.0.1:8000";

export async function login(username: string, password: string) {
    const form = new URLSearchParams();

    form.append("username", username);
    form.append("password", password);

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
    });

    if (!response.ok) {
        throw new Error("Login failed");
    }

    return response.json();
}
