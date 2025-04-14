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

export { createCallResult };
