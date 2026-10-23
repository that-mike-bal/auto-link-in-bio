// Small helpers shared by the /api handlers. Each handler is a Web-standard
// `POST(request: Request): Promise<Response>`, which runs as-is on Vercel and
// through the dev middleware in vite.config.ts.

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const readJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'Request body must be JSON.');
  }
};

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new HttpError(500, `Server is missing the ${name} environment variable.`);
  }
  return value;
};

export const handle =
  (fn: (request: Request) => Promise<unknown>) =>
  async (request: Request): Promise<Response> => {
    try {
      return json(await fn(request));
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, error.status);
      }
      console.error(error);
      return json({ error: 'Something went wrong on the server.' }, 500);
    }
  };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: unknown): string => {
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }
  return email.trim().toLowerCase();
};

export const validateUrl = (url: unknown): string => {
  if (typeof url !== 'string' || url.length > 2048) {
    throw new HttpError(400, 'Please enter a valid URL.');
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    return parsed.toString();
  } catch {
    throw new HttpError(400, 'Please enter a valid http(s) URL.');
  }
};
