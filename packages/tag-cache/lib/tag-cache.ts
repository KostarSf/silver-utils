import type { CachePayload, CacheSetParameters } from "./tag-cache.types";

class TagCache {
	#cache = new Map<string, CachePayload>();
	#tags: Record<string, Set<string> | undefined> = {};

	/**
	 * Set cached value.
	 */
	set<TValue = unknown>(key: string, value: TValue, parameters?: CacheSetParameters): void {
		if (parameters?.ttl !== undefined && parameters.ttl <= 0) {
			return;
		}

		const tags = parameters?.tags ?? [key];

		this.#cache.set(key, {
			value: structuredClone(value),
			expires: parameters?.ttl ? Date.now() + parameters.ttl : undefined,
			tags: tags,
		});

		for (const tag of tags) {
			this.#tags[tag] ??= new Set();
			this.#tags[tag].add(key);
		}
	}

	/**
	 * Get cached value by its key.
	 * @returns Cached value or `null`.
	 */
	get<TValue = unknown>(key: string): TValue | null {
		const entry = this.#cache.get(key);
		if (!entry) {
			return null;
		}

		if (entry.expires && entry.expires < Date.now()) {
			this.delete(key);
			return null;
		}

		return structuredClone(entry.value) as TValue;
	}

	/**
	 * Delete cached value by its key.
	 * @returns `true` if walue was deleted and `false` otherwise.
	 */
	delete(key: string): boolean {
		const entry = this.#cache.get(key);
		this.#cache.delete(key);

		for (const tag of entry?.tags ?? []) {
			if (!this.#tags[tag]) {
				continue;
			}

			this.#tags[tag].delete(key);

			if (this.#tags[tag].size === 0) {
				delete this.#tags[tag];
			}
		}

		if (!entry || (entry.expires && entry.expires < Date.now())) {
			return false;
		}

		return true;
	}

	/**
	 * Invalidate cached data by its tags. When called without parameter, all cache will be invalidated.
	 *
	 * @param tags 	A list with tag names for invalidate or `undefined` for invalidate all cache.
	 * 				Empty list will do nothing.
	 */
	invalidate(tags?: string[]): void {
		for (const tag of tags ?? Object.keys(this.#tags)) {
			const keysSet = this.#tags[tag];
			if (!keysSet) {
				continue;
			}

			for (const key of Array.from(keysSet.values())) {
				this.delete(key);
			}
		}
	}
}

export { TagCache, TagCache as default };
