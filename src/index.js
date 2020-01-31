export const defaultConfig = {
  debug: false,
  divider: '_',
  stateDebug: false,
  mainKey: 0
};

/**
 * @param {Object} changes - object with properties
 * @returns {Object} - Object.assign(defaultConfig, config)
 */
export function extendConfig(config) {
  return Object.assign(defaultConfig, config);
}

export function isFunction(value) {
  return typeof value === 'function';
}

export function checkAllowedType(value) {
  const TYPES = ['object', 'function'];
  const type = typeof value;
  if (!TYPES.some(el => el === type)) {
    throw new Error('Value of redux rules should be one of types: ' + TYPES.join(', '));
  }
}

export function makeType(prefix, divider, key) {
  return `${prefix || ''}${prefix && key ? divider : ''}${key || ''}`;
}

export function consoleDebugLog(...args) {
  const title =
    args.length > 1 && typeof args[0] === 'string' ? args.shift() : null;
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
 * @param {Object} config - additional options { debug, stateDebug, divider, mainKey }
 * @returns {Object} - function(selector: function(store, ...args))
 */
export default function(initialState, rules, name, config = {}) {
  if (typeof rules !== 'object') throw new Error('Reducer should be Object');
  const { debug, divider, stateDebug, mainKey } = {
    ...defaultConfig,
    ...config
  };
  const debugLog = debug ? consoleDebugLog : () => null;
  // ----------------------------------------------------------
  // returns all of cases for rules-reducer
  function getCases(rules, path = '') {
    checkAllowedType(rules);
    if (!rules) return {};
    if (isFunction(rules)) return { [path]: rules.bind(void 0) };

    return Object.entries(rules).reduce((R, [key, value]) => {
      if (key == mainKey) {
        if (!isFunction(value)) {
          throw new Error(
            `[${path}.${key}] should be function. Because it is [${path}] reducer's base handler`
          );
        }
        R[path] = value.bind(void 0);
      } else {
        Object.assign(R, getCases(value, makeType(path, divider, key)));
      }
      return R;
    }, {});
  }

  // change rules, each key will be changed by action creator
  function transformToCreators(rules, prefix = '') {
    Object.entries(rules).forEach(([key, value]) => {
      const type = makeType(prefix, divider, key);

      rules[key] = function(payload) {
        debugLog(`[${type}] Action Creator`, key, type, payload);
        return { type, payload };
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
  }
  // ----------------------------------------------------------
  debugLog(name, config, initialState, rules);
  const cases = getCases(rules, '');
  debugLog('Redux cases', cases);
  transformToCreators(rules, '');
  debugLog('Rules were transformated', rules);

  const reducer = function(state = initialState, action = {}) {
    const { type, payload } = action;
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

  const customSelector = function(selector) {
    return function(state, ...args) {
      return selector(state[name], ...args);
    };
  };

  customSelector[name] = reducer;

  return customSelector;
}
