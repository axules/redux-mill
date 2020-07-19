import reduxMill from '../index';

describe('use actionWrapper', () => {
  let wrapperCalls = [];
  let wrapperResults = [];
  let reducer = {};
  const actionWrapper = jest.fn((actionCB) => {
    return jest.fn((currentState, payload, action) => {
      wrapperCalls.push([currentState, payload, action]);
      const r = actionCB(currentState, payload, action);
      wrapperResults.push(r);
      return r;
    });
  });

  beforeEach(() => {
    actionWrapper.mockClear();
    wrapperCalls = [];
    wrapperResults = [];
    reducer = {
      SET: (state, name) => ({ ...state, name }),
      GET: {
        0: (state, payload) => ({ ...state, ...payload }),
        X: (state, { value }) => ({ ...state, value }),
        LOAD: (state) => ({ ...state, loading: true }),
      }
    };
  });

  it('should not call actionWrapper in initialization for empty reducer', () => {
    reduxMill({}, {}, 'myName', { actionWrapper });
    expect(actionWrapper.mock.calls.length).toBe(0);
    expect(wrapperCalls.length).toBe(0);
  });

  it('should call actionWrapper in initialization for each action', () => {
    reduxMill({}, reducer, 'myName', { actionWrapper });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(0);
  });

  it('should not call wrapped action for undefined action type', () => {
    const result = reduxMill({ a: 10 }, reducer, 'myName', { actionWrapper });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(0);

    result.myName({ b: 100 }, { type: 'some' });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(0);
  });

  it('should not call wrapped action for defined action type', () => {
    const result = reduxMill({ a: 10 }, reducer, 'myName', { actionWrapper });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(0);

    result.myName({ b: 1 }, { type: 'some' });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(0);

    result.myName({ c: 2 }, { type: 'SET' });
    expect(actionWrapper.mock.calls.length).toBe(4);
    expect(wrapperCalls.length).toBe(1);
    expect(wrapperCalls[0]).toEqual([{ c: 2 }, undefined, { type: 'SET' }]);

    const payload = { value: 100 };
    result.myName({ d: 3 }, { type: 'GET_X', payload });
    expect(wrapperCalls.length).toBe(2);
    expect(wrapperCalls[1]).toEqual([{ d: 3 }, payload, { type: 'GET_X', payload }]);

    expect(wrapperResults[0]).toEqual({ c: 2, name: undefined });
    expect(wrapperResults[1]).toEqual({ d: 3, value: 100 });
  });
});
