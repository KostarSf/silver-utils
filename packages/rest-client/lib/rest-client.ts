import TagCache from "@kostar/tag-cache";

import { BearerSession } from "./bearer-session";
import type {
	BodyPayload,
	CallError,
	CallParameters,
	CallResult,
	CallSuccess,
	RestClientParameters,
	SearchQuery,
} from "./rest-client.types";
import type { ISession } from "./session.types";
import type { EncType, MayBePromise } from "./types";
import { InvalidSessionNameError, createCallResult } from "./utils";

class RestClient<TDefaultSessionPayload = unknown> {
	#sessionStore = new Map<string, ISession>();
	#cache = new TagCache();

	#basePath: string;
	#defaultSession: string | boolean;

	/**
	 * Creates an instance of RestClient.
	 */
	constructor(parameters?: RestClientParameters) {
		this.#basePath = parameters?.basePath ?? "";
		this.#defaultSession = parameters?.defaultSession ?? false;

		for (const sessionLike of parameters?.sessions ?? [BearerSession]) {
			const session = typeof sessionLike === "function" ? new sessionLike() : sessionLike;
			this.#sessionStore.set(session.name, session);
		}
	}

	/**
	 * Check if the given session is active
	 * @param sessionName The name of the session. Uses default session if `undefined`.
	 */
	hasSession(sessionName?: string): boolean {
		const session = this.#getSession(sessionName);
		return session.active;
	}

	async setSession(payload: TDefaultSessionPayload | null): Promise<void>;
	async setSession<TPayload = TDefaultSessionPayload>(
		sessionName: string,
		payload: TPayload | null,
	): Promise<void>;
	async setSession<TPayload = TDefaultSessionPayload>(
		payloadOrSessionName: TPayload | null | string,
		mayBePayload?: TPayload | null,
	): Promise<void> {
		const payload = mayBePayload !== undefined ? mayBePayload : (payloadOrSessionName as TPayload);
		const sessionName = mayBePayload !== undefined ? (payloadOrSessionName as string) : undefined;

		const session = this.#getSession<TPayload>(sessionName);
		await session.set(payload);
	}

	getSession<TPayload = TDefaultSessionPayload>(sessionName?: string): TPayload | null {
		return this.#getSession<TPayload>(sessionName).get();
	}

	#getSession<TPayload = TDefaultSessionPayload>(sessionName?: string): ISession<TPayload> {
		let session: ISession<TPayload> | undefined = undefined;
		if (sessionName !== undefined) {
			session = this.#sessionStore.get(sessionName) as ISession<TPayload> | undefined;
		} else {
			session = this.#sessionStore.values().next().value as ISession<TPayload> | undefined;
		}

		if (!session) {
			throw new InvalidSessionNameError(sessionName);
		}

		return session;
	}

	protected async call<TData = unknown, TError = unknown>(
		path: string,
		parameters?: CallParameters<TData, TError>,
	): Promise<CallResult<TData, TError>> {
		const method = parameters?.method ?? "GET";
		const fullPath = path + this.#prepareSearchParams(parameters?.query);
		const encType = parameters?.body ? (parameters?.encType ?? "application/json") : undefined;

		const cachedResult = Boolean(parameters?.cache) && this.#cache.get<TData>(fullPath);
		if (cachedResult) {
			return Promise.resolve(createCallResult(cachedResult, null, 200));
		}

		const session = parameters?.session ?? this.#defaultSession;
		const headers = await this.#prepareHeaders(encType, session, parameters?.headers);
		const body = this.#prepareBody(encType, parameters?.body);

		const response = await fetch(this.#basePath + fullPath, { method, headers, body });
		const callResult = await this.#processResult<TData, TError>(
			response,
			parameters?.processData,
			parameters?.processError,
		);

		if (parameters?.cache && callResult.status < 400) {
			this.#cache.set(
				fullPath,
				callResult.data,
				typeof parameters.cache === "object"
					? {
							ttl: parameters.cache.ttl ? parameters.cache.ttl * 1000 : undefined,
							tags: parameters.cache.tags,
						}
					: undefined,
			);
		}

		if (parameters?.invalidateTags?.length) {
			this.#cache.invalidate(parameters.invalidateTags);
		}

		return callResult;
	}

	#prepareSearchParams(query?: SearchQuery) {
		if (!query) {
			return "";
		}

		if (query instanceof URLSearchParams) {
			return `?${query}`;
		}

		const searchParams = new URLSearchParams();

		for (const [key, value] of Object.entries(query)) {
			if (value === null || value === undefined) {
				continue;
			}

			if (typeof value === "object") {
				if (Array.isArray(value)) {
					searchParams.set(key, value.join(","));
				} else {
					searchParams.set(key, JSON.stringify(value));
				}
			}

			searchParams.set(key, String(value));
		}

		return `?${searchParams}`;
	}

	async #prepareHeaders(
		encType: EncType | undefined,
		sessionName: string | boolean,
		init: Bun.HeadersInit | undefined,
	): Promise<Headers> {
		const headers = new Headers(init);

		if (encType && !headers.has("content-type")) {
			headers.set("content-type", `${encType}; charset=utf-8`);
		}

		if (sessionName !== false) {
			const session = this.#getSession(typeof sessionName === "string" ? sessionName : undefined);
			await session.update(this.#basePath);

			const authorization = await session.serialize();
			if (authorization) {
				headers.set("Authorization", authorization);
			}
		}

		return headers;
	}

	#prepareBody(
		encType: EncType | undefined,
		bodyPayload: BodyPayload | undefined,
	): string | FormData | undefined {
		if (!bodyPayload || typeof bodyPayload === "string" || bodyPayload instanceof FormData) {
			return bodyPayload;
		}

		if (encType === "application/json" || encType === "text/plain") {
			return JSON.stringify(bodyPayload);
		}

		const formData = new FormData();

		for (const [key, value] of Object.entries(bodyPayload)) {
			if (value === "" || value === null || value === undefined || value === false) {
				continue;
			}

			if (typeof value === "string" || value instanceof File) {
				formData.set(key, value);
				continue;
			}

			formData.set(key, JSON.stringify(value));
		}

		return formData;
	}

	async #processResult<TData, TError>(
		response: Response,
		processData: ((response: Response) => MayBePromise<TData>) | undefined,
		processError: ((response: Response) => MayBePromise<TError>) | undefined,
	): Promise<CallResult<TData, TError>> {
		if (!response.ok) {
			const error = processError
				? await processError(response)
				: await this.#defaultDataProcessor<TError>(response);

			return createCallResult(null, error, response.status) as CallError<TError>;
		}

		const data = processData
			? await processData(response)
			: await this.#defaultDataProcessor<TData>(response);

		return createCallResult(data, null, response.status) as CallSuccess<TData>;
	}

	async #defaultDataProcessor<TData>(response: Response): Promise<TData> {
		let data: unknown = null;

		if (response.status !== 204 && response.headers.get("content-type")?.includes("application/json")) {
			data = await response.json();
		}

		if (response.status !== 204 && response.headers.get("content-type")?.includes("text/")) {
			data = await response.text();
		}

		if (!response.ok && response.status >= 500) {
			data = `${response.status}: ${response.statusText}`;
		}

		return data as TData;
	}
}

export { RestClient };
