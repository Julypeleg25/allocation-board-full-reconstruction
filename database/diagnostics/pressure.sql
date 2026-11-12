SELECT state,wait_event_type,wait_event,COUNT(*) FROM pg_stat_activity WHERE datname=current_database()
 GROUP BY state,wait_event_type,wait_event ORDER BY 4 DESC;
SELECT name, setting,unit FROM pg_settings WHERE name IN ('max_connections','work_mem','shared_buffers','statement_timeout');
SELECT relname,seq_scan,idx_scan,n_live_tup,n_dead_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 30;
SELECT query, calls, total_exec_time,mean_exec_time FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;
-- Last query requires pg_stat_statements extension; ignore if not provisioned.
