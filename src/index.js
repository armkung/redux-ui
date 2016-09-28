'use strict';

import ui from './ui';
import reducer, { updateUI, mountUI, unmountUI, setDefaultUI, UPDATE_UI_STATE, SET_DEFAULT_UI_STATE } from './action-reducer';

export default ui;
export { reducer };
export { UPDATE_UI_STATE, SET_DEFAULT_UI_STATE };
export const action = { updateUI, mountUI, unmountUI, setDefaultUI };
