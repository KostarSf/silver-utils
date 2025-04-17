import type { SessionOrConstructor } from "./session.types";
import type { EncType, HttpMethod, MayBePromise } from "./types";

export interface RestClientParameters {
	/** A base path for all API calls. */
	basePath?: string;
	/**
	 * Remove `undefined` fields from plain object body when performing request.
	 * Does not process nested objects. This is the default value which may be overriden.
	 *
	 * @default false
	 */
	bodyRemoveUndefinedFields?: boolean;
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

export interface CallParameters<TData = unknown, TError = unknown> {
	method?: HttpMethod;
	body?: BodyPayload;
	bodyRemoveUndefinedFields?: boolean;
	query?: SearchQuery;
	headers?: Bun.HeadersInit;
	encType?: EncType;
	session?: boolean | string;
	cache?: boolean | CallCacheParameters;
	invalidateTags?: string[];
	processData?: (response: Response) => MayBePromise<TData>;
	processError?: (response: Response) => MayBePromise<TError>;
}

export type SearchQuery = Record<string, unknown> | URLSearchParams;
export type BodyPayload = string | FormData | object;

interface CallCacheParameters {
	/** Data cache duration in seconds. Only success calls can be cached (i.e. status code < 400) */
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
