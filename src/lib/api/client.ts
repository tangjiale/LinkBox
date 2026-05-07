export async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { error: response.ok ? "" : `请求失败，服务器返回 ${response.status}` };
  }

  try {
    return (await response.json()) as { error?: string };
  } catch {
    return { error: response.ok ? "" : "服务器响应格式异常" };
  }
}

export function getFetchErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "网络异常，请稍后重试";
}
