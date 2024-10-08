import { Database, Query, ScriptContext } from "../module.gen.ts";
import { Token, tokenFromRow } from "../utils/types.ts";

export interface Request {
	tokens: string[];
}

export interface Response {
	tokens: Token[];
}

export async function run(
	ctx: ScriptContext,
	req: Request,
): Promise<Response> {
  const rows = await ctx.db.query.tokens.findMany({
    where: Query.inArray(Database.tokens.token, req.tokens),
    orderBy: [Query.desc(Database.tokens.createdAt)]
  });

	const tokens = rows.map(tokenFromRow);

	return { tokens };
}
