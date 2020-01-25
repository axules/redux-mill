import { isFunction } from '../index';

describe('isFunction', () => {
  it('should return true for arrow function', () => {
    expect(isFunction(() => {})).toBeTruthy();
  });

  it('should return true for declarative function', () => {
    expect(isFunction(function () {})).toBeTruthy();
  });

  it('should return false for numeric', () => {
    expect(isFunction(10)).toBeFalsy();
  });

  it('should return false for object', () => {
    expect(isFunction({})).toBeFalsy();
  });

  it('should return false for empty value', () => {
    expect(isFunction()).toBeFalsy();
  });
});
