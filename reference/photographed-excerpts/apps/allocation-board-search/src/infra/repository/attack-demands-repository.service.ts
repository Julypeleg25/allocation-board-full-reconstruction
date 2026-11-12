/** CURRENT PHOTOGRAPHED: lines 4-259 of AttackDemandsRepositoryService.
 * Original imports/model definitions not recovered. Semantics reflect source snippets.
 * This EXCERPT is not an actual compilable Nest provider without the original project.
 */
export class AttackDemandsRepositoryService implements RepositoryInterface<AttackDemandUpdatedAtResult> {
  private priorityTable = 'targetAttackPriority';
  private targetTable = 'target';
  private objectiveTable = 'gdsObjective';
  private componentTable = 'component';
  private areaTable = 'area';
  private targetEssenceTable = 'targetEssence';
  private missionTable = 'gdsMission';
  private attackPlanTable = 'gdsAttackPlan';
  private tables = {
    target: this.fullTableName(this.targetTable, 'replications'),
    objective: this.fullTableName(this.objectiveTable, 'replications'),
    priority: this.fullTableName(this.priorityTable, 'replications'),
    component: this.fullTableName(this.componentTable, 'replications'),
    area: this.fullTableName(this.areaTable, 'replications'),
    targetEssence: this.fullTableName(this.targetEssenceTable, 'replications'),
    mission: this.fullTableName(this.missionTable, 'replications'),
    attackPlan: this.fullTableName(this.attackPlanTable, 'replications'),
  };
  constructor(private knex: Knex, private attackDemandIds: string[], private logger?: AppLoggerService) {}

  async search(): Promise<AttackDemandUpdatedAtResult> {
    const startedAt = Date.now();
    const idCount = this.attackDemandIds.length;
    if (!idCount) {
      this.logger?.debug('search: no attackDemandIds provided, returning empty');
      return { attackDemands: [] };
    }
    try {
      this.logger?.debug('searching attack demands by ids', { attackDemandIdsCount: idCount });
      const joinedTablesQuery = this.joinedTables();
      const attackDemandsUpdatedAtQuery = this.getAttackDemandUpdatedAtByIds(joinedTablesQuery);
      const [attackDemands, components] = await Promise.all([
        attackDemandsUpdatedAtQuery,
        this.getComponentsByAttackableIds({ distinct: true }),
      ]);
      this.logger?.info('attack demands query complete', {
        totalRows: attackDemands.length, durationMs: Date.now() - startedAt,
      });
      const componentsUpdatedAtByAttackDemandId = keyBy(components, 'attackDemandId');
      return { attackDemands: attackDemands.map((attackDemand) => ({
        id: attackDemand.id,
        updatedAt: this.getLatestUpdatedAt(attackDemand,
          [componentsUpdatedAtByAttackDemandId[attackDemand.id]?.updatedAt]).toISOString(),
      })) };
    } catch (error) {
      this.logger?.error('search: failed to fetch attack demands', {
        idCount, durationMs: Date.now() - startedAt, error,
      });
      throw error;
    }
  }

  async getAttackDemandsByIds(): Promise<AggregatedAttackDemandsResult> {
    const startedAt = Date.now();
    const idCount = this.attackDemandIds.length;
    if (!idCount) return { attackDemands: [] };
    try {
      const joinedTablesQuery = this.joinedTables();
      const attackDemandsQuery = this.getAttackDemandUpdatedAtByIds(this.selectEntities(joinedTablesQuery));
      const [attackDemands, components] = await Promise.all([
        attackDemandsQuery, this.getComponentsByAttackableIds({ distinct: false }),
      ]);
      const componentsByAttackDemandMap = groupBy(components, 'attackDemandId');
      return { attackDemands: attackDemands.map((attackDemand) => {
        const components = componentsByAttackDemandMap[attackDemand.id];
        const latestUpdatedAt = this.getLatestUpdatedAt(
          attackDemand, components?.map(({ componentUpdatedAt }) => componentUpdatedAt),
        );
        attackDemand.attackDemandEntity.stepAndRole = {
          ...attackDemand.attackDemandEntity.stepAndRole,
          currentStepNumber: attackDemand.currentStepNumber,
        };
        return {
          id: attackDemand.id,
          updatedAt: latestUpdatedAt.toISOString(),
          attackDemandEntity: attackDemand.attackDemandEntity,
          connectedPlans: attackDemand.connectedPlans,
          target: { ...attackDemand.targetEntity,
            hasPartner: attackDemand.targetHasPartner,
            isRestricted: attackDemand.targetIsRestricted },
          targetEssence: attackDemand.targetEssence,
          areaName: attackDemand.areaName,
          objective: { objectiveName: attackDemand.objectiveName,
            objectiveNumber: attackDemand.objectiveNumber },
          mission: { missionName: attackDemand.missionName,
            missionNumber: attackDemand.missionNumber },
          attackPlan: { attackPlanName: attackDemand.attackPlanName,
            attackPlanNumber: attackDemand.attackPlanNumber },
          components: components?.map(({ component }) => component) ?? [],
        };
      }) };
    } catch (error) {
      this.logger?.error('getAttackDemandsByIds: failed to fetch attack demands', {
        idCount, durationMs: Date.now() - startedAt, error,
      });
      throw error;
    }
  }

