export type MayBePromise<TType> = TType | Promise<TType>;

export type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | (string & {});

export type EncType =
	| "application/x-www-form-urlencoded"
	| "multipart/form-data"
	| "text/plain"
	| "application/json";
