import reduxMill from '../index';

describe('reduxMill', () => {
  it('should return store for empty reducer', () => {
    const result = reduxMill({}, {}, 'myName');
    expect(result).toBeDefined();
    expect(typeof(result)).toBe('function');
  });

  it('should return object with `myName` function property', () => {
    const result = reduxMill({}, {}, 'myName');
    expect(Object.keys(result)).toEqual(['myName']);
    expect(typeof(result.myName)).toBe('function');
    expect(result.myName.length).toEqual(2);
  });

  it('should throw error when action is not function or object', () => {
    expect(() => {
      reduxMill({}, { Z: 10 }, 'aaa');
    }).toThrowError(/Value of redux rules should be one of types/);
  });

  it('should throw error once reducer is number (not object)', () => {
    expect(() => {
      reduxMill({}, 5, 'aaa');
    }).toThrowError(/Reducer should be Object/);
  });

  it('should throw error once reducer is function (not object)', () => {
    expect(() => {
      reduxMill({}, function() {}, 'aaa');
    }).toThrowError(/Reducer should be Object/);
  });

  it('should throw error once main reducer is not a function', () => {
    expect(() => {
      reduxMill({}, { A: { 0: {} } }, 'aaa');
    }).toThrowError(/should be function. Because it is/);
  });

  describe('> Selector', () => {
    it('should have selector for state with initial state', () => {
      const initState = { a: 10, b: 20 };
      const result = reduxMill(initState, {}, 'myName', {});
      const store = { myName: { ...initState } };
      const select = result(state => state);
      expect(typeof select).toBe('function');
      expect(select(store)).toEqual(initState);
    });

    it('should have selector for state', () => {
      const initState = { a: 10, b: 20 };
      const result = reduxMill(initState, {}, 'myName', {});
      const store = { myName: { ...initState } };
      const selectA = result(state => state.a);
      expect(selectA(store)).toBe(10);
    });
  });

  describe('> State cases', () => {
    let reducer = {};
    const initState = {
      a: 10,
      b: 20,
      name: 'default',
      value: null,
    };

    beforeEach(() => {
      reducer = {
        SET: (state, name) => ({ ...state, name }),
        GET: {
          0: (state, payload) => ({ ...state, ...payload }),
          X: (state, { value }) => ({ ...state, value }),
          LOAD: (state) => ({ ...state, loading: true }),
        }
      };
    });

    it('should return new state by specific action', () => {
      const result = reduxMill(initState, reducer, 'myName');
      const newState = result.myName(undefined, reducer.SET('TestName'));
      expect(newState).toEqual({ ...initState, name: 'TestName' });
    });

    it('should return new state by deep specific action', () => {
      const result = reduxMill(initState, reducer, 'myName');
      const newState = result.myName(undefined, reducer.GET.X({ value: '999' }));
      expect(newState).toEqual({ ...initState, value: '999' });
    });

    it('should return new state by root action', () => {
      const result = reduxMill(initState, reducer, 'myName');
      const newState = result.myName(undefined, reducer.GET({ zzz: 888 }));
      expect(newState).toEqual({ ...initState, zzz: 888 });
    });

    it('should return new state by action', () => {
      const result = reduxMill(initState, reducer, 'myName');
      const newState = result.myName({ zzz: 777 }, reducer.GET({ zzz: 888 }));
      expect(newState).toEqual({ zzz: 888 });
    });

    it('should return state by undefined action', () => {
      const result = reduxMill(initState, reducer, 'myName');
      const newState = result.myName(undefined, { type: 'uuuu' });
      expect(newState).toBe(initState);
    });

    it('should work with console debugging', () => {
      const result = reduxMill(initState, reducer, 'myName', { debug: true, stateDebug: true });
      const newState = result.myName({ zzz: 777 }, reducer.GET({ zzz: 888 }));
      expect(newState).toEqual({ zzz: 888 });
    });
  });

  describe('> Reducer', () => {
    let reducer = {};
    const initState = {
      a: 10,
      b: 20,
      name: 'default',
      value: null,
    };

    beforeEach(() => {
      reducer = {
        SAVE: (state, payload) => ({ ...state, ...payload }),
        SET: (state, name) => ({ ...state, name }),
        GET: {
          0: (state) => state,
          X: (state, { value }) => ({ ...state, value }),
          LOAD: (state) => ({ ...state, loading: true }),
        }
      };
    });

    it('should contain action creators for each key', () => {
      reduxMill(initState, reducer, 'myName', {});
      expect(typeof reducer.SAVE).toBe('function');
      expect(typeof reducer.SET).toBe('function');
      expect(typeof reducer.GET).toBe('function');
      expect(reducer.GET[0]).toBeUndefined();
      expect(typeof reducer.GET.X).toBe('function');
      expect(typeof reducer.GET.LOAD).toBe('function');
    });

    it('should contain main action creator with custom main key', () => {
      reduxMill(initState, reducer, 'myName', { mainKey: 'X' });
      expect(typeof reducer.SAVE).toBe('function');
      expect(typeof reducer.SET).toBe('function');
      expect(typeof reducer.GET).toBe('function');
      expect(typeof reducer.GET[0]).toBe('function');
      expect(reducer.GET.X).toBeUndefined();
      expect(typeof reducer.GET.LOAD).toBe('function');
    });

    it('should contain action creators that can be converted to string', () => {
      reduxMill(initState, reducer, 'myName', { });
      expect(reducer.GET.toString()).toBe('GET');
      expect(reducer.GET.LOAD.toString()).toBe('GET_LOAD');
      expect(String(reducer.GET)).toBe('GET');
      expect(String(reducer.GET.LOAD)).toBe('GET_LOAD');
    });

    it('should contain action creators that can be converted to value', () => {
      reduxMill(initState, reducer, 'myName', { });
      expect(reducer.GET.valueOf()).toBe('GET');
      expect(reducer.GET.LOAD.valueOf()).toBe('GET_LOAD');
      expect(reducer.GET + '!').toBe('GET!');
      expect(reducer.GET.LOAD + '!').toBe('GET_LOAD!');
      expect(reducer.GET == 'GET').toBeTruthy();
      expect(reducer.GET.LOAD == 'GET_LOAD').toBeTruthy();
    });

    it('should contain action creators that has property `_` with action type string', () => {
      reduxMill(initState, reducer, 'myName', { });
      expect(reducer.GET._).toBe('GET');
      expect(reducer.GET.LOAD._).toBe('GET_LOAD');
    });

    it('should contain action creators with custom divider in type', () => {
      reduxMill(initState, reducer, 'myName', { divider: '_x_' });
      expect(reducer.GET._).toBe('GET');
      expect(reducer.GET.LOAD._).toBe('GET_x_LOAD');
    });

    it('should contain action creators with string type', () => {
      reduxMill(initState, reducer, 'myName');
      const type = 'GET_LOAD';
      expect(reducer.GET.LOAD._).toBe(type);
      expect(reducer.GET.LOAD.toString()).toBe(type);
      expect(reducer.GET.LOAD.valueOf()).toBe(type);
    });

    it('> AC should return object with type and payload', () => {
      reduxMill(initState, reducer, 'myName');
      const payload = { a: 1, b: 2 };
      expect(reducer.GET.LOAD(payload)).toEqual({
        type: 'GET_LOAD',
        payload,
      });
    });

    it('> AC should return object with type with custom divider', () => {
      reduxMill(initState, reducer, 'myName', { divider: '---' });
      const payload = { a: 1, b: 2 };
      expect(reducer.GET.LOAD(payload)).toEqual({
        type: 'GET---LOAD',
        payload,
      });
    });
  });
});