import type { MayBePromise } from "./types";

export interface ISession<TPayload = unknown> {
	name: string;

	/** Returns `true` if this session is currently valid to make authorized requests and `fase` othervise */
	get active(): boolean;

	/**
	 * Here you can check your session for expiration and update it if needed.
	 * This method calls right before Fetch request.
	 *
	 * @returns Updated session payload or `null`
	 */
	update(basePath: string): MayBePromise<void>;

	/** Set the payload for current session or `null` for resetting it */
	set(payload: TPayload | null): MayBePromise<void>;

	/** Get the payload for this session. Session may not be active. */
	get(): TPayload | null;

	/** Serialize session into Authorization header value. */
	serialize(): MayBePromise<string | undefined>;
}

export type SessionOrConstructor<TPayload = unknown> = { new (): ISession<TPayload> } | ISession<TPayload>;
