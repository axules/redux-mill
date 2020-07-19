import reduxMill from '../index';

describe('use reducerWrapper', () => {
  let wrapper = null;
  let reducer = {};
  const reducerWrapper = jest.fn((initState, reducerCallback) => {
    wrapper = jest.fn((currentState, action) => reducerCallback(currentState, action));
    return wrapper;
  });

  beforeEach(() => {
    reducerWrapper.mockClear();
    reducer = {
      SET: (state, name) => ({ ...state, name }),
      GET: {
        0: (state, payload) => ({ ...state, ...payload }),
        X: (state, { value }) => ({ ...state, value }),
        LOAD: (state) => ({ ...state, loading: true }),
      }
    };
  });

  it('should call reducerWrapper once for empty reducer', () => {
    const result = reduxMill({}, {}, 'myName', { reducerWrapper });
    expect(reducerWrapper.mock.calls.length).toBe(1);
    expect(reducerWrapper.mock.calls[0]).toEqual([{}, expect.any(Function)]);
    expect(wrapper.mock.calls.length).toBe(0);
    expect(result.myName).toBe(wrapper);
  });

  it('should call reducerWrapper once for not empty reducer', () => {
    const result = reduxMill({ a: 10 }, reducer, 'myName', { reducerWrapper });
    expect(reducerWrapper.mock.calls.length).toBe(1);
    expect(reducerWrapper.mock.calls[0]).toEqual([{ a: 10 }, expect.any(Function)]);
    expect(wrapper.mock.calls.length).toBe(0);
    expect(result.myName).toBe(wrapper);
  });

  it('should call reducerWrapper only when it is initializing', () => {
    const result = reduxMill({ a: 10 }, reducer, 'myName', { reducerWrapper });
    expect(reducerWrapper.mock.calls.length).toBe(1);
    expect(wrapper.mock.calls.length).toBe(0);

    result.myName({ b: 100 }, { type: 'some' });
    expect(reducerWrapper.mock.calls.length).toBe(1);
    expect(wrapper.mock.calls.length).toBe(1);
    expect(wrapper.mock.calls[0]).toEqual([{ b: 100 }, { type: 'some' }]);
  });

  it('should call wrapped action each time', () => {
    const result = reduxMill({ a: 10 }, reducer, 'myName', { reducerWrapper });
    result.myName({ b: 1 }, { type: 'some1' });
    result.myName({ c: 2 }, { type: 'some2' });
    result.myName({ d: 3 }, { type: 'some3' });
    result.myName({ e: 4 }, { type: 'GET_LOAD' });
    expect(wrapper.mock.calls.length).toBe(4);
    expect(wrapper.mock.calls[0]).toEqual([{ b: 1 }, { type: 'some1' }]);
    expect(wrapper.mock.calls[1]).toEqual([{ c: 2 }, { type: 'some2' }]);
    expect(wrapper.mock.calls[2]).toEqual([{ d: 3 }, { type: 'some3' }]);
    expect(wrapper.mock.calls[3]).toEqual([{ e: 4 }, { type: 'GET_LOAD' }]);

    expect(wrapper.mock.results[0].value).toEqual({ b: 1 });
    expect(wrapper.mock.results[1].value).toEqual({ c: 2 });
    expect(wrapper.mock.results[2].value).toEqual({ d: 3 });
    expect(wrapper.mock.results[3].value).toEqual({ e: 4, loading: true });
  });
});