  private getLatestUpdatedAt(
    attackDemand: { attackDemandUpdatedAt: Date; targetUpdatedAt: Date;
      areaUpdatedAt: Date; objectiveUpdatedAt: Date },
    componentsUpdatedAt: (Date | undefined)[] | undefined,
  ) {
    const updatedAtArray = compact([
      attackDemand.attackDemandUpdatedAt,
      attackDemand.targetUpdatedAt,
      attackDemand.areaUpdatedAt,
      attackDemand.objectiveUpdatedAt,
    ].concat(componentsUpdatedAt ?? []));
    return moment.max(updatedAtArray.map((d) => moment(d)));
  }

  private joinedTables() {
    let query = this.selectAttackDemandFrom();
    query = this.getTargetByGlxId(query);
    query = this.getAreaName(query);
    query = this.getObjectiveData(query);
    query = this.getTargetEssenceName(query);
    query = this.getMissionData(query);
    query = this.getAttackPlanData(query);
    return query;
  }

  private selectAttackDemandFrom() {
    const priorityTable = this.tables.priority;
    return this.knex.from(`${priorityTable} as targetAttackPriority`);
  }
  private getAttackDemandUpdatedAtByIds(query: Knex.QueryBuilder) {
    return query.select([
      'targetAttackPriority.id',
      'targetAttackPriority.updatedAt as attackDemandUpdatedAt',
      'target.updatedAt as targetUpdatedAt',
      'area.updatedAt as areaUpdatedAt',
      'objective.updatedAt as objectiveUpdatedAt',
      'essence.name as targetEssence',
    ]).whereIn('targetAttackPriority.id', this.attackDemandIds);
  }
  private selectEntities(query: Knex.QueryBuilder): Knex.QueryBuilder<object> {
    return query.select([
      'targetAttackPriority.entity as attackDemandEntity',
      'targetAttackPriority.currentStepNumber as currentStepNumber',
      'targetAttackPriority.connectedPlans',
      'target.entity as targetEntity',
      'target.hasPartner as targetHasPartner',
      'target.isRestricted as targetIsRestricted',
      'area.name as areaName',
      'objective.name as objectiveName',
      'objective.number as objectiveNumber',
      'mission.name as missionName',
      'mission.number as missionNumber',
      'attackPlan.name as attackPlanName',
      'attackPlan.number as attackPlanNumber',
    ]);
  }
  private getTargetByGlxId(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.target} as target`,
      'target.id', 'targetAttackPriority.targetId');
  }
  private getAreaName(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.area} as area`,
      'area.id', 'targetAttackPriority.sectorId');
  }
  private getObjectiveData(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.objective} as objective`,
      'objective.glxId', 'targetAttackPriority.objectiveId');
  }
  private getTargetEssenceName(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.targetEssence} as essence`,
      'target.essence', 'essence.id');
  }
  private getMissionData(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.mission} as mission`,
      'mission.id', 'objective.attackMissionId');
  }
  private getAttackPlanData(query: Knex.QueryBuilder) {
    return query.leftJoin(`${this.tables.attackPlan} as attackPlan`,
      'attackPlan.id', 'objective.attackPlanId');
  }

  private getComponentsByAttackableIds({ distinct }: { distinct: boolean }) {
    const priorityTable = this.tables.priority;
    const componentTable = this.tables.component;
    // Original code builds quoted priority identifier with split + join.
    const doubleQuotePriorityTableName = priorityTable.split('.')
      .map((name) => `"${name}"`).join('.');
    const query = this.knex.from(priorityTable);
    if (distinct) {
      query.select([
        this.knex.raw(`DISTINCT ON (${doubleQuotePriorityTableName}.id) ${doubleQuotePriorityTableName}.id AS "attackDemandId"`),
        `${componentTable}.updatedAt as componentUpdatedAt`,
      ]);
    } else {
      query.select([
        `${componentTable}.entity as component`,
        `${componentTable}.updatedAt as componentUpdatedAt`,
        `${priorityTable}.id as attackDemandId`,
      ]);
    }
    return query
      .joinRaw(`JOIN LATERAL UNNEST(${doubleQuotePriorityTableName}."attackableIds") AS tp("componentGlxId") ON TRUE`)
      .join(componentTable, `${componentTable}.glxId`, 'tp.componentGlxId')
      .whereIn(`${priorityTable}.id`, this.attackDemandIds)
      .orderBy([
        { column: `${priorityTable}.id`, order: 'asc' },
        { column: `${componentTable}.updatedAt`, order: 'desc', nulls: 'last' },
      ]);
  }
  private fullTableName(table: string, schema: DatabaseSchema) {
    return `${schema}.${table}`;
  }
}
