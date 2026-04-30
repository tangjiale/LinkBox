export class LinkBoxError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LinkBoxError";
  }
}

export function toErrorResponse(error: unknown, fallback = "操作失败") {
  if (error instanceof LinkBoxError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof Error) {
    return Response.json({ error: error.message || fallback }, { status: 500 });
  }

  return Response.json({ error: fallback }, { status: 500 });
}
