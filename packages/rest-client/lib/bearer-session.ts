import type { ISession } from "./session.types";

class BearerSession implements ISession<string> {
	name = "bearer";

	private token: string | null = null;
	private prefix: string;

	get active(): boolean {
		return this.token !== null;
	}

	constructor(prefix = "Bearer") {
		this.prefix = prefix;
	}

	update(): void {}

	set(token: string | null): void {
		this.token = token;
	}

	get(): string | null {
		return this.token;
	}

	serialize(): string | undefined {
		return this.token ? `${this.prefix} ${this.token}` : undefined;
	}
}

export { BearerSession };
