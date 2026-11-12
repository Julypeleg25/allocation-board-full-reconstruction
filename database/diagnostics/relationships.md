# Synthetic relational contract

The sources are replication tables rather than a normalized domain schema. Array memberships and JSONB links are **logical relationships**, not declared FKs. This avoids falsely implying that screenshots showed enforced constraints.

- `targetAttackPriority.targetId` -> `target.id` (nullable); `sectorId` -> `area.id`; `objectiveId` -> `gdsObjective.glxId`.
- `targetAttackPriority.legacyRafiki` <-> every element of `operationalPlan.attackDemandIds` (may match multiple plans).
- `operationalPlan.warriorMissionIds[]` -> `warriorMission.id`; plan relationship must stay attached to the **same** matched plan.
- `targetAttackPriority.ammunitionOperationalIds` (jsonb text array) -> `global.aggregatedAmmunition.id`.
- `targetAttackPriority.connectedMoIds` (jsonb text array) -> `missionOrder.id`.
- `gdsObjective.attackPlanId` -> `gdsAttackPlan.id`; `gdsConnectionData.objectiveIds[]`, `missionIds[]`, `attackPlanIds[]` join to GDS records.
- `targetAttackPriorityPolicy.attackDemandId` -> `targetAttackPriority.id` and `score.demandId` -> id.

Indexes are intentionally duplicated for investigation, not suggested for real DB deployment. Physical size is only similar *when* explicit optional payload inflation is enabled; an exact TOAST layout is not reproduced by default.
