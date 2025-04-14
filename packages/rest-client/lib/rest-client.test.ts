import { describe, expect, test } from "bun:test";

import RestClient from "./rest-client";

describe("RestClient", () => {
	interface Post {
		id: number;
		title: string;
		body: string;
		userId: number;
	}

	type CreatePostDto = Omit<Post, "id">;

	class JsonPlaceholderClient extends RestClient {
		constructor() {
			super("https://jsonplaceholder.typicode.com/");
		}

		async getPost(id: number) {
			return this.call<Post, object>(`posts/${id}`, {
				cache: { tags: ["POSTS", `POSTS:${id}`] },
			});
		}

		async findPosts() {
			return this.call<Post[], object>("posts", {
				cache: { tags: ["POSTS"] },
			});
		}

		async findPostsWithSmallCacheTtl() {
			return this.call<Post[], object>("posts", {
				cache: { tags: ["POSTS"], ttl: 1 },
			});
		}

		async createPost(dto: CreatePostDto) {
			return this.call<Post>("posts", {
				method: "POST",
				body: dto,
				invalidateTags: ["POSTS"],
			});
		}
	}

	test("success GET call", async () => {
		const client = new JsonPlaceholderClient();

		const postResult = await client.getPost(1);

		expect(postResult.data).toBeTruthy();
		expect(postResult.data).toBeObject();
		expect(postResult.error).toBe(null);
		expect(postResult.status).toBe(200);

		const [post, error, status] = postResult;

		expect(post).toBeTruthy();
		expect(post).toBeObject();
		expect(error).toBe(null);
		expect(status).toBe(200);
	});

	test("success POST call", async () => {
		const client = new JsonPlaceholderClient();

		const dto: CreatePostDto = { title: "foo", body: "bar", userId: 1 };
		const expectedResult: Post = { ...dto, id: 101 };

		const createResult = await client.createPost(dto);

		expect(createResult.data).toEqual(expectedResult);
		expect(createResult.error).toBe(null);
		expect(createResult.status).toBe(201);

		const [createdPost, error, status] = createResult;

		expect(createdPost).toEqual(expectedResult);
		expect(error).toBe(null);
		expect(status).toBe(201);
	});

	test("error GET call", async () => {
		const client = new JsonPlaceholderClient();

		const postResult = await client.getPost(101);

		expect(postResult.data).toBe(null);
		expect(postResult.error).toEqual({});
		expect(postResult.status).toBe(404);

		const [post, error, status] = postResult;

		expect(post).toBe(null);
		expect(error).toEqual({});
		expect(status).toBe(404);
	});

	test("cache success call", async () => {
		const client = new JsonPlaceholderClient();

		let startTime = Date.now();
		const postResult = await client.getPost(1);
		let duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
		expect(postResult.data).toBeTruthy();
		expect(postResult.data).toBeObject();
		expect(postResult.error).toBe(null);
		expect(postResult.status).toBe(200);

		startTime = Date.now();
		const cachedResult = await client.getPost(1);
		duration = Date.now() - startTime;

		expect(duration).toBeLessThanOrEqual(10);
		expect(cachedResult.data).toEqual(postResult.data);
		expect(cachedResult.data !== postResult.data).toBeTrue();
		expect(postResult.error).toBe(null);
		expect(postResult.status).toBe(200);

		startTime = Date.now();
		const secondPostResult = await client.getPost(2);
		duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
	});

	test("invalidate cache on mutations", async () => {
		const client = new JsonPlaceholderClient();

		let startTime = Date.now();
		const postsResult = await client.findPosts();
		let duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
		expect(postsResult.data).toBeTruthy();
		expect(postsResult.data).toBeArray();
		expect(postsResult.error).toBe(null);
		expect(postsResult.status).toBe(200);

		startTime = Date.now();
		const secondPostsResult = await client.findPosts();
		duration = Date.now() - startTime;

		expect(duration).toBeLessThanOrEqual(10);

		await client.createPost({ title: "foo", body: "bar", userId: 1 });

		startTime = Date.now();
		const thirdPostsResult = await client.findPosts();
		duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
		expect(postsResult.data).toBeTruthy();
		expect(postsResult.data).toBeArray();
		expect(postsResult.error).toBe(null);
		expect(postsResult.status).toBe(200);
	});

	test("cache expires", async () => {
		const client = new JsonPlaceholderClient();

		let startTime = Date.now();
		const postsResult = await client.findPostsWithSmallCacheTtl();
		let duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
		expect(postsResult.data).toBeTruthy();
		expect(postsResult.data).toBeArray();
		expect(postsResult.error).toBe(null);
		expect(postsResult.status).toBe(200);

		await Bun.sleep(900);

		startTime = Date.now();
		const secondPostsResult = await client.findPosts();
		duration = Date.now() - startTime;

		expect(duration).toBeLessThanOrEqual(10);
		expect(postsResult.data).toBeTruthy();
		expect(postsResult.data).toBeArray();
		expect(secondPostsResult.status).toBe(200);

		await Bun.sleep(200);

		startTime = Date.now();
		const thirdPostsResult = await client.findPosts();
		duration = Date.now() - startTime;

		expect(duration).toBeGreaterThan(10);
		expect(postsResult.data).toBeTruthy();
		expect(postsResult.data).toBeArray();
		expect(thirdPostsResult.status).toBe(200);
	});
});
