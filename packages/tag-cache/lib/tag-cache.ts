class TagCache {
	#cache = new Map<string, { value: unknown; expires?: number; tags?: string[] }>();
	#tags: Record<string, Set<string> | undefined> = {};

	set<TValue = unknown>(key: string, value: TValue, options?: { tags?: string[]; ttl?: number }): void {
		const tags = options?.tags ?? [key];

		this.#cache.set(key, {
			value: structuredClone(value),
			expires: options?.ttl ? Date.now() + options.ttl : undefined,
			tags: tags,
		});

		for (const tag of tags) {
			this.#tags[tag] ??= new Set();
			this.#tags[tag].add(key);
		}
	}

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
