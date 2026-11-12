import type {Knex} from 'knex';
import type {GroupByOption} from '@lab/shared';
export type RefTable='priority'|'objective'|'target'|'area'|'attackPlan'|'ammunition'|'missionOrder'|'operationalPlan'|'warriorMission';
export type GroupOption={table:RefTable;field:string;alias:string;multi?:boolean;joinField?:string};
export type GroupByContext={knex:Knex;joinedTables:Set<string>;mode:'baseline'|'candidate'};
export const groupByMap:Record<GroupByOption,GroupOption>={
 CURRENT_STEP:{table:'priority',field:'currentStep',alias:'CURRENT_STEP'},
 PRIORITY_IN_DESTINATION_FILTER:{table:'priority',field:'priorityInDestination',alias:'PRIORITY_IN_DESTINATION_FILTER'},
 REASON_FOR_COMPLEXITY:{table:'priority',field:'reasonForComplexity',alias:'REASON_FOR_COMPLEXITY'},
 TARGET_FAMILY:{table:'priority',field:'targetFamily',alias:'TARGET_FAMILY'},
 CHOSEN_PLANS_STATUS:{table:'priority',field:'chosenPlansStatus',alias:'CHOSEN_PLANS_STATUS'},
 ATTACK_FACTOR:{table:'priority',field:'attackFactor',alias:'ATTACK_FACTOR'},
 TARGET_COMPLEXITY:{table:'priority',field:'targetComplexity',alias:'TARGET_COMPLEXITY'},
 ATTACK_STATUS:{table:'priority',field:'attackStatus',alias:'ATTACK_STATUS'},
 SECONDARY_PRIORITY:{table:'priority',field:'secondaryPriority',alias:'SECONDARY_PRIORITY'},
 MISSION_NAME:{table:'objective',field:'attackMissionName',alias:'MISSION_NAME'},
 OBJECTIVE_NAME:{table:'objective',field:'name',alias:'OBJECTIVE_NAME'},
 ATTACK_PLAN:{table:'attackPlan',field:'name',alias:'ATTACK_PLAN'},
 AMMUNITION_FILTER:{table:'ammunition',field:'operationalName',alias:'AMMUNITION_FILTER',multi:true,joinField:'ammunitionOperationalIds'},
 WARRIOR_MISSION:{table:'warriorMission',field:'name',alias:'WARRIOR_MISSION',multi:true,joinField:'warriorMissionIds'},
 OPERATIONAL_PLAN:{table:'operationalPlan',field:'name',alias:'OPERATIONAL_PLAN',multi:true,joinField:'attackDemandIds'},
 CONNECTED_MO_IDS:{table:'missionOrder',field:'name',alias:'CONNECTED_MO_IDS',multi:true,joinField:'connectedMoIds'},
 TARGET_COUNTRY:{table:'target',field:'country',alias:'TARGET_COUNTRY'},
 ATTACK_CAUSE:{table:'target',field:'name',alias:'ATTACK_CAUSE'},
 SECTOR_NAME:{table:'area',field:'name',alias:'SECTOR_NAME'}
};
export const FROM={priority:'tap',objective:'obj',target:'tgt',area:'area',attackPlan:'ap',
 ammunition:'ammo',missionOrder:'mo',operationalPlan:'op_match',warriorMission:'wm'} as const;
