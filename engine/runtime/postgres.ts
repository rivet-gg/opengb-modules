import * as postgres from "postgres/mod.ts";

const POOL_SIZE = 32;

type PostgresRunScope<T> = (conn: postgres.QueryClient) => Promise<T>;
type PostgresTransactionScope<T> = (conn: postgres.Transaction) => Promise<T>;

/** Manages Postgres connections. */
export class Postgres {
    private databaseUrl: string; 
    public pools = new Map<string, postgres.Pool>();

    public constructor() {
        this.databaseUrl = Deno.env.get("DATABASE_URL") ?? "postgres://postgres:password@localhost:5432/postgres";
    }

    public async shutdown() {
        for (let pool of this.pools.values()) {
            await pool.end();
        }
    }

    private getOrCreatePool(database: string): postgres.Pool {
        if (this.pools.has(database)) {
            return this.pools.get(database)!;
        } else {
            // Build URL for this database
            let url = new URL(this.databaseUrl);
            url.pathname = "/module_" + database;

            // Create & insert pool
            let pool = new postgres.Pool(url.toString(), POOL_SIZE, true);
            this.pools.set(database, pool);
            return pool;
        }
    }

    public async run<T>(database: string, scope: PostgresRunScope<T>): Promise<T> {
        const connection = await this.getOrCreatePool(database).connect();
        try {
            return scope(connection);
        } finally {
            connection.release();
        }
    }
}

/** A wrapper around Postgres with a specified database. */
export class PostgresWrapped {
    public constructor(private postgres: Postgres, private database: string) {}

    public async run<T>(scope: PostgresRunScope<T>): Promise<T> {
        return await this.postgres.run<T>(this.database, scope);
    }

    public async transaction<T>(name: string, scope: PostgresTransactionScope<T>): Promise<T> {
        return await this.run(async conn => {
            const transaction = conn.createTransaction(name);
            await transaction.begin();
            try {
                const result = await scope(transaction);
                await transaction.commit();
                return result;
            } catch (cause) {
                try {
                    await transaction.rollback();
                } catch (cause) {
                    console.warn('Failed to rollback transaction', cause);
                }
                throw new Error(`Failed to execute transaction: ${name}`, { cause });
            }
        });
    }
}
