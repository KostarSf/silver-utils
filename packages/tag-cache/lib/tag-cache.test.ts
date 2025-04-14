import { test, expect } from "bun:test";
import TagCache from "./tag-cache";
import { sleepSync } from "bun";

test("can cache by key", () => {
	const cache = new TagCache();
	const obj = { foo: "bar", a: 1 };
	const key = "obj:key";

	expect(cache.get(key)).toBeNull();

	cache.set(key, obj);

	const cachedObj = cache.get(key);
	expect(cachedObj).toEqual(obj);
	expect(cachedObj === obj).toBe(false);

	expect(cache.delete(key)).toBe(true);
	expect(cache.get(key)).toBeNull();
});

test("cache should expire", () => {
	const cache = new TagCache();
	const value = 16;
	const key = "obj:key";
	const ttl = 100;

	expect(cache.get(key)).toBeNull();
	cache.set(key, value, { ttl });

	sleepSync(ttl - 10);
	expect(cache.get<typeof value>(key)).toBe(value);

	sleepSync(20);
	expect(cache.get(key)).toBeNull();
});

test("cache should be invalidated by tags", () => {
	const cache = new TagCache();
	const value1 = 16;
	const value2 = "foo";
	const value3 = "bar";
	const value4 = 42;
	const key1 = "key:1";
	const key2 = "key:2";
	const key3 = "key:3";
	const key4 = "key:4";
	const tag1 = "tag1";
	const tag2 = "tag2";
	const tag3 = "tag3";

	expect(cache.get(key1)).toBeNull();
	expect(cache.get(key2)).toBeNull();
	expect(cache.get(key3)).toBeNull();

	cache.set(key1, value1, { tags: [tag1] });
	cache.set(key2, value2, { tags: [tag1] });
	cache.set(key3, value3, { tags: [tag1, tag2] });
	cache.set(key4, value4, { tags: [tag3] });

	expect(cache.get<typeof value1>(key1)).toBe(value1);
	expect(cache.get<typeof value2>(key2)).toBe(value2);
	expect(cache.get<typeof value3>(key3)).toBe(value3);
	expect(cache.get<typeof value4>(key4)).toBe(value4);

	cache.invalidate([tag2]);

	expect(cache.get<typeof value1>(key1)).toBe(value1);
	expect(cache.get<typeof value2>(key2)).toBe(value2);
	expect(cache.get<typeof value3>(key3)).toBeNull();
	expect(cache.get<typeof value4>(key4)).toBe(value4);

	cache.invalidate([tag3]);

	expect(cache.get<typeof value1>(key1)).toBe(value1);
	expect(cache.get<typeof value2>(key2)).toBe(value2);
	expect(cache.get<typeof value3>(key3)).toBeNull();
	expect(cache.get<typeof value4>(key4)).toBeNull();

	cache.invalidate([tag1]);

	expect(cache.get<typeof value1>(key1)).toBeNull();
	expect(cache.get<typeof value2>(key2)).toBeNull();
	expect(cache.get<typeof value3>(key3)).toBeNull();
	expect(cache.get<typeof value4>(key4)).toBeNull();

	// --

	cache.set(key1, value1, { tags: [tag1] });
	cache.set(key2, value2, { tags: [tag2] });
	cache.set(key3, value3, { tags: [tag3] });

	expect(cache.get<typeof value1>(key1)).toBe(value1);
	expect(cache.get<typeof value2>(key2)).toBe(value2);
	expect(cache.get<typeof value3>(key3)).toBe(value3);

	cache.invalidate([tag1, tag2]);

	expect(cache.get<typeof value1>(key1)).toBeNull();
	expect(cache.get<typeof value2>(key2)).toBeNull();
	expect(cache.get<typeof value3>(key3)).toBe(value3);

	// --

	cache.set(key1, value1, { tags: [tag1] });
	cache.set(key2, value2, { tags: [tag2] });
	cache.set(key3, value4);

	expect(cache.get<typeof value1>(key1)).toBe(value1);
	expect(cache.get<typeof value2>(key2)).toBe(value2);
	expect(cache.get<typeof value4>(key3)).toBe(value4);

	cache.invalidate();

	expect(cache.get<typeof value1>(key1)).toBeNull();
	expect(cache.get<typeof value2>(key2)).toBeNull();
	expect(cache.get<typeof value4>(key3)).toBeNull();
});
