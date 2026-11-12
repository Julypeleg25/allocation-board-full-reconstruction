-- Baseline index shape. Duplicates mimic measured legacy + generated-index overlap.
-- These are for a disposable local benchmark DB, NOT recommendations for production DDL.
CREATE INDEX IF NOT EXISTS tap_target_id ON replications."targetAttackPriority" ("targetId");
CREATE INDEX IF NOT EXISTS tap_objective_id ON replications."targetAttackPriority" ("objectiveId");
CREATE INDEX IF NOT EXISTS tap_sector_id ON replications."targetAttackPriority" ("sectorId");
CREATE INDEX IF NOT EXISTS tap_legacy_rafiki ON replications."targetAttackPriority" ("legacyRafiki");
CREATE INDEX IF NOT EXISTS tap_target_id_duplicate ON replications."targetAttackPriority" ("targetId");
CREATE INDEX IF NOT EXISTS tap_objective_id_duplicate ON replications."targetAttackPriority" ("objectiveId");
CREATE INDEX IF NOT EXISTS tap_legacy_rafiki_duplicate ON replications."targetAttackPriority" ("legacyRafiki");
CREATE INDEX IF NOT EXISTS op_array_gin ON replications."operationalPlan" USING gin ("attackDemandIds");
CREATE INDEX IF NOT EXISTS op_mission_array_gin ON replications."operationalPlan" USING gin ("warriorMissionIds");
CREATE INDEX IF NOT EXISTS tap_ammunition_gin ON replications."targetAttackPriority" USING gin ("ammunitionOperationalIds");
CREATE INDEX IF NOT EXISTS tap_connected_mo_gin ON replications."targetAttackPriority" USING gin ("connectedMoIds");
CREATE INDEX IF NOT EXISTS target_code_trgm ON replications."target" ("targetCode");
CREATE INDEX IF NOT EXISTS policy_demand ON replications."targetAttackPriorityPolicy" ("attackDemandId");
CREATE INDEX IF NOT EXISTS score_demand_campaign ON replications."score" ("demandId","campaignId");
