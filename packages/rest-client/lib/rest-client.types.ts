import type { SessionOrConstructor } from "./session.types";

export interface RestClientParameters {
	/** A base path for all API calls. */
	basePath?: string;
	/**
	 * An `ISession` objects which will be used for session management.
	 * If none, a {@link BearerSession} will be used by default.
	 */
	sessions?: SessionOrConstructor[];
	/**
	 * What session setting will be used for API calls by default:
	 * - `false`: Session will not be used if not set explicitly
	 * - `true`: A default session will be used if not set explicitly
	 * - `string`: Session with the given name will be used if not set explicitly
	 *
	 * @default false
	 */
	defaultSession?: string | boolean;
}

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
	session?: boolean | string;
	cache?: boolean | CallCacheParameters;
	invalidateTags?: string[];
}

export type SearchQuery = Record<string, unknown> | URLSearchParams;
export type BodyPayload = string | FormData | object;

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
