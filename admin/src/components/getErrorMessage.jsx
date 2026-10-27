export function getErrorMessage(err, fallback = "Something went wrong") {
  // No response at all means the server is unreachable (backend stopped, wrong URL, CORS)
  if (!err.response) return "Cannot reach the server";

  const detail = err.response.data?.detail;

  // Our own errors: HTTPException(detail="Email already registered")
  if (typeof detail === "string") return detail;

  // Pydantic validation errors (422) arrive as an array of objects
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");

  return fallback;
}
export default getErrorMessage;