export const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function canAddPdf(size?: number) {
  return size === undefined || size <= MAX_PDF_BYTES;
}
