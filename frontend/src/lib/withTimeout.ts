export async function withTimeout<T>(operation: Promise<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("The connection timed out. Please try again.")), ms);
    })]);
  } finally { clearTimeout(timer!); }
}
