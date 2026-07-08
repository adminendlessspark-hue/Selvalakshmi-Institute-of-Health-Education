export async function getOAuthToken(scopes: string[]): Promise<string> {
  const url = new URL("/__ai_studio/api/oauth2/token", window.location.origin);
  scopes.forEach((scope) => url.searchParams.append("scope", scope));

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("OAuth API Error:", response.status, errorBody);
    throw new Error(`Failed to get OAuth token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Token missing from OAuth response");
  }

  return data.token;
}
