"use strict";

exports.__esModule = true;
exports.checkAllowedType = checkAllowedType;
exports.consoleDebugLog = consoleDebugLog;
exports.default = _default;
exports.defaultConfig = void 0;
exports.extendConfig = extendConfig;
exports.isFunction = isFunction;
exports.makeType = makeType;
const defaultConfig = exports.defaultConfig = {
  debug: false,
  stateDebug: false,
  nameAsPrefix: false,
  divider: '_',
  mainKey: 0
};

/**
 * @param {Object} changes - object with properties
 * @returns {Object} - Object.assign(defaultConfig, config)
 */
function extendConfig(config) {
  return Object.assign(defaultConfig, config);
}
function isFunction(value) {
  return typeof value === 'function';
}
function checkAllowedType(value) {
  const TYPES = ['object', 'function'];
  const type = typeof value;
  if (!TYPES.some(el => el === type)) {
    throw new Error('Value of redux rules should be one of types: ' + TYPES.join(', '));
  }
}
function makeType(prefix, divider, key) {
  return `${prefix || ''}${prefix && key ? divider : ''}${key || ''}`;
}
function consoleDebugLog() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  const title = args.length > 1 && typeof args[0] === 'string' ? args.shift() : null;
  if (title) {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`MillDebug ::: ${title}`);
  }
  args.forEach(el => console.debug(el));
  if (title) {
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}

/**
 * @param {Object} initialState - default state
 * @param {Object} rules - Your reducer. Object or instance of class
 * @param {String} name - it is name for redux store
 * @param {Object} config - additional options {
 *  debug: Bool, default is false,
 *  stateDebug: Bool, default is false,
 *  nameAsPrefix: Bool, default is false,
 *  divider: String, default is '_',
 *  mainKey: String or Number, default is 0,
 *  reducerWrapper: Function(initState, Function(state, action)):Function(state, action),
 *  actionWrapper: Function(Function(state, payload, action)):Function(state, payload, action)
 *  actionCreatorWrapper: Function(Function(payload)):Function(payload)
 * }
 * @returns {Object} - function(selector: function(store, ...args))
 */
function _default(initialState, rules, name, config) {
  if (config === void 0) {
    config = {};
  }
  if (typeof rules !== 'object') throw new Error('Reducer should be Object');
  const {
    debug,
    divider,
    stateDebug,
    mainKey,
    reducerWrapper,
    actionWrapper,
    actionCreatorWrapper,
    nameAsPrefix
  } = {
    ...defaultConfig,
    ...config
  };
  const debugLog = debug ? consoleDebugLog : () => null;
  if (reducerWrapper && !isFunction(reducerWrapper)) throw new Error('reducerWrapper should be Function');
  if (actionWrapper && !isFunction(actionWrapper)) throw new Error('actionWrapper should be Function');
  if (actionCreatorWrapper && !isFunction(actionCreatorWrapper)) throw new Error('actionCreatorWrapper should be Function');
  function prepareAction(action) {
    const wrapped = actionWrapper ? actionWrapper(action.bind(void 0)) : action.bind(void 0);
    if (actionWrapper && !isFunction(wrapped)) {
      throw new Error('actionWrapper should return Function(state, payload, action)');
    }
    return wrapped;
  }

  // ----------------------------------------------------------
  // returns all of cases for rules-reducer
  function getCases(rules, path) {
    if (path === void 0) {
      path = '';
    }
    checkAllowedType(rules);
    if (!rules) return {};
    if (isFunction(rules)) {
      return {
        [path]: prepareAction(rules)
      };
    }
    return Object.entries(rules).reduce((R, _ref) => {
      let [key, value] = _ref;
      if (key == mainKey) {
        if (!isFunction(value)) {
          throw new Error(`[${path}.${key}] should be function. Because it is [${path}] reducer's base handler`);
        }
        R[path] = prepareAction(value);
      } else {
        Object.assign(R, getCases(value, makeType(path, divider, key)));
      }
      return R;
    }, {});
  }

  // change rules, each key will be changed by action creator
  function transformToCreators(rules, prefix) {
    if (prefix === void 0) {
      prefix = '';
    }
    Object.entries(rules).forEach(_ref2 => {
      let [key, value] = _ref2;
      const type = makeType(prefix, divider, key);
      const actionCreator = function (payload) {
        debugLog(`[${type}] Action Creator`, key, type, payload);
        return {
          type,
          payload
        };
      };
      rules[key] = actionCreatorWrapper ? actionCreatorWrapper(actionCreator, type) : actionCreator;
      if (!isFunction(rules[key])) {
        throw new Error('actionCreatorWrapper should return Function(payload):Object');
      }
      if (!isFunction(value)) {
        delete value[mainKey];
        Object.assign(rules[key], value);
        transformToCreators(rules[key], type);
      }
      rules[key]._ = type;
      rules[key].type = type;
      rules[key].toString = function toString() {
        return type;
      };
      rules[key].valueOf = function valueOf() {
        return type;
      };
    });
    return rules;
  }
  // ----------------------------------------------------------
  debugLog(name, config, initialState, rules);
  const initPrefix = nameAsPrefix ? name : '';
  const cases = getCases(rules, initPrefix);
  debugLog('Redux cases', cases);
  transformToCreators(rules, initPrefix);
  debugLog('Rules were transformed', rules);
  const reducer = function (state, action) {
    if (state === void 0) {
      state = initialState;
    }
    if (action === void 0) {
      action = {};
    }
    const {
      type,
      payload
    } = action;
    const handler = cases[type];
    if (handler) {
      debugLog(`[${type}] Handled`, action);
      const newState = handler(state, payload, action);
      if (stateDebug) {
        consoleDebugLog(`[${type}] State`, newState);
      }
      return newState;
    }
    return state;
  };
  if (reducerWrapper) {
    debugLog('Reducer will be wrapped into reducerWrapper', cases);
  }
  const wrappedReducer = reducerWrapper ? reducerWrapper(initialState, reducer) : reducer;
  if (!isFunction(wrappedReducer)) {
    throw new Error('reducerWrapper should return Function(state, action)');
  }
  const customSelector = function (selector) {
    return function (state) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }
      return selector(state[name], ...args);
    };
  };
  customSelector[name] = wrappedReducer;
  return customSelector;
}