'use strict';

import {
  reducer,
  reducerEnhancer,
  UPDATE_UI_STATE
} from '../../src/action-reducer.js';

import { assert } from 'chai';
import _ from 'lodash/fp';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { defaultState } from '../../src/action-reducer.js';

const customReducer = (state, action) => {
  if (action.type === 'CUSTOM_ACTION_TYPE') {
    return _.set('isHooked', true, state);
  }
  return state;
}
const enhancedReducer = reducerEnhancer(customReducer);

describe('reducerEnhancer', () => {
  let enhancedStore;

  beforeEach( () => {
    enhancedStore = createStore(combineReducers({ ui: enhancedReducer }));
  });

  it('delegates to the default reducer', () => {
    assert.isTrue(_.isEqual(enhancedStore.getState().ui, defaultState));

    enhancedStore.dispatch({
      type: UPDATE_UI_STATE,
      payload: {
        key: 'a',
        name: 'foo',
        value: 'bar'
      }
    });

    assert.isTrue(
      _.isEqual(
        enhancedStore.getState().ui,
        {
          __reducers: {},
          a: { foo: 'bar' }
        }
      )
    );
  });

  it('intercepts custom actions', () => {
    assert.isTrue(_.isEqual(enhancedStore.getState().ui, defaultState));

    enhancedStore.dispatch({
      type: 'CUSTOM_ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    });
    assert.isTrue(
      _.isEqual(
        enhancedStore.getState().ui,
        {
          __reducers: {},
          isHooked: true
        }
      )
    );
  });

});
