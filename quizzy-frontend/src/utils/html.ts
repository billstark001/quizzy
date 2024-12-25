import { promiseWithResolvers } from "./func";

export const uploadFile = async () => {
  const { promise, resolve, reject } = promiseWithResolvers<File>();
  const input = document.createElement("input");
  input.type = "file";
  input.oninput = async (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) {
      reject(new Error("No file selected"));
      return;
    }
    resolve(f);
  };
  input.oncancel = () => reject(new Error('No file selected'));
  window.addEventListener('focus', () => {
    setTimeout(() => {
      if (!input.files?.length) {
        reject(new Error("No file selected"));
      }
    }, 300);
  }, { once: true });
  input.click();
  return await promise;
};

export const downloadFile = async (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};