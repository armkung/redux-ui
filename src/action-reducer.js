'use strict';

import _ from 'lodash/fp';
import deepAssign from 'deep-assign';
import invariant from 'invariant';

// For updating multiple UI variables at once.  Each variable might be part of
// a different context; this means that we need to either call updateUI on each
// key of the object to update or do transformations within one action in the
// reducer. The latter only triggers one store change event and is more
// performant.
export const MASS_UPDATE_UI_STATE = '@@redux-ui/MASS_UPDATE_UI_STATE';
export const UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
export const SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

// These are private consts used in actions only given to the UI decorator.
const MOUNT_UI_STATE = '@@redux-ui/MOUNT_UI_STATE';
const UNMOUNT_UI_STATE = '@@redux-ui/UNMOUNT_UI_STATE';

export const defaultState = {
  __reducers: {
    // This contains an object of component paths (joined by '.') to an object
    // containing the fully qualified path and the reducer function:
    // 'parent.child': {
    //   path: ['parent', 'child'],
    //   func: (state, action) => { ... }
    // }
  }
};

export default function reducer(state = defaultState, action) {
  let key = action.payload && (action.payload.key || []);

  if (!Array.isArray(key)) {
    key = [key];
  }

  switch (action.type) {
    case UPDATE_UI_STATE:
      const { name, value } = action.payload;
      state = _.set(key.concat(name), value, state);
      break;

    case MASS_UPDATE_UI_STATE:
      const { uiVars, transforms } = action.payload;
      let s = Object.assign({}, state);

      Object.keys(transforms).forEach(k => {
        const path = uiVars[k];
        invariant(
          path,
          `Couldn't find variable ${k} within your component's UI state ` +
          `context. Define ${k} before using it in the @ui decorator`
        );

        s = _.set(path.concat(k), transforms[k], s);
      });

      state = Object.assign({}, s)
      break;

    case SET_DEFAULT_UI_STATE:
      // Replace all UI under a key with the given values
      state = _.set(key, action.payload.value, state);
      break;

    case MOUNT_UI_STATE:
      const { defaults, customReducer } = action.payload;
      state = _.set(key, defaults, state)

      if (customReducer) {
        let path = key.join('.');
        console.log()
        state = _.set(['__reducers', path], {
          path: key,
          func: customReducer
        }, state);
      }
      break;

    case UNMOUNT_UI_STATE:
      // We have to use deleteIn as react unmounts root components first;
      // this means that using setIn in child contexts will fail as the root
      // context will be stored as undefined in our state
      state = _.unset(key, state)
      state = _.unset(['__reducers', key.join('.')], state)
      break;
  }

  const customReducers = state['__reducers'];
  if (_.size(customReducers) > 0) {
    let s = Object.assign({}, state);
    Object.keys(customReducers).forEach((k) => {
      const { path, func } = customReducers[k];
      const newState = func(_.get(path, s), action);
      if (newState === undefined) {
        throw new Error(`Your custom UI reducer at path ${path.join('.')} must return some state`);
      }
      // console.log(newState);
      s = _.set(path, newState, s);
    });

    state = Object.assign({}, s);
  }

  return state;
}

export const reducerEnhancer = (customReducer) => (state, action) => {
  state = reducer(state, action);
  if (typeof customReducer === 'function') {
    state = customReducer(state, action);
  }
  return state;
}

export function updateUI(key, name, value) {
  return {
    type: UPDATE_UI_STATE,
    payload: {
      key,
      name,
      value
    }
  };
};

export function massUpdateUI(uiVars, transforms) {
  return {
    type: MASS_UPDATE_UI_STATE,
    payload: {
      uiVars,
      transforms
    }
  };
}

// Exposed to components, allowing them to reset their and all child scopes to
// the default variables set up
export function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key,
      value
    }
  };
};

/** Private, decorator only actions **/

// This is not exposed to your components; it's only used in the decorator.
export function unmountUI(key) {
  return {
    type: UNMOUNT_UI_STATE,
    payload: {
      key
    }
  };
};

/**
 * Given the key/path, set of defaults and custom reducer for a UI component
 * during construction prepare the state of the UI reducer
 *
 */
export function mountUI(key, defaults, customReducer) {
  return {
    type: MOUNT_UI_STATE,
    payload: {
      key,
      defaults,
      customReducer
    }
  }
}
