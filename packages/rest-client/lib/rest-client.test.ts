import { test, expect, describe } from "bun:test";

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
			return this.call<Post, object>(`posts/${id}`);
		}

		async createPost(dto: CreatePostDto) {
			return this.call<Post>("posts", { method: "POST", body: dto });
		}
	}

	const client = new JsonPlaceholderClient();

	test("success GET call", async () => {
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
		const postResult = await client.getPost(101);

		expect(postResult.data).toBe(null);
		expect(postResult.error).toEqual({});
		expect(postResult.status).toBe(404);

		const [post, error, status] = postResult;

		expect(post).toBe(null);
		expect(error).toEqual({});
		expect(status).toBe(404);
	});
});
