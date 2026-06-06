// Normalizes API responses to the inner payload.
//
// The backend `success()` helper sends list endpoints as `{ data, total, limit, offset }`
// and detail endpoints as the bare record. Historically the frontend unwrapped this with
// a grab-bag of guards (`result.data || result`, `d.data || d`, `data.data || data || []`,
// etc.), some of which were buggy. Use this single helper instead.
//
//   const json = await res.json();
//   const rows = unwrap(json);          // payload, falling back to the response itself
//   const rows = unwrap(json, []);      // with an explicit fallback for list endpoints
//
export function unwrap(res, fallback) {
  if (res == null) return fallback !== undefined ? fallback : res;
  const value = Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
  if (value == null && fallback !== undefined) return fallback;
  return value;
}
