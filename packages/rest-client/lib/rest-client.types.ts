export type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | (string & {});

export type EncType =
	| "application/x-www-form-urlencoded"
	| "multipart/form-data"
	| "text/plain"
	| "application/json";

export interface CallParameters {
	method?: HttpMethod;
	body?: BodyPayload;
	query?: SearchQuery;
	headers?: Bun.HeadersInit;
	encType?: EncType;
	// useSession?: boolean;
	cache?: boolean | CallCacheParameters;
	invalidateTags?: string[];
}

export type SearchQuery = Record<string, unknown> | URLSearchParams;
export type BodyPayload = string | FormData | Record<string, unknown>;

interface CallCacheParameters {
	ttl?: number;
	tags?: string[];
}

export type CallSuccess<TData = unknown> = {
	data: TData;
	error: null;
	status: number;
} & readonly [TData, null, number];

export type CallError<TError = unknown> = {
	data: null;
	error: TError;
	status: number;
} & readonly [null, TError, number];

export type CallResult<TData = unknown, TError = unknown> = CallSuccess<TData> | CallError<TError>;
