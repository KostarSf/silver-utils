type PromiseLike<TType> = TType | Promise<TType>;

export interface ISession<TPayload = unknown> {
	name: string;

	get active(): boolean;

	/**
	 * Here you can check your session for expiration and update it if needed.
	 * This method calls right before Fetch request.
	 *
	 * @returns Updated session payload or `null`
	 */
	update(basePath: string): PromiseLike<void>;

	set(payload: TPayload | null): PromiseLike<void>;

	get(): TPayload | null;

	/**
	 * Serialize session into Authorization header value
	 */
	serialize(): PromiseLike<string | undefined>;
}

export type SessionOrConstructor<TPayload = unknown> = { new (): ISession<TPayload> } | ISession<TPayload>;
