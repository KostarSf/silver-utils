import type { CallError, CallResult, CallSuccess } from "./rest-client.types";

function createCallResult<TData, TError extends null>(
	data: TData,
	error: TError,
	status: number,
): CallSuccess<TData>;
function createCallResult<TData extends null, TError>(
	data: TData,
	error: TError,
	status: number,
): CallError<TError>;
function createCallResult<TData = unknown, TError = unknown>(
	data: TData,
	error: TError,
	status: number,
): CallResult<TData, TError> {
	const result = {
		data,
		error,
		status,
		[Symbol.iterator]: function* () {
			yield data;
			yield error;
			yield status;
		},
	};

	return result as unknown as CallResult<TData, TError>;
}

class InvalidSessionNameError extends Error {
	constructor(sessionName?: string) {
		super(`Can't find session'${typeof sessionName === "string" ? ` with name ${sessionName}.` : "."}'`);
	}
}

export { createCallResult, InvalidSessionNameError };
