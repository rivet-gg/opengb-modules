import { RuntimeError, ScriptContext } from "../module.gen.ts";
import { Token } from "../utils/types.ts";

export interface Request {
	token: string;
}

export interface Response {
	token: Token;
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
	const { tokens } = await ctx.modules.tokens.fetchByToken({
		tokens: [req.token],
	});
	const token = tokens[0];

	if (!token) throw new RuntimeError("token_not_found");

	if (token.revokedAt) throw new RuntimeError("token_revoked");

	if (token.expireAt) {
		const expireAt = new Date(token.expireAt);
		const now = new Date();
		if (expireAt < now) {
			throw new RuntimeError("token_expired");
		}
	}

	return { token };
}
