export const isSecretField = (key: string) => ['password', 'apiKey', 'token'].includes(key);

// A blank secret means "keep the saved one"; a plain setting is always sent, so it can also be cleared.
export function integrationFieldsToSend(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => !isSecretField(key) || value).map(([key, value]) => [key, isSecretField(key) ? value : value.trim()]));
}
