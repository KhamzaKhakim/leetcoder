/** Pull the csrftoken value out of a raw Cookie header string. */
export function extractCsrfToken(cookie: string): string {
  const start = cookie.indexOf("csrftoken=");
  if (start === -1) {
    throw new Error("CSRF cookie not found");
  }

  const valueStart = start + "csrftoken=".length;
  const end = cookie.indexOf(";", valueStart);

  return end === -1 ? cookie.slice(valueStart) : cookie.slice(valueStart, end);
}
