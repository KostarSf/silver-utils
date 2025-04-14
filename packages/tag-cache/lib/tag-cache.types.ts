export interface CachePayload {
	value: unknown;
	expires?: number;
	tags?: string[];
}

export interface CacheSetParameters {
	/** Invalidation tags for this value. If `undefined`, the value's key will be used as a single tag. */
	tags?: string[];
	/** Value's life time in ms. Indefinetely if `undefined` */
	ttl?: number;
}
