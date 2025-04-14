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
): CallError<TData>;
function createCallResult<TData, TError>(data: TData, error: TError, status: number) {
	return {
		data,
		error,
		status,
		[Symbol.iterator]: function* () {
			yield [data, error, status];
		},
	} as CallResult<TData, TError>;
}

export { createCallResult };
