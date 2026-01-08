/**
 * @riktajs/typeorm
 * 
 * TypeORM integration for Rikta Framework.
 * 
 * This package provides seamless TypeORM integration using Rikta's
 * lifecycle system and dependency injection container.
 * 
 * Features:
 * - Automatic DataSource initialization via OnProviderInit
 * - Automatic connection cleanup via OnProviderDestroy
 * - Injectable DataSource and EntityManager via @Autowired
 * - Environment-based configuration with Zod validation
 * - Support for multiple datasources
 * - Re-exported TypeORM decorators for convenience
 * 
 * @example
 * ```typescript
 * import { Injectable, Autowired } from '@riktajs/core';
 * import { 
 *   TYPEORM_DATA_SOURCE, 
 *   Entity, 
 *   Column, 
 *   PrimaryGeneratedColumn 
 * } from '@riktajs/typeorm';
 * import type { DataSource } from '@riktajs/typeorm';
 * 
 * @Entity()
 * class User {
 *   @PrimaryGeneratedColumn()
 *   id!: number;
 * 
 *   @Column()
 *   name!: string;
 * 
 *   @Column()
 *   email!: string;
 * }
 * 
 * @Injectable()
 * class UserService {
 *   @Autowired(TYPEORM_DATA_SOURCE)
 *   private dataSource!: DataSource;
 * 
 *   async findAll() {
 *     return this.dataSource.getRepository(User).find();
 *   }
 * 
 *   async create(name: string, email: string) {
 *     const user = new User();
 *     user.name = name;
 *     user.email = email;
 *     return this.dataSource.getRepository(User).save(user);
 *   }
 * }
 * ```
 * 
 * @packageDocumentation
 */

// ============================================================================
// Injection Tokens
// ============================================================================

export { 
  TYPEORM_DATA_SOURCE, 
  TYPEORM_ENTITY_MANAGER,
  // Multiple datasources helpers
  getDataSourceToken,
  getEntityManagerToken,
} from './constants.js';

// ============================================================================
// Providers
// ============================================================================

export { 
  TypeOrmProvider, 
  createTypeOrmProvider,
  initializeTypeOrm,
  configureTypeOrm,
  // Multiple datasources
  createNamedTypeOrmProvider,
  getTypeOrmProvider,
  getAllTypeOrmProviders,
  initializeAllTypeOrmProviders,
  destroyAllTypeOrmProviders,
} from './providers/typeorm.provider.js';

export type { 
  TypeOrmModuleOptions 
} from './providers/typeorm.provider.js';

// ============================================================================
// Types
// ============================================================================

export type { 
  DatabaseType,
  TypeOrmProviderOptions 
} from './types.js';

// Re-export common TypeORM types for convenience
export type {
  DataSource,
  EntityManager,
  Repository,
  ObjectLiteral,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  EntityTarget,
  InsertResult,
  UpdateResult,
  DeleteResult,
  SelectQueryBuilder,
  QueryRunner,
  DataSourceOptions,
  EntitySchema,
  MigrationInterface,
  QueryBuilder,
  TreeRepository,
  MongoRepository,
} from 'typeorm';

// ============================================================================
// TypeORM Entity Decorators
// ============================================================================

export {
  // Entity decorators
  Entity,
  ViewEntity,
  ChildEntity,
  
  // Column decorators
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ObjectIdColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  Generated,
  VirtualColumn,
  
  // Relation decorators
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  RelationId,
  
  // Tree decorators
  Tree,
  TreeParent,
  TreeChildren,
  TreeLevelColumn,
  
  // Index decorators
  Index,
  Unique,
  Check,
  Exclusion,
  
  // Subscriber decorators
  EventSubscriber,
  AfterLoad,
  BeforeInsert,
  AfterInsert,
  BeforeUpdate,
  AfterUpdate,
  BeforeRemove,
  AfterRemove,
  BeforeSoftRemove,
  AfterSoftRemove,
  BeforeRecover,
  AfterRecover,
  
  // Other decorators
  TableInheritance,
  EntityRepository,
} from 'typeorm';

// ============================================================================
// TypeORM Classes (for instanceof checks)
// ============================================================================

export {
  BaseEntity,
  EntityNotFoundError,
  QueryFailedError,
  CannotExecuteNotConnectedError,
} from 'typeorm';
