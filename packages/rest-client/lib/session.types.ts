import type { MayBePromise } from "./types";

export interface ISession<TPayload = unknown> {
	name: string;

	get active(): boolean;

	/**
	 * Here you can check your session for expiration and update it if needed.
	 * This method calls right before Fetch request.
	 *
	 * @returns Updated session payload or `null`
	 */
	update(basePath: string): MayBePromise<void>;

	set(payload: TPayload | null): MayBePromise<void>;

	get(): TPayload | null;

	/**
	 * Serialize session into Authorization header value
	 */
	serialize(): MayBePromise<string | undefined>;
}

export type SessionOrConstructor<TPayload = unknown> = { new (): ISession<TPayload> } | ISession<TPayload>;
