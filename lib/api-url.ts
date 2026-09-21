export function deriveApiBaseUrlFromHost(host?: string) {
  if (!host) return "";
  const hostname = host.replace(/^\w+:\/\//, "").split("/")[0];
  const apiHostname = hostname.replace(/^8081-/, "3000-");
  return apiHostname !== hostname ? `https://${apiHostname}` : "";
}
