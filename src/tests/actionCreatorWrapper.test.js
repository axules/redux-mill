import reduxMill from '../index';

describe('use actionCreatorWrapper', () => {
  let wrapperCalls = [];
  let reducer = {};
  const actionCreatorWrapper = jest.fn((baseActionCreator) => {
    return (payload, meta = {}) => {
      wrapperCalls.push([payload, meta]);
      const action = baseActionCreator(payload);
      return { ...action, meta };
    };
  });

  beforeEach(() => {
    actionCreatorWrapper.mockClear();
    wrapperCalls = [];
    reducer = {
      SET: (state, name) => ({ ...state, name }),
      GET: {
        0: (state, payload) => ({ ...state, ...payload }),
        X: (state, { value }) => ({ ...state, value }),
        LOAD: (state) => ({ ...state, loading: true }),
      }
    };
  });

  it('should not call in initialization for empty reducer', () => {
    reduxMill({}, {}, 'myName', { actionCreatorWrapper });
    expect(actionCreatorWrapper.mock.calls.length).toBe(0);
    expect(wrapperCalls.length).toBe(0);
  });

  it('should call in initialization for each action', () => {
    reduxMill({}, reducer, 'myName', { actionCreatorWrapper });
    const { calls: mockCalls } = actionCreatorWrapper.mock;

    expect(mockCalls.length).toBe(4);

    expect(mockCalls[0][1]).toEqual(reducer.SET.type);
    expect(mockCalls[1][1]).toEqual(reducer.GET.type);
    expect(mockCalls[2][1]).toEqual(reducer.GET.X.type);
    expect(mockCalls[3][1]).toEqual(reducer.GET.LOAD.type);

    expect(mockCalls[0][0]('1')).toEqual({ type: reducer.SET.type, payload: '1' });
    expect(mockCalls[1][0]('2')).toEqual({ type: reducer.GET.type, payload: '2' });
    expect(mockCalls[2][0]('3')).toEqual({ type: reducer.GET.X.type, payload: '3' });
    expect(mockCalls[3][0]('4')).toEqual({ type: reducer.GET.LOAD.type, payload: '4' });

    expect(wrapperCalls.length).toBe(0);
  });

  it('should use result of call instead of default action creator', () => {
    reduxMill({}, reducer, 'myName', { actionCreatorWrapper });
    const { calls: mockCalls, results: mockResults } = actionCreatorWrapper.mock;
    const defaultActionCreators = mockCalls.map(([fn]) => fn);

    expect(defaultActionCreators).not.toContain(reducer.SET);
    expect(defaultActionCreators).not.toContain(reducer.GET);
    expect(defaultActionCreators).not.toContain(reducer.GET.X);
    expect(defaultActionCreators).not.toContain(reducer.GET.LOAD);

    expect(reducer.SET).toBe(mockResults[0].value);
    expect(reducer.GET).toBe(mockResults[1].value);
    expect(reducer.GET.X).toBe(mockResults[2].value);
    expect(reducer.GET.LOAD).toBe(mockResults[3].value);

    expect(reducer.SET('1', 'meta-1')).toEqual({ type: reducer.SET.type, payload: '1', meta: 'meta-1' });
    expect(reducer.GET('2', 'meta-2')).toEqual({ type: reducer.GET.type, payload: '2', meta: 'meta-2' });
    expect(reducer.GET.X('3', 'meta-3')).toEqual({ type: reducer.GET.X.type, payload: '3', meta: 'meta-3' });
    expect(reducer.GET.LOAD('4', 'meta-4')).toEqual({ type: reducer.GET.LOAD.type, payload: '4', meta: 'meta-4' });
  });
});
