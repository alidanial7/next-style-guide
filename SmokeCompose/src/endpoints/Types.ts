/* -------------------------------------------------------------------------- */
/*                                   Request                                  */
/* -------------------------------------------------------------------------- */

/** Query params + JSON body wrapper used by every endpoint call. */
export type ApiRequestData<TParams = undefined, TBody = undefined> = {
  params?: TParams;
  body?: TBody;
};

/** Standard argument shape for endpoint functions. */
export type ApiRequest<TParams = undefined, TBody = undefined> = {
  request?: ApiRequestData<TParams, TBody>;
};

export type ApiListParams = {
  all?: string;
  order?: string;
  search?: string;
};

export type ApiPaginatedParams = {
  page_size?: string | number;
  p?: string | number;
  order?: string;
  search?: string;
};

export type ApiRequestAll<TParams = undefined, TBody = undefined> = ApiRequest<
  ApiListParams & TParams,
  TBody
>;

export type ApiRequestPaginated<TParams = undefined, TBody = undefined> =
  ApiRequest<ApiPaginatedParams & TParams, TBody>;

/* -------------------------------------------------------------------------- */
/*                                  Response                                  */
/* -------------------------------------------------------------------------- */

/** API envelope for a single object `result`. */
export type ApiObjectResponse<T> = {
  result: T;
  status: number;
  success: boolean;
  messages: Record<string, unknown>;
};

/** API envelope for an unpaginated list `result`. */
export type ApiListResponse<T> = {
  result: T[];
  status: number;
  success: boolean;
  messages: Record<string, unknown>;
};

/** API envelope for page-number paginated `result`. */
export type ApiPaginatedResponse<T> = {
  result: {
    count: number;
    next: string | null;
    previous: string | null;
    page_size: number;
    results: T[];
  };
  status: number;
  success: boolean;
  messages: Record<string, unknown>;
};

/** Limit/offset page payload (often the unwrapped `result` of list endpoints). */
export type ApiLimitOffsetPage<T> = {
  limit: number;
  offset: number;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** API envelope for limit/offset paginated `result`. */
export type ApiLimitOffsetResponse<T> = {
  result: ApiLimitOffsetPage<T>;
  status: number;
  success: boolean;
  messages: Record<string, unknown>;
};

/* -------------------------------------------------------------------------- */
/*                                   Errors                                   */
/* -------------------------------------------------------------------------- */

/** Single message item from standard API error payload. */
export type ApiMessageItem = {
  message: string;
  code?: string;
};

/** API error response envelope (HTTP 400). */
export type ApiErrorEnvelope = {
  success: boolean;
  status: number;
  result: unknown[];
  messages: Record<string, ApiMessageItem[] | string[] | string>;
};
