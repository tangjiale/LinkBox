export async function readJson(request: Request) {
  try {
    return { data: await request.json(), error: null };
  } catch {
    return {
      data: null,
      error: Response.json({ error: "请求体必须是合法 JSON" }, { status: 400 }),
    };
  }
}
