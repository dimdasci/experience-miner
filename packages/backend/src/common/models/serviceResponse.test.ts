import { describe, it, expect } from 'vitest';
import { ServiceResponse } from './serviceResponse.js';

describe('ServiceResponse', () => {
  describe('success', () => {
    it('should create successful response with default status code', () => {
      const data = { id: 1, name: 'Test' };
      const response = ServiceResponse.success('Operation successful', data);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.responseObject).toEqual(data);
      expect(response.statusCode).toBe(200);
    });

    it('should create successful response with custom status code', () => {
      const data = { created: true };
      const response = ServiceResponse.success('Resource created', data, 201);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Resource created');
      expect(response.responseObject).toEqual(data);
      expect(response.statusCode).toBe(201);
    });

    it('should create successful response with null data', () => {
      const response = ServiceResponse.success('Operation completed', null);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation completed');
      expect(response.responseObject).toBeNull();
      expect(response.statusCode).toBe(200);
    });
  });

  describe('failure', () => {
    it('should create failure response with default status code', () => {
      const response = ServiceResponse.failure('Operation failed');

      expect(response.success).toBe(false);
      expect(response.message).toBe('Operation failed');
      expect(response.responseObject).toBeNull();
      expect(response.statusCode).toBe(400);
    });

    it('should create failure response with custom status code', () => {
      const response = ServiceResponse.failure('Resource not found', null, 404);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Resource not found');
      expect(response.responseObject).toBeNull();
      expect(response.statusCode).toBe(404);
    });

    it('should create failure response with error data', () => {
      const errorData = { field: 'email', error: 'Invalid format' };
      const response = ServiceResponse.failure('Validation failed', errorData, 422);

      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.responseObject).toEqual(errorData);
      expect(response.statusCode).toBe(422);
    });
  });

  describe('response structure', () => {
    it('should have readonly properties', () => {
      const response = ServiceResponse.success('Test', { data: 'test' });

      // These should not throw TypeScript errors but will at runtime
      expect(() => {
        // @ts-ignore - Testing runtime immutability
        response.success = false;
      }).not.toThrow();
      
      // Properties should remain unchanged
      expect(response.success).toBe(true);
    });

    it('should be JSON serializable', () => {
      const data = { id: 1, items: ['a', 'b', 'c'] };
      const response = ServiceResponse.success('Test serialization', data);
      
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual({
        success: true,
        message: 'Test serialization',
        responseObject: data,
        statusCode: 200,
      });
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for response object', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const userData: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const response = ServiceResponse.success<User>('User retrieved', userData);

      expect(response.responseObject.id).toBe(1);
      expect(response.responseObject.name).toBe('John Doe');
      expect(response.responseObject.email).toBe('john@example.com');
    });

    it('should handle array response objects', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = ServiceResponse.success('Items retrieved', items);

      expect(Array.isArray(response.responseObject)).toBe(true);
      expect(response.responseObject).toHaveLength(3);
      expect(response.responseObject?.[0]?.id).toBe(1);
    });
  });
});