import { describe, it, expect } from 'vitest';
import * as TypeOrmPlugin from '../src/index.js';

describe('Package Exports', () => {
  describe('Injection Tokens', () => {
    it('should export TYPEORM_DATA_SOURCE', () => {
      expect(TypeOrmPlugin.TYPEORM_DATA_SOURCE).toBeDefined();
    });

    it('should export TYPEORM_ENTITY_MANAGER', () => {
      expect(TypeOrmPlugin.TYPEORM_ENTITY_MANAGER).toBeDefined();
    });
  });

  describe('Providers', () => {
    it('should export TypeOrmProvider', () => {
      expect(TypeOrmPlugin.TypeOrmProvider).toBeDefined();
      expect(typeof TypeOrmPlugin.TypeOrmProvider).toBe('function');
    });

    it('should export createTypeOrmProvider', () => {
      expect(TypeOrmPlugin.createTypeOrmProvider).toBeDefined();
      expect(typeof TypeOrmPlugin.createTypeOrmProvider).toBe('function');
    });

    it('should export configureTypeOrm', () => {
      expect(TypeOrmPlugin.configureTypeOrm).toBeDefined();
      expect(typeof TypeOrmPlugin.configureTypeOrm).toBe('function');
    });
  });

  describe('TypeORM Entity Decorators', () => {
    it('should export Entity decorator', () => {
      expect(TypeOrmPlugin.Entity).toBeDefined();
      expect(typeof TypeOrmPlugin.Entity).toBe('function');
    });

    it('should export Column decorator', () => {
      expect(TypeOrmPlugin.Column).toBeDefined();
      expect(typeof TypeOrmPlugin.Column).toBe('function');
    });

    it('should export PrimaryGeneratedColumn decorator', () => {
      expect(TypeOrmPlugin.PrimaryGeneratedColumn).toBeDefined();
      expect(typeof TypeOrmPlugin.PrimaryGeneratedColumn).toBe('function');
    });

    it('should export relation decorators', () => {
      expect(TypeOrmPlugin.OneToOne).toBeDefined();
      expect(TypeOrmPlugin.OneToMany).toBeDefined();
      expect(TypeOrmPlugin.ManyToOne).toBeDefined();
      expect(TypeOrmPlugin.ManyToMany).toBeDefined();
      expect(TypeOrmPlugin.JoinColumn).toBeDefined();
      expect(TypeOrmPlugin.JoinTable).toBeDefined();
    });

    it('should export timestamp column decorators', () => {
      expect(TypeOrmPlugin.CreateDateColumn).toBeDefined();
      expect(TypeOrmPlugin.UpdateDateColumn).toBeDefined();
      expect(TypeOrmPlugin.DeleteDateColumn).toBeDefined();
    });

    it('should export index decorators', () => {
      expect(TypeOrmPlugin.Index).toBeDefined();
      expect(TypeOrmPlugin.Unique).toBeDefined();
    });

    it('should export subscriber decorators', () => {
      expect(TypeOrmPlugin.EventSubscriber).toBeDefined();
      expect(TypeOrmPlugin.BeforeInsert).toBeDefined();
      expect(TypeOrmPlugin.AfterInsert).toBeDefined();
      expect(TypeOrmPlugin.BeforeUpdate).toBeDefined();
      expect(TypeOrmPlugin.AfterUpdate).toBeDefined();
    });
  });

  describe('TypeORM Classes', () => {
    it('should export BaseEntity', () => {
      expect(TypeOrmPlugin.BaseEntity).toBeDefined();
    });

    it('should export error classes', () => {
      expect(TypeOrmPlugin.EntityNotFoundError).toBeDefined();
      expect(TypeOrmPlugin.QueryFailedError).toBeDefined();
    });
  });
});

