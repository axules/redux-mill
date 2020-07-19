"use strict";

exports.__esModule = true;
exports.extendConfig = extendConfig;
exports.isFunction = isFunction;
exports.checkAllowedType = checkAllowedType;
exports.makeType = makeType;
exports.consoleDebugLog = consoleDebugLog;
exports.default = _default;
exports.defaultConfig = void 0;
var defaultConfig = {
  debug: false,
  divider: '_',
  stateDebug: false,
  mainKey: 0
};
/**
 * @param {Object} changes - object with properties
 * @returns {Object} - Object.assign(defaultConfig, config)
 */

exports.defaultConfig = defaultConfig;

function extendConfig(config) {
  return Object.assign(defaultConfig, config);
}

function isFunction(value) {
  return typeof value === 'function';
}

function checkAllowedType(value) {
  var TYPES = ['object', 'function'];
  var type = typeof value;

  if (!TYPES.some(function (el) {
    return el === type;
  })) {
    throw new Error('Value of redux rules should be one of types: ' + TYPES.join(', '));
  }
}

function makeType(prefix, divider, key) {
  return "" + (prefix || '') + (prefix && key ? divider : '') + (key || '');
}

function consoleDebugLog() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var title = args.length > 1 && typeof args[0] === 'string' ? args.shift() : null;

  if (title) {
    // eslint-disable-next-line no-console
    console.groupCollapsed("MillDebug ::: " + title);
  }

  args.forEach(function (el) {
    return console.debug(el);
  });

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
 *  divider: String, default is '_',
 *  mainKey: String or Number, default is 0,
 *  reducerWrapper: Function(initState, Function(state, action)):Function(state, action),
 *  actionWrapper: Function(Function(state, payload, action)):Function(state, payload, action)
 * }
 * @returns {Object} - function(selector: function(store, ...args))
 */


function _default(initialState, rules, name, config) {
  if (config === void 0) {
    config = {};
  }

  if (typeof rules !== 'object') throw new Error('Reducer should be Object');

  var _defaultConfig$config = Object.assign({}, defaultConfig, {}, config),
      debug = _defaultConfig$config.debug,
      divider = _defaultConfig$config.divider,
      stateDebug = _defaultConfig$config.stateDebug,
      mainKey = _defaultConfig$config.mainKey,
      reducerWrapper = _defaultConfig$config.reducerWrapper,
      actionWrapper = _defaultConfig$config.actionWrapper;

  var debugLog = debug ? consoleDebugLog : function () {
    return null;
  };
  if (reducerWrapper && !isFunction(reducerWrapper)) throw new Error('reducerWrapper should be Function');
  if (actionWrapper && !isFunction(actionWrapper)) throw new Error('actionWrapper should be Function');

  function prepareAction(action) {
    var wrapped = actionWrapper ? actionWrapper(action.bind(void 0)) : action.bind(void 0);

    if (actionWrapper && !isFunction(wrapped)) {
      throw new Error('actionWrapper should return Function(state, action)');
    }

    return wrapped;
  } // ----------------------------------------------------------
  // returns all of cases for rules-reducer


  function getCases(rules, path) {
    if (path === void 0) {
      path = '';
    }

    checkAllowedType(rules);
    if (!rules) return {};

    if (isFunction(rules)) {
      var _ref;

      return _ref = {}, _ref[path] = prepareAction(rules), _ref;
    }

    return Object.entries(rules).reduce(function (R, _ref2) {
      var key = _ref2[0],
          value = _ref2[1];

      if (key == mainKey) {
        if (!isFunction(value)) {
          throw new Error("[" + path + "." + key + "] should be function. Because it is [" + path + "] reducer's base handler");
        }

        R[path] = prepareAction(value);
      } else {
        Object.assign(R, getCases(value, makeType(path, divider, key)));
      }

      return R;
    }, {});
  } // change rules, each key will be changed by action creator


  function transformToCreators(rules, prefix) {
    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(rules).forEach(function (_ref3) {
      var key = _ref3[0],
          value = _ref3[1];
      var type = makeType(prefix, divider, key);

      rules[key] = function (payload) {
        debugLog("[" + type + "] Action Creator", key, type, payload);
        return {
          type: type,
          payload: payload
        };
      };

      if (!isFunction(value)) {
        delete value[mainKey];
        Object.assign(rules[key], value);
        transformToCreators(rules[key], type);
      }

      rules[key]._ = type;

      rules[key].toString = function toString() {
        return type;
      };

      rules[key].valueOf = function valueOf() {
        return type;
      };
    });
    return rules;
  } // ----------------------------------------------------------


  debugLog(name, config, initialState, rules);
  var cases = getCases(rules, '');
  debugLog('Redux cases', cases);
  transformToCreators(rules, '');
  debugLog('Rules were transformated', rules);

  var reducer = function reducer(state, action) {
    if (state === void 0) {
      state = initialState;
    }

    if (action === void 0) {
      action = {};
    }

    var _action = action,
        type = _action.type,
        payload = _action.payload;
    var handler = cases[type];

    if (handler) {
      debugLog("[" + type + "] Handled", action);
      var newState = handler(state, payload, action);

      if (stateDebug) {
        consoleDebugLog("[" + type + "] State", newState);
      }

      return newState;
    }

    return state;
  };

  if (reducerWrapper) {
    debugLog('Reducer will be wrapped into reducerWrapper', cases);
  }

  var wrappedReducer = reducerWrapper ? reducerWrapper(initialState, reducer) : reducer;

  if (!isFunction(wrappedReducer)) {
    throw new Error('reducerWrapper should return Function(state, action)');
  }

  var customSelector = function customSelector(selector) {
    return function (state) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      return selector.apply(void 0, [state[name]].concat(args));
    };
  };

  customSelector[name] = wrappedReducer;
  return customSelector;
}