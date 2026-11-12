import type {Knex} from 'knex';
export const config={
 port:Number(process.env.PORT??4300),
 databaseUrl:process.env.DATABASE_URL??'postgresql://lab:lab_only@127.0.0.1:55432/allocation_lab',
 poolMin:Number(process.env.DB_POOL_MIN??0),poolMax:Number(process.env.DB_POOL_MAX??8),
 statementTimeout:Number(process.env.DB_STATEMENT_TIMEOUT_MS??120000),
 cutoff:Math.min(5000,Number(process.env.BOARD_QUERY_LIMIT??5000)),
 concurrency:Number(process.env.BOARD_MAX_SIMULTANEOUS_SEARCHES??3),
 maxSubscribers:Number(process.env.BOARD_MAX_ACTIVE_SUBSCRIPTIONS??30),
 maxPerClient:Number(process.env.BOARD_MAX_ACTIVE_SUBSCRIPTIONS_PER_CLIENT??6),
 pollInterval:Number(process.env.BOARD_POLL_INTERVAL_MS??15000),
 mode:process.env.BOARD_SEARCH_MODE==='candidate'?'candidate' as const:'baseline' as const
};
export const knexConfig:Knex.Config={client:'pg',connection:config.databaseUrl,
 pool:{min:config.poolMin,max:config.poolMax,acquireTimeoutMillis:10000},
 acquireConnectionTimeout:10000};
