-- Synthetic replicas of photographed relations. No original/production data is included.
CREATE SCHEMA IF NOT EXISTS replications;
CREATE SCHEMA IF NOT EXISTS global;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS replications."targetAttackPriority" (
 id varchar(255) PRIMARY KEY, "legacyRafiki" varchar(255) UNIQUE NOT NULL,
 "targetId" varchar(255), "objectiveId" varchar(255), "sectorId" varchar(255),
 "attackFactor" varchar(255), "currentStep" varchar(255), "currentStepNumber" integer,
 "targetFamily" varchar(255), "attackStatus" varchar(255), "chosenPlansStatus" varchar(255),
 "targetComplexity" varchar(255), "reasonForComplexity" varchar(255),
 "priorityInDestination" varchar(255), "secondaryPriority" integer,
 "sequence" integer, "policy" boolean, "method" varchar(255),
 "coordinationStatus" varchar(255), "operationalApprovalStatus" varchar(255),
 "operationalDepartmentApprovalStatus" varchar(255),"intelligenceApprovalStatus" varchar(255),
 "isOccupied" boolean, "isAlternative" boolean,"isAttackPrevented" boolean,
 "latestAttackTime" timestamptz,"operationalInternalRemark" text,
 "ammunitionOperationalIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
 "connectedMoIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
 "connectedPlansIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
 "entity" jsonb NOT NULL DEFAULT '{}'::jsonb,
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."operationalPlan" (
 id varchar(255) PRIMARY KEY, name varchar(255) NOT NULL,
 "attackDemandIds" varchar(255)[] NOT NULL DEFAULT '{}',
 "warriorMissionIds" varchar(255)[] NOT NULL DEFAULT '{}',
 "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."warriorMission" (
 id varchar(255) PRIMARY KEY, name varchar(255) NOT NULL,
 "updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."gdsObjective" (
 id varchar(255) PRIMARY KEY, "glxId" varchar(255) UNIQUE NOT NULL,
 "attackMissionName" varchar(255), "attackMissionId" varchar(255), name varchar(255), "attackPlanId" varchar(255),
 "updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."gdsAttackPlan" (
 id varchar(255) PRIMARY KEY, name varchar(255),"updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."target" (
 id varchar(255) PRIMARY KEY, country varchar(255), name varchar(255), "targetCode" varchar(255),
 "hasPartner" boolean,"geoPosition" geometry(Point,4326),"entity" jsonb DEFAULT '{}'::jsonb,
 "updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."area" (
 id varchar(255) PRIMARY KEY, name varchar(255),"updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."missionOrder" (
 id varchar(255) PRIMARY KEY,name varchar(255),entity jsonb DEFAULT '{}'::jsonb,
 "missionOrderForControlBoard" jsonb DEFAULT '{}'::jsonb,
 "sobhMessages" varchar(255)[] DEFAULT '{}', "updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."component" (
 id varchar(255) PRIMARY KEY,"targetId" varchar(255), entity jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS replications."gdsMission" (
 id varchar(255) PRIMARY KEY, name varchar(255)
);
CREATE TABLE IF NOT EXISTS replications."gdsConnectionData" (
 id varchar(255) PRIMARY KEY,"objectiveIds" varchar(255)[] NOT NULL DEFAULT '{}',
 "missionIds" varchar(255)[] NOT NULL DEFAULT '{}',
 "attackPlanIds" varchar(255)[] NOT NULL DEFAULT '{}',
 "updatedAt" timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS replications."targetAttackPriorityPolicy" (
 id varchar(255) PRIMARY KEY,"attackDemandId" varchar(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS replications."score" (
 id varchar(255) PRIMARY KEY,"demandId" varchar(255),"campaignId" varchar(255)
);
CREATE TABLE IF NOT EXISTS global."aggregatedAmmunition" (
 id varchar(255) PRIMARY KEY,"operationalName" varchar(255)
);
-- Information deliberately stored as arrays/JSONB matches photographed joins and fan-out.
-- Logical relationships: TAP.targetId->target.id; TAP.objectiveId->gdsObjective.glxId;
-- TAP.sectorId->area.id; TAP.legacyRafiki MEMBER OF operationalPlan.attackDemandIds;
-- operationalPlan.warriorMissionIds->warriorMission.id; objective.attackPlanId->gdsAttackPlan.id;
-- TAP.connectedMoIds->missionOrder.id; TAP.ammunitionOperationalIds->aggregatedAmmunition.id.
-- No hard FKs for arrays, since the source uses application-managed replicas.
