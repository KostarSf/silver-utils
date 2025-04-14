import TagCache from "@kostar/tag-cache";
import type {
	BodyPayload,
	CallError,
	CallParameters,
	CallResult,
	CallSuccess,
	EncType,
	HttpMethod,
	SearchQuery,
} from "./rest-client.types";
import { createCallResult } from "./utils";

class RestClient<TSessionPayload = unknown> {
	// #session: TSessionPayload | null = null;
	#cache = new TagCache();

	#basePath: string;

	constructor(basePath = "") {
		this.#basePath = basePath;
	}

	protected async call<TData, TError>(
		path: string,
		parameters?: CallParameters,
	): Promise<CallResult<TData, TError>> {
		const method = parameters?.method ?? "GET";
		const fullPath = path + this.#prepareSearchParams(parameters?.query);
		const encType = parameters?.body ? (parameters?.encType ?? "application/json") : undefined;

		const cachedResult = Boolean(parameters?.cache) && this.#cache.get<TData>(fullPath);
		if (cachedResult) {
			return Promise.resolve(createCallResult(cachedResult, null, 200));
		}

		const headers = this.#prepareHeaders(encType, parameters?.headers);
		const body = this.#prepareBody(encType, parameters?.body);

		const response = await fetch(this.#basePath + fullPath, { method, headers, body });
		const callResult = await this.#processResult<TData, TError>(response);

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

	#prepareHeaders(encType: EncType | undefined, init: Bun.HeadersInit | undefined): Headers {
		const headers = new Headers(init);

		if (encType && !headers.has("content-type")) {
			headers.set("content-type", `${encType}; charset=utf-8`);
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

	async #processResult<TData, TError>(response: Response): Promise<CallResult<TData, TError>> {
		let data: unknown = null;

		if (response.status !== 204 && response.headers.get("content-type")?.includes("application/json")) {
			data = await response.json();
		}

		if (response.status !== 204 && response.headers.get("content-type")?.includes("text/")) {
			data = await response.text();
		}

		if (!response.ok) {
			const error = response.status >= 500 ? `${response.status}: ${response.statusText}` : data;
			console.error(data || error);

			return createCallResult(null, error, response.status) as CallError<TError>;
		}

		return createCallResult(data, null, response.status) as CallSuccess<TData>;
	}
}

export { RestClient, RestClient as default };
